import json
import logging
from fastapi import APIRouter, HTTPException

from backend.config import DOWNLOADS_DIR, TRANSCRIPTS_DIR
from backend.core.jobs import resolve_source_video
from backend.schemas.clip import PrepareClipRequest, AutoTrackPanRequest
from backend.services.pipeline_orchestrator import (
    prepare_trimmed_clip_manifest,
    snap_to_natural_boundaries,
)
from backend.services.face_tracker import FaceAutoTracker
from backend.utils.ffmpeg_helper import trim_video_clip

logger = logging.getLogger("viral_studio.clips")
router = APIRouter(tags=["clips"])


@router.post("/api/prepare-clip")
def prepare_clip(req: PrepareClipRequest):
    try:
        payload = prepare_trimmed_clip_manifest(
            media_id=req.media_id,
            start_time=req.start_time,
            end_time=req.end_time,
            preset_id=req.preset_id,
            viral_title=req.custom_title or f"Viral Short {req.media_id}",
            motion_events=req.motion_events or [],
            crop_focus=req.crop_focus or "auto",
            pan_keyframes=req.pan_keyframes,
            framing_layout=req.framing_layout or "single",
            split_top_pan=req.split_top_pan if req.split_top_pan is not None else 22,
            split_bottom_pan=req.split_bottom_pan if req.split_bottom_pan is not None else 78,
            split_zoom=req.split_zoom if req.split_zoom is not None else 1.55,
            trio_left_pan=req.trio_left_pan if req.trio_left_pan is not None else 20,
            trio_right_pan=req.trio_right_pan if req.trio_right_pan is not None else 80,
            clean_speaker_mode=bool(req.clean_speaker_mode),
        )
        return {
            "success": True,
            "clip_manifest": payload,
        }
    except Exception as e:
        logger.error(f"Prepare clip failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/auto-track-pan")
def auto_track_pan_endpoint(req: AutoTrackPanRequest):
    try:
        # Load transcript to align with exact snapped clip boundaries
        transcript_file = TRANSCRIPTS_DIR / f"{req.media_id}_transcript.json"
        transcript_words = []
        total_dur = 0.0
        if transcript_file.exists():
            try:
                with open(transcript_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    transcript_words = data.get("words", [])
                    total_dur = float(data.get("duration", 0.0) or 0.0)
            except Exception:
                pass

        snapped_start, snapped_end = snap_to_natural_boundaries(
            req.start_time, req.end_time, transcript_words, total_dur
        )

        clip_id = f"{req.media_id}_{int(round(snapped_start * 10))}_{int(round(snapped_end * 10))}"
        trimmed_clip_path = DOWNLOADS_DIR / f"{clip_id}_trimmed.mp4"
        if not trimmed_clip_path.exists() or trimmed_clip_path.stat().st_size < 10240:
            raw_video = resolve_source_video(req.media_id)
            trim_video_clip(raw_video, trimmed_clip_path, snapped_start, snapped_end)

        if trimmed_clip_path.exists() and trimmed_clip_path.stat().st_size >= 10240:
            keyframes = FaceAutoTracker.generate_pan_keyframes(trimmed_clip_path)
            return {"pan_keyframes": keyframes}
        return {"pan_keyframes": [{"t": 0.0, "pan": 50, "transition": "cut"}]}
    except Exception as e:
        logger.warning(f"Auto-track pan endpoint fallback: {e}")
        return {"pan_keyframes": [{"t": 0.0, "pan": 50, "transition": "cut"}]}
