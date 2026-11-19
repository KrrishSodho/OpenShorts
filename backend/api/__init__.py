from fastapi import APIRouter

from backend.api.health import router as health_router
from backend.api.presets import router as presets_router
from backend.api.ingest import router as ingest_router
from backend.api.jobs import router as jobs_router
from backend.api.clips import router as clips_router
from backend.api.ai import router as ai_router
from backend.api.export import router as export_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(presets_router)
api_router.include_router(ingest_router)
api_router.include_router(jobs_router)
api_router.include_router(clips_router)
api_router.include_router(ai_router)
api_router.include_router(export_router)

__all__ = ["api_router"]
