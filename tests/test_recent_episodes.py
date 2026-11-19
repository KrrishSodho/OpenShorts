import unittest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


class TestRecentEpisodes(unittest.TestCase):
    def test_get_recent_episodes(self):
        res = client.get("/api/recent-episodes")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("episodes", data)
        self.assertIsInstance(data["episodes"], list)

    def test_load_episode_404(self):
        res = client.post("/api/load-episode/non_existent_media_id_xyz")
        self.assertEqual(res.status_code, 404)

    def test_load_existing_episode(self):
        # Check if local_9df35dca or any real episode is on disk
        rec_res = client.get("/api/recent-episodes")
        episodes = rec_res.json().get("episodes", [])
        if episodes:
            target_id = episodes[0]["id"]
            load_res = client.post(f"/api/load-episode/{target_id}")
            self.assertEqual(load_res.status_code, 200)
            result = load_res.json()
            self.assertIn("media", result)
            self.assertIn("transcript", result)
            self.assertIn("clip_manifest", result)
            self.assertIn("recommended_clips", result)


if __name__ == "__main__":
    unittest.main()
