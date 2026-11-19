import os
import sys
import json
import wave
import tempfile
import subprocess
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.ai_director import _safe_parse_json
from backend.utils.ffmpeg_helper import extract_audio_16k, probe_media

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "online"
    assert "engine" in data
    assert data.get("whisper_ready") is True
    assert data.get("ffmpeg_ready") is True
    print("[PASS] test_api_health")

def test_api_presets():
    response = client.get("/api/presets")
    assert response.status_code == 200
    data = response.json()
    assert "presets" in data
    presets = data["presets"]
    assert isinstance(presets, list)
    assert len(presets) >= 3
    preset_ids = [p["id"] for p in presets]
    assert "fable_5_2_kinetic" in preset_ids
    assert "vox_technical_explainer" in preset_ids
    print("[PASS] test_api_presets")

def test_ai_director_safe_json_parsing():
    # Clean JSON
    res1 = _safe_parse_json('{"key": "value", "num": 42}')
    assert res1 == {"key": "value", "num": 42}

    # Markdown fence
    res2 = _safe_parse_json('```json\n{"shorts": [{"title": "Hook"}]}\n```')
    assert res2 == {"shorts": [{"title": "Hook"}]}

    # Commentary around JSON
    res3 = _safe_parse_json('Here is your choreography:\n{"niche": "Tech", "shorts": []}\nHope this helps!')
    assert res3 == {"niche": "Tech", "shorts": []}

    # Single-quoted Python dictionary representation
    res4 = _safe_parse_json("{'shorts': [{'rank': 1, 'title': 'Test'}]}")
    assert res4 == {"shorts": [{"rank": 1, "title": "Test"}]}

    # Malformed unparseable JSON returns None
    res5 = _safe_parse_json("Not a json at all")
    assert res5 is None

    print("[PASS] test_ai_director_safe_json_parsing")

def test_silent_video_audio_extraction():
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        silent_video = tmp_path / "silent.mp4"
        output_wav = tmp_path / "audio.wav"

        # Generate a 2-second silent test video with no audio stream
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "color=c=blue:s=320x240:d=2:r=30",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            str(silent_video)
        ]
        subprocess.run(cmd, capture_output=True, check=True)

        info = probe_media(silent_video)
        assert info["has_audio"] is False

        # Now extract audio using our updated extract_audio_16k
        wav_result = extract_audio_16k(silent_video, output_wav)
        assert wav_result.exists()
        assert wav_result.stat().st_size > 0

        # Validate that the output is indeed a valid 16kHz mono WAV file
        with wave.open(str(wav_result), "rb") as wf:
            assert wf.getnchannels() == 1
            assert wf.getsampwidth() == 2
            assert wf.getframerate() == 16000
            # 2 seconds @ 16000 frames/sec = 32000 frames
            assert wf.getnframes() >= 32000

        print("[PASS] test_silent_video_audio_extraction")

if __name__ == "__main__":
    test_api_health()
    test_api_presets()
    test_ai_director_safe_json_parsing()
    test_silent_video_audio_extraction()
    print("\nALL REGRESSION TESTS PASSED CLEANLY!")
