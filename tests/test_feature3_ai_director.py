import os
import sys
import json
import random
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.ai_director import (
    _default_zone_for_type,
    align_phrase_to_clip_time,
    _normalize_motion_events,
    _make_window_short,
    _compile_deterministic_fallback,
    remix_clip_motion_events,
)
from backend.services.custom_scene_generator import (
    validate_custom_scene_code,
    compile_with_esbuild,
    generate_custom_scene,
    build_synthesized_fallback_tsx,
    FALLBACK_CUSTOM_SCENE_TSX,
)


class TestFeature3AiDirectorAndMotionGraphics(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.sample_words = [
            {"word": "30", "start": 0.20, "end": 0.50},
            {"word": "viral", "start": 0.55, "end": 0.90},
            {"word": "claude", "start": 0.95, "end": 1.40},
            {"word": "plugins", "start": 1.45, "end": 1.85},
            {"word": "senior", "start": 2.10, "end": 2.50},
            {"word": "developer", "start": 2.55, "end": 3.00},
            {"word": "superpowers", "start": 3.10, "end": 3.80},
            {"word": "codebase", "start": 4.10, "end": 4.60},
            {"word": "researcher", "start": 4.65, "end": 5.20},
            {"word": "automated", "start": 5.40, "end": 5.90},
            {"word": "pipeline", "start": 6.00, "end": 6.60},
        ]

    def test_default_zone_mapping_for_new_archetypes(self):
        """Verify that newly introduced archetypes default to top_stage zone."""
        self.assertEqual(_default_zone_for_type("power_meter_gauge"), "top_stage")
        self.assertEqual(_default_zone_for_type("showcase_carousel"), "top_stage")
        self.assertEqual(_default_zone_for_type("keyword_cascade_takeover"), "full_takeover")
        self.assertEqual(_default_zone_for_type("poster_slam"), "center_spotlight")

    def test_align_phrase_to_clip_time_with_anticipatory_lead(self):
        """Verify that word alignment snaps with an exact 60ms anticipatory lead."""
        # Align exact phrase
        aligned = align_phrase_to_clip_time(
            phrase="superpowers",
            clip_words=self.sample_words,
            fallback_sec=8.0,
            clip_start=0.0,
        )
        self.assertEqual(aligned, 3.04)

        # Fallback to extra_tokens when phrase is empty or mismatched
        fallback_aligned = align_phrase_to_clip_time(
            phrase="",
            clip_words=self.sample_words,
            fallback_sec=4.0,
            clip_start=0.0,
            extra_tokens=["codebase", "researcher"],
        )
        self.assertEqual(fallback_aligned, 4.04)

    def test_normalize_motion_events_beat_spacing(self):
        """Verify that _normalize_motion_events enforces >= 1.4s separation between beats."""
        raw_events = [
            {
                "time_sec": 0.0,
                "duration_sec": 2.0,
                "type": "editorial_split",
                "text": "HOOK",
            },
            {
                "time_sec": 0.5,  # Congested timestamp (< 1.4s gap)
                "duration_sec": 2.2,
                "type": "power_meter_gauge",
                "text": "POWER LEVEL",
            },
            {
                "time_sec": 1.2,  # Another congested timestamp
                "duration_sec": 2.4,
                "type": "showcase_carousel",
                "text": "PIPELINE",
            },
        ]

        normalized = _normalize_motion_events(
            raw_events=raw_events,
            clip_words=self.sample_words,
            clip_start=0.0,
            clip_dur=25.0,
            viral_title="30 Viral Plugins",
            rng=random.Random(42),
        )

        for i in range(1, len(normalized)):
            gap = normalized[i]["time_sec"] - normalized[i - 1]["time_sec"]
            self.assertGreaterEqual(gap, 1.4)

    def test_make_window_short_choreographed_beats(self):
        """Verify _make_window_short generates a multi-beat sequence with new archetypes and no emojis."""
        rng = random.Random(1234)
        # When words do not contain a genuine percentage, kinetic_word_wall is chosen (no fake stats)
        window = _make_window_short(
            rank=1,
            start_sec=0.0,
            end_sec=28.0,
            words=self.sample_words,
            rng=rng,
            niche_hint="Claude",
        )

        self.assertIn("motion_events", window)
        events = window["motion_events"]
        self.assertGreaterEqual(len(events), 3)

        types_present = [e["type"] for e in events]
        self.assertIn("editorial_split", types_present)
        self.assertIn("kinetic_word_wall", types_present)
        self.assertIn("explainer_timeline_takeover", types_present)

        # When words DO contain a genuine percentage, radial_gauge_stat is selected
        words_with_pct = [dict(w) for w in self.sample_words]
        words_with_pct[0]["word"] = "30%"
        window_pct = _make_window_short(
            rank=1,
            start_sec=0.0,
            end_sec=28.0,
            words=words_with_pct,
            rng=random.Random(1234),
            niche_hint="Claude",
        )
        types_pct = [e["type"] for e in window_pct["motion_events"]]
        self.assertIn("radial_gauge_stat", types_pct)

        # Check for zero emojis
        full_text = json.dumps(window)
        for char in full_text:
            self.assertLess(ord(char), 127000, f"Emoji detected in generated short data: {char}")

    def test_remix_clip_motion_events_deterministic_fallback(self):
        """Verify remix_clip_motion_events generates valid beats even when Gemini API key is missing."""
        transcript_data = {
            "words": self.sample_words,
            "duration": 30.0,
            "detected_language": "en",
        }
        old_env_key = os.environ.get("GEMINI_API_KEY", "")
        try:
            os.environ["GEMINI_API_KEY"] = ""
            events = remix_clip_motion_events(
                transcript_data=transcript_data,
                start_time=0.0,
                end_time=25.0,
                viral_title="Supercharged Workflow",
                api_key="",
                variation_seed=999,
            )

            self.assertIsInstance(events, list)
            self.assertGreaterEqual(len(events), 3)
            self.assertEqual(events[0]["type"], "editorial_split")
        finally:
            if old_env_key:
                os.environ["GEMINI_API_KEY"] = old_env_key

    def test_custom_scene_security_validator_blocks_forbidden_apis(self):
        """Verify forbidden APIs (window, document, fetch, eval) are rejected."""
        evil_codes = [
            "export default function S() { window.location = 'evil'; return <div />; }",
            "export default function S() { fetch('/steal'); return <div />; }",
            "export default function S() { eval('2+2'); return <div />; }",
            "export default function S() { document.body.innerHTML = ''; return <div />; }",
        ]
        for evil in evil_codes:
            valid, err = validate_custom_scene_code(evil)
            self.assertFalse(valid, f"Should have rejected forbidden API in: {evil}")
            self.assertIsNotNone(err)

    def test_custom_scene_security_validator_blocks_emojis(self):
        """Verify unicode emojis are strictly rejected by the validator."""
        emoji_code = "export default function S() { return <div>🚀 FIRE! 🔥</div>; }"
        valid, err = validate_custom_scene_code(emoji_code)
        self.assertFalse(valid, "Should have rejected emoji")
        self.assertIn("emoji", (err or "").lower())

    def test_custom_scene_esbuild_compilation_and_fallback(self):
        """Verify fallback TSX passes validation and compiles cleanly with esbuild."""
        valid, err = validate_custom_scene_code(FALLBACK_CUSTOM_SCENE_TSX)
        self.assertTrue(valid, f"Fallback scene failed validation: {err}")

        ok, compiled_js, comp_err = compile_with_esbuild(FALLBACK_CUSTOM_SCENE_TSX)
        self.assertTrue(ok, f"Compilation failed: {comp_err}")
        self.assertIn("react", compiled_js)
        self.assertGreater(len(compiled_js), 200)

    def test_generate_custom_scene_api_endpoint(self):
        """Verify POST /api/generate-custom-scene returns compiled JS and archetype."""
        resp = self.client.post(
            "/api/generate-custom-scene",
            json={
                "clip_transcript": "This framework scales automatically without bottlenecks.",
                "prompt": "Cybernetic scale diagram",
                "provider": "deterministic_fallback",
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("archetype"), "custom_ai_scene")
        self.assertIn("compiled_js", data)
        self.assertGreater(len(data["compiled_js"]), 100)

    def test_make_window_short_unified_keys(self):
        """Verify _make_window_short populates all alias keys for scores and rationale."""
        window = _make_window_short(
            rank=1,
            start_sec=0.0,
            end_sec=28.0,
            words=self.sample_words,
            rng=random.Random(42),
            niche_hint="AI",
        )
        self.assertIn("virality_score", window)
        self.assertIn("viral_score", window)
        self.assertIn("hook_score", window)
        self.assertEqual(window["virality_score"], window["viral_score"])
        self.assertEqual(window["viral_score"], window["hook_score"])

        self.assertIn("hook_reason", window)
        self.assertIn("rationale", window)
        self.assertIn("reasoning", window)
        self.assertEqual(window["hook_reason"], window["rationale"])

    def test_compile_deterministic_fallback_bounds(self):
        """Verify deterministic fallback clips never start or end past the video duration."""
        # Test 100-second video
        suite_100 = _compile_deterministic_fallback(
            lines=[],
            words=self.sample_words,
            total_duration=100.0,
            seed=42,
        )
        for s in suite_100["shorts"]:
            self.assertGreaterEqual(s["start_time"], 0.0)
            self.assertLessEqual(s["start_time"], 100.0)
            self.assertLessEqual(s["end_time"], 100.0)
            self.assertGreater(s["end_time"], s["start_time"])

        # Test short 30-second video
        suite_30 = _compile_deterministic_fallback(
            lines=[],
            words=self.sample_words,
            total_duration=30.0,
            seed=42,
        )
        for s in suite_30["shorts"]:
            self.assertGreaterEqual(s["start_time"], 0.0)
            self.assertLessEqual(s["end_time"], 30.0)

    def test_custom_scene_synthesized_fallback_escapes_special_characters(self):
        """Verify fallback TSX survives newlines, single/double quotes, and backslashes."""
        tricky_headline = "Line 1\nLine 2 with 'quotes' and \"double\" and \\backslashes\\"
        tricky_subtext = "Subtext with\nnewlines and \"quotes\""
        code = build_synthesized_fallback_tsx(
            tag="AI's \n Choice",
            headline=tricky_headline,
            value="$1,200/mo",
            subtext=tricky_subtext,
        )
        valid, err = validate_custom_scene_code(code)
        self.assertTrue(valid, f"Failed validation: {err}")
        ok, compiled, comp_err = compile_with_esbuild(code)
        self.assertTrue(ok, f"Compilation failed on tricky characters: {comp_err}")
        self.assertIn("react", compiled)

    def test_custom_scene_validator_rejects_relative_imports_and_globals(self):
        """Verify custom scene validator blocks relative imports and dangerous globals."""
        dangerous_snippets = [
            "import secret from './local_module'; export default function S() { return <div />; }",
            "import pass from '../config'; export default function S() { return <div />; }",
            "export default function S() { const x = globalThis.token; return <div />; }",
            "export default function S() { const p = window.parent.location; return <div />; }",
            "export default function S() { const t = window.top.document; return <div />; }",
            "export default function S() { const r = Reflect.get({}, 'a'); return <div />; }",
            "export default function S() { const f = <iframe src='evil.html' />; return f; }",
        ]
        for snippet in dangerous_snippets:
            valid, err = validate_custom_scene_code(snippet)
            self.assertFalse(valid, f"Should have rejected dangerous snippet: {snippet}")
            self.assertIsNotNone(err)


if __name__ == "__main__":
    unittest.main()
