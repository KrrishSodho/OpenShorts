import os
import sys
import json
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from backend.main import app
from backend.config import PRESETS_DIR


def clamp_pan(pan: float) -> int:
    return int(max(0, min(100, round(pan))))


def calculate_trio_layout_bounds(top_pan: float, left_pan: float, right_pan: float):
    """
    Validates and normalizes 3-speaker layout parameters.
    """
    safe_top = clamp_pan(top_pan)
    safe_left = clamp_pan(left_pan)
    safe_right = clamp_pan(right_pan)

    return {
        "top_stage": {"height_pct": 55.8, "pan": safe_top},
        "bottom_left": {"width_pct": 49.8, "height_pct": 43.8, "pan": safe_left},
        "bottom_right": {"width_pct": 49.8, "height_pct": 43.8, "pan": safe_right},
        "divider_pct": 0.4,
    }


def compute_clean_speaker_visibility(clean_speaker_mode: bool, scene_type: str, zone: str):
    """
    Determines whether a stage overlay or stage morph is active.
    When clean_speaker_mode is True, graphic stage morphs are suppressed unless it is full B-roll.
    """
    is_broll = scene_type in ("broll_full", "broll_split")
    if is_broll:
        return True

    if clean_speaker_mode:
        return False

    return zone in ("top_stage", "bottom_stage", "center_spotlight", "full_takeover")


class TestFeature6PresetsAndCleanSpeakerView(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_all_presets_exist_and_valid_json(self):
        expected_presets = [
            "fable_5_2_kinetic.json",
            "opus_5_5_editorial.json",
            "vox_technical_explainer.json",
            "cyber_matrix_neon.json",
            "studio_minimal_clean.json",
        ]
        for preset_name in expected_presets:
            preset_path = PRESETS_DIR / preset_name
            self.assertTrue(preset_path.exists(), f"Missing preset: {preset_name}")
            with open(preset_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.assertIn("id", data)
                self.assertIn("name", data)
                self.assertIn("palette", data)

    def test_zero_emojis_in_all_presets(self):
        for preset_file in PRESETS_DIR.glob("*.json"):
            with open(preset_file, "r", encoding="utf-8") as f:
                content = f.read()
                for char in content:
                    self.assertLess(
                        ord(char),
                        127000,
                        f"Emoji detected in preset {preset_file.name}: {char}",
                    )

    def test_presets_api_endpoint(self):
        response = self.client.get("/api/presets")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("presets", data)
        presets = data["presets"]
        self.assertGreaterEqual(len(presets), 5)

        preset_ids = [p["id"] for p in presets]
        self.assertIn("cyber_matrix_neon", preset_ids)
        self.assertIn("studio_minimal_clean", preset_ids)
        self.assertIn("fable_5_2_kinetic", preset_ids)
        self.assertIn("opus_5_5_editorial", preset_ids)
        self.assertIn("vox_technical_explainer", preset_ids)

    def test_trio_speaker_framing_coordinates(self):
        layout = calculate_trio_layout_bounds(top_pan=25.0, left_pan=18.0, right_pan=84.0)
        self.assertEqual(layout["top_stage"]["pan"], 25)
        self.assertEqual(layout["bottom_left"]["pan"], 18)
        self.assertEqual(layout["bottom_right"]["pan"], 84)

        # Total width check for lower stage (49.8 + 0.4 + 49.8 = 100.0%)
        total_lower_width = (
            layout["bottom_left"]["width_pct"]
            + layout["divider_pct"]
            + layout["bottom_right"]["width_pct"]
        )
        self.assertAlmostEqual(total_lower_width, 100.0, places=1)

    def test_clean_speaker_mode_suppression(self):
        # In clean mode, graphic stages are suppressed
        self.assertFalse(compute_clean_speaker_visibility(True, "editorial_split", "top_stage"))
        self.assertFalse(compute_clean_speaker_visibility(True, "power_meter_gauge", "top_stage"))
        self.assertFalse(compute_clean_speaker_visibility(True, "poster_slam", "center_spotlight"))

        # In clean mode, true B-roll cutaways are still rendered
        self.assertTrue(compute_clean_speaker_visibility(True, "broll_full", "full_takeover"))

        # In standard mode, graphic stages are rendered
        self.assertTrue(compute_clean_speaker_visibility(False, "power_meter_gauge", "top_stage"))


if __name__ == "__main__":
    unittest.main()
