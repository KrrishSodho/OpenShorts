import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import STORAGE_DIR, FRONTEND_DIR
from backend.services.sfx_generator import ensure_sfx_assets
from backend.api import api_router

# Core & Service re-exports for backwards compatibility
from backend.core.jobs import (
    JOBS,
    RENDER_JOBS,
    RENDER_CANCEL_FLAGS,
    JOBS_LOCK,
    RENDER_SEMAPHORE,
    create_job_record,
    update_job_record,
    get_job_record,
    create_render_record,
    update_render_record,
    get_render_record,
)
from backend.services.pipeline_orchestrator import (
    get_default_preset,
    prepare_trimmed_clip_manifest,
    execute_director_pipeline,
)
from backend.services.export_orchestrator import execute_render_export_worker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("viral_studio")

app = FastAPI(
    title="OpenShort AI Video Director API",
    description="Enterprise Modular AI Video Director Backend",
    version="4.2.0",
)

DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
custom_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
allowed_origins = custom_origins or DEFAULT_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Ensure audio assets exist at startup
ensure_sfx_assets()

# Mount modular API router
app.include_router(api_router)

# Mount frontend static distribution if available (Desktop / Production distribution)
if FRONTEND_DIR.exists() and (FRONTEND_DIR / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

__all__ = [
    "app",
    "JOBS",
    "RENDER_JOBS",
    "RENDER_CANCEL_FLAGS",
    "JOBS_LOCK",
    "RENDER_SEMAPHORE",
    "create_job_record",
    "update_job_record",
    "get_job_record",
    "create_render_record",
    "update_render_record",
    "get_render_record",
    "get_default_preset",
    "prepare_trimmed_clip_manifest",
    "execute_director_pipeline",
    "execute_render_export_worker",
]

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
