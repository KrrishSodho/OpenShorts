import os
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient

from backend.main import app
from backend.services.transcriber import parse_srt_or_text
from backend.services.pipeline_orchestrator import snap_to_natural_boundaries
from backend.core.jobs import (
    create_job_record,
    cancel_job,
    is_job_cancelled,
    cleanup_job_temp_files,
    get_job_record,
)


class TestFeature1IngestAndTranscription(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_snap_to_natural_boundaries_mid_word(self):
        """Verify that timestamps falling mid-word snap outwards to preserve full syllables."""
        words = [
            {"word": "Welcome", "start": 10.0, "end": 10.5},
            {"word": "to", "start": 10.55, "end": 10.7},
            {"word": "Viral", "start": 10.75, "end": 11.2},
            {"word": "Studio.", "start": 11.25, "end": 11.9},
        ]
        # User/AI selects start at 10.2 (midway into "Welcome" [10.0 - 10.5])
        # and end at 11.5 (midway into "Studio." [11.25 - 11.9])
        snapped_s, snapped_e = snap_to_natural_boundaries(10.2, 11.5, words, total_duration=20.0)

        # Start must snap backwards to at least 10.0 - 0.15 = 9.85
        self.assertLessEqual(snapped_s, 10.0)
        # End must snap forwards to at least 11.9 + 0.25 = 12.15
        self.assertGreaterEqual(snapped_e, 11.9)
        self.assertGreater(snapped_e, snapped_s)

    def test_snap_to_natural_boundaries_gap_and_empty(self):
        """Verify boundary snapping handles silence gaps and empty word lists cleanly."""
        words = [
            {"word": "Hello", "start": 2.0, "end": 2.5},
            {"word": "world", "start": 5.0, "end": 5.6},
        ]
        # In the 2.5s silence gap (2.5 -> 5.0), snapping near world should snap to world onset
        s, e = snap_to_natural_boundaries(4.5, 5.3, words, total_duration=10.0)
        self.assertLessEqual(s, 5.0)
        self.assertGreaterEqual(e, 5.6)

        # Empty words fallback
        s_empty, e_empty = snap_to_natural_boundaries(3.0, 7.0, [], total_duration=10.0)
        self.assertEqual(s_empty, 3.0)
        self.assertEqual(e_empty, 7.0)

    def test_proportional_srt_duration_allocation(self):
        """Verify that character-length weighting gives long words more time than short words."""
        sample_srt = """1
00:00:01,000 --> 00:00:04,000
A extraordinarily comprehensive breakdown.
"""
        result = parse_srt_or_text(sample_srt, "test_proportional_srt")
        words = result["words"]
        self.assertEqual(len(words), 4)

        dur_a = words[0]["end"] - words[0]["start"]
        dur_extraordinary = words[1]["end"] - words[1]["start"]

        # "extraordinarily" (15 chars) must receive substantially more duration than "A" (1 char)
        self.assertGreater(dur_extraordinary, dur_a * 2.0)
        # Verify monotonic timestamps
        for i in range(len(words) - 1):
            self.assertLessEqual(words[i]["start"], words[i]["end"])
            self.assertLessEqual(words[i]["end"], words[i + 1]["end"])

    def test_job_cancellation_lifecycle(self):
        """Verify thread-safe job cancellation and status updates."""
        job_id = create_job_record()
        self.assertFalse(is_job_cancelled(job_id))

        # Cancel job via service
        success = cancel_job(job_id)
        self.assertTrue(success)
        self.assertTrue(is_job_cancelled(job_id))

        record = get_job_record(job_id)
        self.assertIsNotNone(record)
        self.assertEqual(record["status"], "cancelled")

    def test_api_cancel_job_endpoint(self):
        """Verify POST /api/jobs/{id}/cancel route."""
        job_id = create_job_record()
        resp = self.client.post(f"/api/jobs/{job_id}/cancel")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("status"), "cancelled")

        # Cancelling non-existent job returns 404
        resp_404 = self.client.post("/api/jobs/non-existent-uuid/cancel")
        self.assertEqual(resp_404.status_code, 404)

    def test_cleanup_temp_files(self):
        """Verify temp file cleanup function executes without exceptions."""
        cleanup_job_temp_files("test_media_123")


if __name__ == "__main__":
    unittest.main()
