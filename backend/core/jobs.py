import json
import logging
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, Any, Optional

from backend.config import TRANSCRIPTS_DIR, DOWNLOADS_DIR

logger = logging.getLogger("viral_studio.jobs")

MAX_STORED_JOBS = 50

JOBS: Dict[str, Dict[str, Any]] = {}
JOB_CANCEL_FLAGS: Dict[str, bool] = {}
RENDER_JOBS: Dict[str, Dict[str, Any]] = {}
RENDER_CANCEL_FLAGS: Dict[str, bool] = {}
JOBS_LOCK = threading.Lock()
RENDER_SEMAPHORE = threading.Semaphore(1)
MEDIA_REGISTRY: Dict[str, str] = {}


def persist_media_meta(media_info: Dict[str, Any]) -> None:
    media_id = media_info["id"]
    MEDIA_REGISTRY[media_id] = media_info["video_path"]
    meta_path = TRANSCRIPTS_DIR / f"{media_id}_meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(media_info, f, indent=2)


def resolve_source_video(media_id: str) -> Path:
    if media_id in MEDIA_REGISTRY and Path(MEDIA_REGISTRY[media_id]).exists():
        return Path(MEDIA_REGISTRY[media_id])

    meta_path = TRANSCRIPTS_DIR / f"{media_id}_meta.json"
    if meta_path.exists():
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
                vp = Path(meta.get("video_path", ""))
                if vp.exists():
                    MEDIA_REGISTRY[media_id] = str(vp)
                    return vp
        except Exception as e:
            logger.warning(f"Failed reading metadata for {media_id}: {e}")

    video_files = [
        f
        for f in DOWNLOADS_DIR.glob(f"{media_id}*.mp4")
        if not f.stem.endswith("_vertical") and not f.stem.endswith("_trimmed")
    ]
    if video_files:
        return video_files[0]

    raise FileNotFoundError(f"Source video for media '{media_id}' not found.")


def prune_old_records(store: Dict[str, Dict[str, Any]]) -> None:
    if len(store) > MAX_STORED_JOBS:
        oldest = sorted(
            store.keys(),
            key=lambda k: store[k].get("created_at", store[k].get("started_at", 0)),
        )
        for k in oldest[: len(store) - MAX_STORED_JOBS]:
            store.pop(k, None)
            JOB_CANCEL_FLAGS.pop(k, None)
            RENDER_CANCEL_FLAGS.pop(k, None)


def create_job_record() -> str:
    job_id = str(uuid.uuid4())
    with JOBS_LOCK:
        prune_old_records(JOBS)
        JOB_CANCEL_FLAGS[job_id] = False
        JOBS[job_id] = {
            "job_id": job_id,
            "status": "processing",
            "progress": 5,
            "step": "Initializing AI Video Director pipeline: 5%",
            "error": None,
            "result": None,
            "created_at": time.time(),
        }
    return job_id


def cancel_job(job_id: str) -> bool:
    """Thread-safe cancellation flag for active pipeline execution."""
    with JOBS_LOCK:
        if job_id not in JOBS:
            return False
        JOB_CANCEL_FLAGS[job_id] = True
        JOBS[job_id]["status"] = "cancelled"
        JOBS[job_id]["step"] = "Job cancelled by user"
        logger.info(f"Ingest/pipeline job {job_id} flagged as CANCELLED.")
        return True


def is_job_cancelled(job_id: str) -> bool:
    with JOBS_LOCK:
        return JOB_CANCEL_FLAGS.get(job_id, False)


def cleanup_job_temp_files(media_id: Optional[str] = None) -> None:
    """Cleans up orphaned temporary audio/video files on failure or cancellation."""
    try:
        patterns = ["*.uploading", "*.tmp.wav", "*.tmp.mp4", "*.part"]
        if media_id:
            patterns.extend([f"*{media_id}*.tmp*", f"*{media_id}*.uploading*"])
        for pattern in patterns:
            for p in DOWNLOADS_DIR.glob(pattern):
                try:
                    p.unlink(missing_ok=True)
                    logger.debug(f"Cleaned up temp file: {p.name}")
                except Exception as e:
                    logger.warning(f"Failed deleting temp file {p.name}: {e}")
    except Exception as exc:
        logger.warning(f"Error during temp file cleanup: {exc}")


def update_job_record(
    job_id: str,
    *,
    status: Optional[str] = None,
    progress: Optional[int] = None,
    step: Optional[str] = None,
    error: Optional[str] = None,
    result: Optional[Dict[str, Any]] = None,
) -> None:
    with JOBS_LOCK:
        if job_id not in JOBS:
            return
        if status is not None:
            JOBS[job_id]["status"] = status
        if progress is not None:
            JOBS[job_id]["progress"] = progress
        if step is not None:
            JOBS[job_id]["step"] = step
        if error is not None:
            JOBS[job_id]["error"] = error
        if result is not None:
            JOBS[job_id]["result"] = result


def get_job_record(job_id: str) -> Optional[Dict[str, Any]]:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        return dict(job) if job else None


def create_render_record() -> str:
    render_id = str(uuid.uuid4())
    with JOBS_LOCK:
        prune_old_records(RENDER_JOBS)
        RENDER_CANCEL_FLAGS[render_id] = False
        RENDER_JOBS[render_id] = {
            "render_id": render_id,
            "status": "rendering",
            "progress": 5,
            "step": "Queued for 1080x1920 Remotion Export...",
            "eta_sec": 18,
            "download_url": None,
            "filename": None,
            "error": None,
            "started_at": time.time(),
        }
    return render_id


def update_render_record(
    render_id: str,
    *,
    status: Optional[str] = None,
    progress: Optional[int] = None,
    step: Optional[str] = None,
    eta_sec: Optional[int] = None,
    download_url: Optional[str] = None,
    filename: Optional[str] = None,
    thumbnail_url: Optional[str] = None,
    file_size_bytes: Optional[int] = None,
    duration_sec: Optional[float] = None,
    error: Optional[str] = None,
    **extra: Any,
) -> None:
    with JOBS_LOCK:
        if render_id not in RENDER_JOBS:
            return
        if status is not None:
            RENDER_JOBS[render_id]["status"] = status
        if progress is not None:
            RENDER_JOBS[render_id]["progress"] = progress
        if step is not None:
            RENDER_JOBS[render_id]["step"] = step
        if eta_sec is not None:
            RENDER_JOBS[render_id]["eta_sec"] = eta_sec
        if download_url is not None:
            RENDER_JOBS[render_id]["download_url"] = download_url
        if filename is not None:
            RENDER_JOBS[render_id]["filename"] = filename
        if thumbnail_url is not None:
            RENDER_JOBS[render_id]["thumbnail_url"] = thumbnail_url
        if file_size_bytes is not None:
            RENDER_JOBS[render_id]["file_size_bytes"] = file_size_bytes
        if duration_sec is not None:
            RENDER_JOBS[render_id]["duration_sec"] = duration_sec
        if error is not None:
            RENDER_JOBS[render_id]["error"] = error
        for k, v in extra.items():
            RENDER_JOBS[render_id][k] = v


def get_render_record(render_id: str) -> Optional[Dict[str, Any]]:
    with JOBS_LOCK:
        r_job = RENDER_JOBS.get(render_id)
        if not r_job:
            return None
        data = dict(r_job)
        data["elapsed_sec"] = int(time.time() - data.get("started_at", time.time()))
        return data


def set_render_cancelled(render_id: str) -> bool:
    with JOBS_LOCK:
        if render_id not in RENDER_JOBS:
            return False
        RENDER_CANCEL_FLAGS[render_id] = True
        RENDER_JOBS[render_id]["status"] = "cancelled"
        RENDER_JOBS[render_id]["step"] = "Cancelling Chromium render..."
        return True


def is_render_cancelled(render_id: str) -> bool:
    with JOBS_LOCK:
        return bool(RENDER_CANCEL_FLAGS.get(render_id, False))
