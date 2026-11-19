import os
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.face_tracker import FaceAutoTracker


class TestFeature2AutoFramingAndTracking(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_cx_to_pan_safe_viewport_bounds(self):
        """Verify that horizontal pan values are strictly clamped within 8% to 92% safe bounds."""
        # Extreme left (e.g. 5% of 16:9 width)
        left_pan = FaceAutoTracker._cx_to_pan(5.0)
        self.assertGreaterEqual(left_pan, 8)

        # Extreme right (e.g. 95% of 16:9 width)
        right_pan = FaceAutoTracker._cx_to_pan(95.0)
        self.assertLessEqual(right_pan, 92)

        # Center speaker (50% of 16:9 width)
        center_pan = FaceAutoTracker._cx_to_pan(50.0)
        self.assertEqual(center_pan, 50)

    def test_pick_active_speaker_arbitration(self):
        """Verify speaker picking prioritizes prominent face area and vertical eye-level positioning."""
        faces = [
            {"x": 100.0, "y": 200.0, "bw": 120.0, "bh": 140.0, "cx": 160.0, "cy": 270.0, "area": 16800.0},
            {"x": 500.0, "y": 200.0, "bw": 240.0, "bh": 280.0, "cx": 620.0, "cy": 340.0, "area": 67200.0},
        ]
        # Prominent face (larger area and eye level) must be chosen
        chosen_cx = FaceAutoTracker._pick_active_speaker_cx(faces, None, None, 1920, 1080)
        self.assertEqual(chosen_cx, 620.0)

        # Fallback with empty faces
        fallback_cx = FaceAutoTracker._pick_active_speaker_cx([], None, None, 1920, 1080)
        self.assertEqual(fallback_cx, 960.0)

    def test_generate_pan_keyframes_structure(self):
        """Verify that generated pan keyframes contain t, pan, and transition keys."""
        non_existent = Path("non_existent_clip_123.mp4")
        kfs = FaceAutoTracker.generate_pan_keyframes(non_existent)
        self.assertIsInstance(kfs, list)
        self.assertGreaterEqual(len(kfs), 1)
        first_kf = kfs[0]
        self.assertIn("t", first_kf)
        self.assertIn("pan", first_kf)
        self.assertIn("transition", first_kf)
        self.assertEqual(first_kf["transition"], "cut")

    def test_api_auto_track_pan_endpoint(self):
        """Verify POST /api/auto-track-pan responds cleanly with pan_keyframes array."""
        payload = {
            "media_id": "test_media_sample",
            "start_time": 0.0,
            "end_time": 10.0,
        }
        resp = self.client.post("/api/auto-track-pan", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("pan_keyframes", data)
        self.assertIsInstance(data["pan_keyframes"], list)
        self.assertGreaterEqual(len(data["pan_keyframes"]), 1)

    def test_smoothstep_easing_properties(self):
        """Verify mathematical correctness of smoothstep formula S(x) = 3x^2 - 2x^3."""
        def smoothstep(x):
            return x * x * (3.0 - 2.0 * x)

        self.assertAlmostEqual(smoothstep(0.0), 0.0)
        self.assertAlmostEqual(smoothstep(0.5), 0.5)
        self.assertAlmostEqual(smoothstep(1.0), 1.0)
        # Monotonicity test
        prev = -1.0
        for step in range(0, 101):
            val = smoothstep(step / 100.0)
            self.assertGreaterEqual(val, prev)
            prev = val


if __name__ == "__main__":
    unittest.main()
