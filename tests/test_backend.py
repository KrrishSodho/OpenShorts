import unittest
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.schemas.ingest import IngestRequest
from backend.schemas.export import RenderExportRequest
from backend.core.jobs import (
    create_job_record,
    get_job_record,
    update_job_record,
    cancel_job,
    is_job_cancelled,
)
from fastapi.testclient import TestClient
from backend.main import app

class BackendTestSuite(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "online")
        self.assertTrue(data.get("ffmpeg_ready"))

    def test_theme_presets_endpoint(self):
        response = self.client.get("/api/presets")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("presets", data)
        presets = data["presets"]
        self.assertIsInstance(presets, list)
        self.assertGreater(len(presets), 0)
        preset_ids = [p.get("id") for p in presets]
        self.assertTrue(any("fable" in pid for pid in preset_ids))

    def test_recent_episodes_endpoint(self):
        response = self.client.get("/api/recent-episodes")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("episodes", data)
        self.assertIsInstance(data["episodes"], list)

    def test_job_lifecycle(self):
        job_id = create_job_record()
        job = get_job_record(job_id)
        self.assertIsNotNone(job)
        self.assertEqual(job["status"], "processing")
        self.assertEqual(job["progress"], 5)

        # Update progress
        update_job_record(job_id, progress=45, step="Transcribing test audio: 45%")
        job = get_job_record(job_id)
        self.assertEqual(job["progress"], 45)
        self.assertEqual(job["step"], "Transcribing test audio: 45%")

        # Complete job
        mock_payload = {"result": "success", "media_id": "test_123"}
        update_job_record(job_id, status="completed", progress=100, result=mock_payload)
        job = get_job_record(job_id)
        self.assertEqual(job["status"], "completed")
        self.assertEqual(job["progress"], 100)
        self.assertEqual(job["result"], mock_payload)

    def test_job_cancellation(self):
        job_id = create_job_record()
        cancelled = cancel_job(job_id)
        self.assertTrue(cancelled)
        self.assertTrue(is_job_cancelled(job_id))
        job = get_job_record(job_id)
        self.assertEqual(job["status"], "cancelled")
        self.assertIn("cancelled", job.get("step", "").lower())

    def test_schema_validation(self):
        req = IngestRequest(url="https://youtube.com/watch?v=12345678901")
        self.assertEqual(req.url, "https://youtube.com/watch?v=12345678901")
        self.assertEqual(req.model_size, "base")

        render_req = RenderExportRequest(
            clip_id="clip_001",
            input_props={"preset": {"id": "fable_5_2_kinetic"}, "videoUrl": "test.mp4"},
            fps=30
        )
        self.assertEqual(render_req.clip_id, "clip_001")
        self.assertEqual(render_req.fps, 30)

if __name__ == "__main__":
    unittest.main()
