from fastapi import APIRouter
from backend.config import get_gemini_api_key

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check():
    key = get_gemini_api_key()
    return {
        "status": "online",
        "engine": "Viral Studio Enterprise Director v4.2",
        "whisper_ready": True,
        "ffmpeg_ready": True,
        "gemini_configured": bool(key),
    }
