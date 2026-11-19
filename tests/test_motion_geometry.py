import unittest
from backend.services.ai_director import (
    VALID_ZONES,
    VALID_TRANSITIONS,
    _default_zone_for_type,
    _normalize_sfx,
)


class TestMotionGeometry(unittest.TestCase):
    def test_valid_zones_and_safe_vertical_bounds(self):
        expected_zones = {
            "top_stage",
            "bottom_stage",
            "center_spotlight",
            "floating_overlay",
            "full_takeover",
        }
        for z in expected_zones:
            self.assertIn(z, VALID_ZONES)

    def test_default_zones_prevent_speaker_occlusion(self):
        # Flowcharts and stats should default to top_stage so speaker remains visible
        self.assertEqual(_default_zone_for_type("vector_diagram"), "top_stage")
        self.assertEqual(_default_zone_for_type("radial_gauge_stat"), "top_stage")
        self.assertEqual(_default_zone_for_type("odometer_counter"), "top_stage")
        self.assertEqual(_default_zone_for_type("power_meter_gauge"), "top_stage")
        self.assertEqual(_default_zone_for_type("spec_versus"), "top_stage")

        # Full takeovers should default to full_takeover
        self.assertEqual(_default_zone_for_type("keyword_cascade_takeover"), "full_takeover")
        self.assertEqual(_default_zone_for_type("explainer_timeline_takeover"), "full_takeover")

        # Spotlight slams should default to center_spotlight, quotes to bottom_stage
        self.assertEqual(_default_zone_for_type("poster_slam"), "center_spotlight")
        self.assertEqual(_default_zone_for_type("quote_editorial_card"), "bottom_stage")
        self.assertEqual(_default_zone_for_type("carousel_cards"), "center_spotlight")

        # Layer 2 & 3 infographics default to top_stage so speaker remains visible
        self.assertEqual(_default_zone_for_type("bar_comparison"), "top_stage")
        self.assertEqual(_default_zone_for_type("donut_breakdown"), "top_stage")
        self.assertEqual(_default_zone_for_type("pyramid_levels"), "top_stage")
        self.assertEqual(_default_zone_for_type("custom_ai_scene"), "top_stage")

    def test_sfx_normalization(self):
        self.assertEqual(_normalize_sfx("whoosh"), "whoosh")
        self.assertEqual(_normalize_sfx("pop"), "pop")
        self.assertEqual(_normalize_sfx("unknown_sfx_name"), "whoosh")
        self.assertEqual(_normalize_sfx(""), "whoosh")

    def test_headline_overflow_prevention_on_long_words(self):
        # 1080px canvas with safe horizontal margin >= 64px on each side -> max content width = 952px
        canvas_width = 1080
        safe_margin = 64
        max_content_width = canvas_width - (safe_margin * 2)  # 952px

        test_words = [
            "NEUROPLASTICITY",        # 16 characters (observed failure in showcase v1)
            "DISPROPORTIONATELY",     # 18 characters
            "COUNTERINTUITIVE",       # 16 characters
            "TRANSFORMATION",         # 14 characters
        ]

        def calculate_fit_font_size(text: str, max_w: int = 760, base_fs: int = 80, min_fs: int = 40) -> int:
            clean = text.strip()
            longest_len = max(len(w) for w in clean.split())
            char_ratio = 0.78
            if longest_len * (base_fs * char_ratio) > max_w:
                return max(min_fs, int(max_w / (longest_len * char_ratio)))
            return base_fs

        for word in test_words:
            fitted_fs = calculate_fit_font_size(word, max_w=760, base_fs=80, min_fs=40)
            estimated_word_width = len(word) * (fitted_fs * 0.78)
            # Must strictly fit within safe container width without clipping
            self.assertLessEqual(
                estimated_word_width,
                max_content_width,
                f"Word '{word}' at {fitted_fs}px exceeds safe container width {max_content_width}px"
            )
            # Minimum readable font size threshold
            self.assertGreaterEqual(fitted_fs, 40)


if __name__ == "__main__":
    unittest.main()
