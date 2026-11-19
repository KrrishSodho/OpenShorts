import logging
from pathlib import Path
from typing import Dict, Any

from backend.config import OUTPUT_RENDERS_DIR
from backend.core.jobs import (
    JOBS_LOCK,
    RENDER_JOBS,
    RENDER_CANCEL_FLAGS,
    RENDER_SEMAPHORE,
    update_render_record,
)
from backend.services.remotion_exporter import (
    render_burned_in_short_mp4,
    RenderCancelledError,
)

logger = logging.getLogger("viral_studio.export")


def execute_render_export_worker(
    render_id: str,
    clip_id: str,
    input_props: Dict[str, Any],
    fps: int,
) -> None:
    acquired = False
    try:
        with JOBS_LOCK:
            if RENDER_CANCEL_FLAGS.get(render_id):
                RENDER_JOBS[render_id].update({"status": "cancelled", "step": "Export cancelled"})
                return
            if render_id in RENDER_JOBS:
                RENDER_JOBS[render_id]["step"] = "Waiting in single-render queue..."

        RENDER_SEMAPHORE.acquire()
        acquired = True

        if RENDER_CANCEL_FLAGS.get(render_id):
            with JOBS_LOCK:
                if render_id in RENDER_JOBS:
                    RENDER_JOBS[render_id].update({"status": "cancelled", "step": "Export cancelled"})
            return

        frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"

        def on_progress(pct: int, step_msg: str, eta_sec: int):
            with JOBS_LOCK:
                if render_id in RENDER_JOBS and not RENDER_CANCEL_FLAGS.get(render_id):
                    RENDER_JOBS[render_id]["progress"] = pct
                    RENDER_JOBS[render_id]["step"] = step_msg
                    RENDER_JOBS[render_id]["eta_sec"] = eta_sec

        final_mp4, thumb_file, file_size = render_burned_in_short_mp4(
            frontend_dir=frontend_dir,
            output_renders_dir=OUTPUT_RENDERS_DIR,
            clip_id=clip_id,
            input_props=input_props,
            fps=fps,
            progress_callback=on_progress,
            render_id=render_id,
            cancel_check=lambda: bool(RENDER_CANCEL_FLAGS.get(render_id, False)),
        )

        with JOBS_LOCK:
            record: Dict[str, Any] = {
                "status": "completed",
                "progress": 100,
                "step": "1080x1920 MP4 Export Complete!",
                "eta_sec": 0,
                "download_url": f"/api/download-video/{final_mp4.name}",
                "filename": final_mp4.name,
                "file_size_bytes": file_size,
                "duration_sec": float(input_props.get("duration", 0)),
            }
            if thumb_file:
                record["thumbnail_url"] = f"/api/download-thumbnail/{thumb_file.name}"
            RENDER_JOBS[render_id].update(record)
    except RenderCancelledError:
        logger.info(f"Render {render_id} cancelled cleanly by user.")
        with JOBS_LOCK:
            if render_id in RENDER_JOBS:
                RENDER_JOBS[render_id].update(
                    {
                        "status": "cancelled",
                        "step": "Export cancelled by user",
                    }
                )
    except Exception as e:
        logger.exception(f"Render worker {render_id} failed: {e}")
        with JOBS_LOCK:
            if render_id in RENDER_JOBS:
                RENDER_JOBS[render_id].update(
                    {
                        "status": "failed",
                        "error": str(e),
                        "step": "Export failed",
                    }
                )
    finally:
        if acquired:
            RENDER_SEMAPHORE.release()
