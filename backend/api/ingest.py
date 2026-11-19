import os
import json
import time
import random
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks

from backend.config import DOWNLOADS_DIR, TRANSCRIPTS_DIR, OUTPUT_RENDERS_DIR
from backend.core.jobs import create_job_record
from backend.schemas.ingest import IngestRequest
from backend.services.pipeline_orchestrator import execute_director_pipeline

logger = logging.getLogger("viral_studio.ingest")
router = APIRouter(tags=["ingest"])


@router.post("/api/ingest")
def ingest_media_job(req: IngestRequest, background_tasks: BackgroundTasks):
    has_url = bool(req.url and req.url.strip())
    has_local = bool(req.local_path and req.local_path.strip())

    if not req.use_sample and not has_url and not has_local:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid YouTube URL or a local file path on disk.",
        )

    job_id = create_job_record()
    seed = req.variation_seed if req.variation_seed is not None else random.randint(1000, 999999)

    if has_local:
        resolved_local = Path(req.local_path.strip()).resolve()
        if not resolved_local.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Local video file does not exist at: {resolved_local}",
            )
        background_tasks.add_task(
            execute_director_pipeline,
            job_id,
            source_type="local",
            local_path=resolved_local,
            custom_script=req.custom_script,
            model_size=req.model_size or "base",
            preset_id=req.preset_id,
            api_key=req.api_key,
            variation_seed=seed,
        )
    elif has_url:
        background_tasks.add_task(
            execute_director_pipeline,
            job_id,
            source_type="youtube",
            url=req.url.strip(),
            custom_script=req.custom_script,
            model_size=req.model_size or "base",
            preset_id=req.preset_id,
            api_key=req.api_key,
            variation_seed=seed,
        )
    else:
        background_tasks.add_task(
            execute_director_pipeline,
            job_id,
            source_type="sample",
            custom_script=req.custom_script,
            model_size=req.model_size or "base",
            preset_id=req.preset_id,
            api_key=req.api_key,
            variation_seed=seed,
        )

    return {"job_id": job_id, "status": "processing"}


@router.post("/api/ingest/upload")
async def ingest_upload_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    safe_name = Path(file.filename or f"upload_{int(time.time())}.mp4").name
    target_path = DOWNLOADS_DIR / safe_name
    tmp_upload = DOWNLOADS_DIR / f"{safe_name}.uploading"

    try:
        with open(tmp_upload, "wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)

        os.replace(str(tmp_upload), str(target_path))

        job_id = create_job_record()
        background_tasks.add_task(
            execute_director_pipeline,
            job_id,
            source_type="local",
            local_path=target_path,
            variation_seed=random.randint(1000, 999999),
        )
        return {"job_id": job_id, "status": "processing"}
    except Exception as e:
        if tmp_upload.exists():
            try:
                tmp_upload.unlink()
            except OSError:
                pass
        logger.error(f"Local file upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {e}")


@router.get("/api/recent-episodes")
def get_recent_episodes():
    episodes = []
    for meta_file in sorted(
        TRANSCRIPTS_DIR.glob("*_meta.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    ):
        try:
            with open(meta_file, "r", encoding="utf-8") as f:
                meta = json.load(f)
            mid = meta.get("id")
            if not mid:
                continue

            transcript_f = TRANSCRIPTS_DIR / f"{mid}_transcript.json"
            word_count = 0
            if transcript_f.exists():
                try:
                    with open(transcript_f, "r", encoding="utf-8") as tf:
                        t_data = json.load(tf)
                        word_count = len(t_data.get("words", []))
                except Exception:
                    pass

            manifests = list(OUTPUT_RENDERS_DIR.glob(f"{mid}*_manifest.json"))
            episodes.append(
                {
                    "id": mid,
                    "title": meta.get("title") or meta_file.stem.replace("_meta", ""),
                    "duration": float(meta.get("duration", 0.0) or 0.0),
                    "word_count": word_count,
                    "manifest_count": len(manifests),
                    "mtime": meta_file.stat().st_mtime,
                    "video_path": meta.get("video_path"),
                }
            )
        except Exception:
            continue
    return {"episodes": episodes[:12]}


@router.post("/api/load-episode/{media_id}")
def load_saved_episode(media_id: str):
    meta_file = TRANSCRIPTS_DIR / f"{media_id}_meta.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail="Episode metadata not found.")

    with open(meta_file, "r", encoding="utf-8") as f:
        media_info = json.load(f)

    transcript_f = TRANSCRIPTS_DIR / f"{media_id}_transcript.json"
    transcript_data = {}
    if transcript_f.exists():
        with open(transcript_f, "r", encoding="utf-8") as f:
            transcript_data = json.load(f)

    manifests = sorted(
        OUTPUT_RENDERS_DIR.glob(f"{media_id}*_manifest.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    clip_manifest = None
    if manifests:
        try:
            with open(manifests[0], "r", encoding="utf-8") as f:
                clip_manifest = json.load(f)
        except Exception:
            clip_manifest = None

    if not clip_manifest:
        from backend.services.pipeline_orchestrator import prepare_trimmed_clip_manifest

        dur = min(float(media_info.get("duration", 30.0) or 30.0), 45.0)
        clip_manifest = prepare_trimmed_clip_manifest(
            media_id=media_id,
            start_time=0.0,
            end_time=dur,
            preset_id="fable_editorial",
            viral_title=media_info.get("title", "Key Breakdown"),
            motion_events=[],
        )

    viral_title = clip_manifest.get("title") or media_info.get("title") or "Key Breakdown"
    best_clip = {
        "clip_id": clip_manifest.get("clip_id"),
        "start_time": clip_manifest.get("start_time", 0.0),
        "end_time": clip_manifest.get("end_time", 30.0),
        "hook_score": 95,
        "reasoning": "Primary viral moment",
        "title": viral_title,
    }

    rec_clips = []
    for m_path in manifests[:6]:
        try:
            with open(m_path, "r", encoding="utf-8") as f:
                m_data = json.load(f)
            rec_clips.append(
                {
                    "clip_id": m_data.get("clip_id"),
                    "rank": len(rec_clips) + 1,
                    "title": m_data.get("title", viral_title),
                    "start_time": m_data.get("start_time", 0.0),
                    "end_time": m_data.get("end_time", 30.0),
                    "duration": m_data.get("duration", 30.0),
                    "hook_score": 95 - len(rec_clips) * 2,
                    "viral_score": 95 - len(rec_clips) * 2,
                    "angle_tag": "TOP HOOK",
                    "reasoning": "Discovered viral moment",
                    "pan_keyframes": m_data.get("pan_keyframes", [{"t": 0.0, "pan": 50}]),
                    "motion_events": m_data.get("motion_events", []),
                }
            )
        except Exception:
            continue

    if not rec_clips:
        rec_clips = [
            {
                "clip_id": clip_manifest.get("clip_id"),
                "rank": 1,
                "title": viral_title,
                "start_time": clip_manifest.get("start_time", 0.0),
                "end_time": clip_manifest.get("end_time", 30.0),
                "duration": clip_manifest.get("duration", 30.0),
                "hook_score": 95,
                "viral_score": 95,
                "angle_tag": "TOP HOOK",
                "reasoning": "Primary viral moment",
                "pan_keyframes": clip_manifest.get("pan_keyframes", [{"t": 0.0, "pan": 50}]),
                "motion_events": clip_manifest.get("motion_events", []),
            }
        ]

    return {
        "media": media_info,
        "transcript": transcript_data,
        "niche": "Documentary Explainer",
        "viral_title": viral_title,
        "best_clip": best_clip,
        "motion_events": clip_manifest.get("motion_events", []),
        "recommended_clips": rec_clips,
        "clip_manifest": clip_manifest,
    }
