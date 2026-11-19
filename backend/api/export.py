import time
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from backend.config import OUTPUT_RENDERS_DIR, DOWNLOADS_DIR
from backend.core.jobs import (
    create_render_record,
    get_render_record,
    set_render_cancelled,
)
from backend.schemas.export import RenderExportRequest
from backend.services.export_orchestrator import execute_render_export_worker
from backend.services.remotion_exporter import cancel_active_render_process

logger = logging.getLogger("viral_studio.export")
router = APIRouter(tags=["export"])


@router.post("/api/render-export")
def export_short_video(req: RenderExportRequest, background_tasks: BackgroundTasks):
    render_id = create_render_record()

    background_tasks.add_task(
        execute_render_export_worker,
        render_id,
        req.clip_id,
        req.input_props,
        req.fps or 30,
    )
    return {
        "success": True,
        "render_id": render_id,
        "status": "rendering",
    }


@router.post("/api/render-cancel/{render_id}")
def cancel_render_export(render_id: str):
    success = set_render_cancelled(render_id)
    if not success:
        raise HTTPException(status_code=404, detail="Render job not found.")

    killed = cancel_active_render_process(render_id)
    return {"success": True, "render_id": render_id, "process_terminated": killed}


@router.get("/api/render-status/{render_id}")
def get_render_status(render_id: str):
    data = get_render_record(render_id)
    if not data:
        raise HTTPException(status_code=404, detail="Render job not found.")
    return data


@router.get("/api/download-video/{filename}")
def download_rendered_video(filename: str):
    safe_name = Path(filename).name
    candidate_paths = [
        OUTPUT_RENDERS_DIR / safe_name,
        DOWNLOADS_DIR / safe_name,
    ]
    for path in candidate_paths:
        if path.exists() and path.stat().st_size > 0:
            return FileResponse(
                path=str(path),
                media_type="video/mp4",
                filename=safe_name,
            )
    raise HTTPException(status_code=404, detail=f"Rendered video '{safe_name}' not found.")


@router.get("/api/download-thumbnail/{filename}")
def download_rendered_thumbnail(filename: str):
    safe_name = Path(filename).name
    candidate_paths = [
        OUTPUT_RENDERS_DIR / safe_name,
        DOWNLOADS_DIR / safe_name,
    ]
    for path in candidate_paths:
        if path.exists() and path.stat().st_size > 0:
            return FileResponse(
                path=str(path),
                media_type="image/jpeg",
                filename=safe_name,
            )
    raise HTTPException(status_code=404, detail=f"Thumbnail '{safe_name}' not found.")

