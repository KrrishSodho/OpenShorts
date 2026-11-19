import unittest
from pathlib import Path
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.jobs import (
    create_render_record,
    get_render_record,
    set_render_cancelled,
    update_render_record,
    RENDER_JOBS,
)
import tempfile
import time
from backend.services.remotion_exporter import cancel_active_render_process, prune_stale_render_artifacts
from backend.services.broll_fetcher import _generate_procedural_fallback_broll

client = TestClient(app)


class TestFeature8Export(unittest.TestCase):
    def test_create_and_poll_render_record(self):
        render_id = create_render_record()
        self.assertIsNotNone(render_id)

        record = get_render_record(render_id)
        self.assertIsNotNone(record)
        self.assertEqual(record["status"], "rendering")
        self.assertEqual(record["progress"], 5)

        # Test API endpoint
        res = client.get(f"/api/render-status/{render_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["render_id"], render_id)
        self.assertEqual(data["status"], "rendering")

    def test_cancel_render_job(self):
        render_id = create_render_record()
        res = client.post(f"/api/render-cancel/{render_id}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        # Check that job is marked cancelled
        record = get_render_record(render_id)
        self.assertEqual(record["status"], "cancelled")

        # Cancelling non-existent job returns 404
        bad_res = client.post("/api/render-cancel/non-existent-uuid")
        self.assertEqual(bad_res.status_code, 404)

    def test_render_status_404(self):
        res = client.get("/api/render-status/non-existent-uuid")
        self.assertEqual(res.status_code, 404)

    def test_download_video_and_thumbnail_404(self):
        v_res = client.get("/api/download-video/missing_file_xyz.mp4")
        self.assertEqual(v_res.status_code, 404)

        t_res = client.get("/api/download-thumbnail/missing_thumb_xyz.jpg")
        self.assertEqual(t_res.status_code, 404)

    def test_update_render_record_fields(self):
        render_id = create_render_record()
        update_render_record(
            render_id,
            progress=50,
            step="Rendering frames 300/600",
            eta_sec=12,
            download_url="/api/download-video/test.mp4",
            thumbnail_url="/api/download-thumbnail/test_thumb.jpg",
            file_size_bytes=1048576,
            duration_sec=20.0,
        )
        record = get_render_record(render_id)
        self.assertEqual(record["progress"], 50)
        self.assertEqual(record["step"], "Rendering frames 300/600")
        self.assertEqual(record["eta_sec"], 12)
        self.assertEqual(record["download_url"], "/api/download-video/test.mp4")
        self.assertEqual(record["thumbnail_url"], "/api/download-thumbnail/test_thumb.jpg")
        self.assertEqual(record["file_size_bytes"], 1048576)
        self.assertEqual(record["duration_sec"], 20.0)

    def test_prune_stale_render_artifacts(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            td = Path(tmpdir)
            tmp_mp4 = td / "test.tmp.mp4"
            props_file = td / "test_render_props.json"
            final_mp4 = td / "final.mp4"
            tmp_mp4.write_text("dummy")
            props_file.write_text("{}")
            final_mp4.write_text("video")

            # With negative age, all matching temp files must be pruned
            prune_stale_render_artifacts(td, max_age_sec=-1)
            self.assertFalse(tmp_mp4.exists())
            self.assertFalse(props_file.exists())
            self.assertTrue(final_mp4.exists())


if __name__ == "__main__":
    unittest.main()
