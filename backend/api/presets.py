import json
import logging
from fastapi import APIRouter
from backend.config import PRESETS_DIR

logger = logging.getLogger("viral_studio.presets")
router = APIRouter(tags=["presets"])


@router.get("/api/presets")
def get_presets():
    presets = []
    for p_path in sorted(PRESETS_DIR.glob("*.json")):
        try:
            with open(p_path, "r", encoding="utf-8") as f:
                presets.append(json.load(f))
        except Exception as e:
            logger.error(f"Error loading preset {p_path}: {e}")
    return {"presets": presets}
