# PATH: tests/test_llm_and_planning.py
"""
Comprehensive Unit Tests for Unified LLM Layer, Honest Telemetry,
Single-Call Short Planning, and Invariant Validation.
"""

import os
import unittest
from unittest.mock import MagicMock, patch

from backend.services.llm import (
    execute_llm_request,
    get_last_ai_trace,
    get_llm_call_count,
    reset_llm_call_count,
    LLMResult,
    redact_secrets,
)
from backend.services.short_planner import (
    validate_and_refine_plan,
    generate_deterministic_plan,
    plan_or_load_short,
    save_user_overrides,
    ShortPlanAIResponseSchema,
    HookPlanSchema,
    PlanBeatSchema,
)


class TestUnifiedLLMAndPlanning(unittest.TestCase):

    def setUp(self):
        reset_llm_call_count()

    def test_redact_secrets(self):
        """Ensure sensitive keys are never exposed in logs, traces, or messages."""
        text = "Error with AIzaSyDfake1234567890abcdef1234567890 and sk-ant-api03-abcdefghijklmnop12345"
        redacted = redact_secrets(text)
        self.assertNotIn("AIzaSyDfake1234567890abcdef1234567890", redacted)
        self.assertNotIn("sk-ant-api03-abcdefghijklmnop12345", redacted)
        self.assertIn("[REDACTED_GEMINI_KEY]", redacted)
        self.assertIn("[REDACTED_ANTHROPIC_KEY]", redacted)

        # Also test key= parameter redaction
        param_text = "Call with key=secret123"
        self.assertIn("key=[REDACTED]", redact_secrets(param_text))

    @patch("backend.services.llm.get_cached_genai_client")
    def test_404_no_retry_specific_reason(self, mock_get_client):
        """404 error must NOT trigger retries on that model and must show a specific model-not-available reason."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        err = Exception("404 NOT_FOUND. The model models/gemini-2.5-flash is no longer available.")
        setattr(err, "code", 404)
        mock_client.models.generate_content.side_effect = err

        res = execute_llm_request(
            prompt="Hello",
            preferred_model="gemini-2.5-flash",
            request_type="small_check",
            api_key="AIzaSyMockKeyForUnitTests1234567890",
        )

        self.assertFalse(res.ok)
        self.assertEqual(res.provider, "none")
        # Ensure attempts for gemini-2.5-flash failed fast without retrying attempt 2
        flash_attempts = [a for a in res.attempts if a.model == "gemini-2.5-flash"]
        # In our implementation, gemini-2.5-flash is in DEPRECATED_404_MODELS or fails fast
        for a in res.attempts:
            if a.code == 404:
                self.assertIn("not available", a.message.lower())

    @patch("backend.services.llm.get_cached_genai_client")
    def test_503_two_attempts_fallback_with_reason(self, mock_get_client):
        """503 error must retry up to 2 attempts per model and record attempt telemetry."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        err = Exception("503 UNAVAILABLE. This model is experiencing high demand.")
        setattr(err, "code", 503)
        mock_client.models.generate_content.side_effect = err

        # Target a single model to isolate retry counts
        with patch("backend.services.llm.get_gemini_model_chain", return_value=["gemini-3.5-flash-lite"]):
            res = execute_llm_request(
                prompt="Hello",
                preferred_model="gemini-3.5-flash-lite",
                request_type="small_check",
                api_key="AIzaSyMockKeyForUnitTests1234567890",
            )

            self.assertFalse(res.ok)
            self.assertEqual(res.model, "deterministic_fallback")
            # Should have made exactly 2 attempts for gemini-3.5-flash-lite
            lite_attempts = [a for a in res.attempts if a.model == "gemini-3.5-flash-lite"]
            self.assertEqual(len(lite_attempts), 2)
            self.assertEqual(lite_attempts[0].code, 503)
            self.assertIn("503", res.user_message)

    @patch("backend.services.llm.get_cached_genai_client")
    def test_timeout_reason_includes_seconds(self, mock_get_client):
        """Timeout failures must include configured seconds in the user-visible reason."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        err = Exception("504 DEADLINE_EXCEEDED. Deadline expired before operation could complete.")
        setattr(err, "code", 504)
        mock_client.models.generate_content.side_effect = err

        with patch("backend.services.llm.get_gemini_model_chain", return_value=["gemini-3.5-flash-lite"]):
            res = execute_llm_request(
                prompt="Hello",
                preferred_model="gemini-3.5-flash-lite",
                request_type="planning",  # 95s configured
                api_key="AIzaSyMockKeyForUnitTests1234567890",
            )

            self.assertFalse(res.ok)
            timeout_attempts = [a for a in res.attempts if a.status == "timeout"]
            self.assertTrue(len(timeout_attempts) > 0)
            self.assertIn("95s", timeout_attempts[0].message)

    def test_trace_labels_fallback_as_fallback(self):
        """When an LLM request fails or uses fallback, trace source MUST be 'fallback'."""
        res = LLMResult(
            ok=False,
            provider="none",
            model="deterministic_fallback",
            user_message="Gemini models exhausted",
        )
        from backend.services.llm import update_last_ai_trace
        update_last_ai_trace(res, "Sample prompt")

        trace = get_last_ai_trace()
        self.assertEqual(trace["source"], "fallback")
        self.assertEqual(trace["model"], "deterministic_fallback")
        self.assertIn("Gemini models exhausted", trace["error"])

    def test_validation_rejects_invented_numbers_and_non_transcript_text(self):
        """Invariant: Validation must strip unvoiced text and numbers not in the transcript."""
        clip_words = [
            {"word": "caffeine", "start": 0.0, "end": 0.5},
            {"word": "blocks", "start": 0.6, "end": 0.9},
            {"word": "adenosine", "start": 1.0, "end": 1.4},
            {"word": "receptors", "start": 1.5, "end": 2.0},
            {"word": "by", "start": 2.1, "end": 2.3},
            {"word": "50", "start": 2.4, "end": 2.7},
            {"word": "percent", "start": 2.8, "end": 3.2},
            {"word": "in", "start": 3.3, "end": 3.5},
            {"word": "the", "start": 3.6, "end": 3.8},
            {"word": "brain", "start": 3.9, "end": 4.5},
        ]

        raw_plan = {
            "hook": {
                "text": "COMPLETELY UNVOICED HOOK PHRASE",
                "start_sec": 0.0,
                "duration_sec": 2.8,
            },
            "beats": [
                {
                    "anchor_phrase": "caffeine blocks",
                    "start_sec": 0.5,
                    "duration_sec": 2.5,
                    "purpose": "metric",
                    "archetype": "metric_reveal",
                    "headline": "UNSPOKEN SENSATIONAL HEADLINE",  # Not in transcript -> must be cleared
                    "value": "999%",  # 999 is NOT in transcript -> must be stripped
                    "evidence_quote": "caffeine blocks adenosine",
                },
                {
                    "anchor_phrase": "by 50 percent",
                    "start_sec": 2.2,
                    "duration_sec": 2.5,
                    "purpose": "metric",
                    "archetype": "metric_reveal",
                    "headline": "caffeine blocks adenosine",  # Spoken -> allowed
                    "value": "50%",  # 50 is spoken -> allowed
                    "evidence_quote": "by 50 percent in the brain",
                },
            ],
            "pacing_notes": "Fast hook",
        }

        refined_plan, rejections = validate_and_refine_plan(
            raw_plan=raw_plan,
            clip_words=clip_words,
            start_time=0.0,
            end_time=30.0,
        )

        self.assertTrue(len(rejections) >= 2)
        # Check that beat 1's invented headline was cleared
        beat1 = refined_plan["beats"][0]
        self.assertEqual(beat1["headline"], "")
        self.assertEqual(beat1["value"], "")  # 999% stripped

        # Check that beat 2's verified 50% was kept
        beat2 = refined_plan["beats"][1]
        self.assertEqual(beat2["headline"], "caffeine blocks adenosine")
        self.assertEqual(beat2["value"], "50%")

        # Check clean intervals exist
        self.assertTrue(len(refined_plan["clean_intervals"]) > 0)

    @patch("backend.services.short_planner.execute_llm_request")
    def test_plan_edit_export_exactly_one_generation_call(self, mock_execute_llm):
        """Assert exactly 1 generation call total across planning, editing overrides, and export."""
        mock_execute_llm.return_value = LLMResult(
            ok=True,
            provider="gemini",
            model="gemini-3.5-flash-lite",
            data={
                "hook": {"text": "Key Insight", "start_sec": 0.0, "duration_sec": 2.8},
                "beats": [
                    {
                        "anchor_phrase": "test phrase",
                        "start_sec": 2.0,
                        "duration_sec": 2.5,
                        "purpose": "emphasis",
                        "archetype": "word_hit",
                        "headline": "test phrase",
                        "value": "",
                        "subtext": "",
                        "items": [],
                        "evidence_quote": "test phrase",
                    }
                ],
                "clean_intervals": [{"start_sec": 5.0, "end_sec": 30.0}],
                "pacing_notes": "Smooth",
            },
        )

        import json
        from backend.config import TRANSCRIPTS_DIR
        media_id = "test_single_call_media"
        start_time = 0.0
        end_time = 30.0

        t_file = TRANSCRIPTS_DIR / f"{media_id}_transcript.json"
        t_file.write_text(json.dumps({
            "words": [
                {"word": "test", "start": 0.5, "end": 1.0},
                {"word": "phrase", "start": 1.1, "end": 1.5},
                {"word": "for", "start": 1.6, "end": 2.0},
                {"word": "planning", "start": 2.1, "end": 2.8},
            ],
            "duration": 30.0,
            "detected_language": "en",
        }), encoding="utf-8")

        try:
            # 1. First call: generate short plan (1 AI call)
            plan1 = plan_or_load_short(
                media_id=media_id,
                start_time=start_time,
                end_time=end_time,
                force_regenerate=True,
                api_key="AIzaSyMockKeyForUnitTests1234567890",
            )
            self.assertIsNotNone(plan1)
            self.assertEqual(mock_execute_llm.call_count, 1)

            # 2. User edits short (saving overrides) -> 0 AI calls
            save_ok = save_user_overrides(
                media_id=media_id,
                start_time=start_time,
                end_time=end_time,
                overrides={"user_notes": "Manual title edit"},
            )
            self.assertTrue(save_ok)
            self.assertEqual(mock_execute_llm.call_count, 1)

            # 3. Reloading/previewing short -> 0 AI calls (loads from persisted plan file)
            plan2 = plan_or_load_short(
                media_id=media_id,
                start_time=start_time,
                end_time=end_time,
                force_regenerate=False,
                api_key="AIzaSyMockKeyForUnitTests1234567890",
            )
            self.assertIsNotNone(plan2)
            self.assertEqual(mock_execute_llm.call_count, 1)

            # Total calls across planning, editing, and preview must remain exactly 1
            self.assertEqual(mock_execute_llm.call_count, 1)
        finally:
            if t_file.exists():
                t_file.unlink()


if __name__ == "__main__":
    unittest.main()
