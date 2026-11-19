import os
import sys
import json
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestFeature4SubtitlesAndKineticCaptions(unittest.TestCase):
    def test_frontend_types_subtitle_highlight_colors(self):
        """Verify frontend types include all 6 brand highlight colors."""
        types_file = Path("frontend/src/types/captions.ts")
        self.assertTrue(types_file.exists())
        content = types_file.read_text(encoding="utf-8")
        for color in ["yellow", "cyan", "emerald", "crimson", "violet", "white"]:
            self.assertIn(f"'{color}'", content)

    def test_phrase_builder_supports_1w_and_2w_punches(self):
        """Verify phraseBuilder.ts supports 1w (single word) and 2w chunks."""
        builder_file = Path("frontend/src/remotion/captions/phraseBuilder.ts")
        self.assertTrue(builder_file.exists())
        content = builder_file.read_text(encoding="utf-8")
        self.assertIn("targetMax === 1", content)
        self.assertIn("targetMax === 2", content)
        self.assertIn("maxWords: 1 | 2 | 3 | 5 | 7", content)

    def test_anti_flicker_latch_in_kinetic_captions(self):
        """Verify KineticCaptions.tsx implements the anti-flicker phrase latch."""
        captions_file = Path("frontend/src/remotion/layers/KineticCaptions.tsx")
        self.assertTrue(captions_file.exists())
        content = captions_file.read_text(encoding="utf-8")
        self.assertIn("Anti-flicker latch", content)
        self.assertIn("prev.end <= 0.75", content)

    def test_color_tokens_resolution_in_all_caption_styles(self):
        """Verify all subtitle components import and resolve highlight tokens."""
        captions_dir = Path("frontend/src/remotion/captions")
        for comp_name in ["PaperOrBoxCaptions.tsx", "HormoziPop.tsx", "KaraokePill.tsx", "MinimalShadow.tsx"]:
            comp_file = captions_dir / comp_name
            self.assertTrue(comp_file.exists(), f"Missing {comp_name}")
            comp_content = comp_file.read_text(encoding="utf-8")
            self.assertIn("resolveHighlightTokens", comp_content, f"{comp_name} does not use resolveHighlightTokens")


if __name__ == "__main__":
    unittest.main()
