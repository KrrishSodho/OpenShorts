import json
import random
import logging
import os
from typing import Optional
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from backend.config import TRANSCRIPTS_DIR, GEMINI_API_KEY, get_gemini_api_key
from backend.schemas.clip import RemixMotionRequest
from backend.services.ai_director import remix_clip_motion_events, get_last_ai_trace, LAST_AI_TRACE
from backend.services.llm import get_video_trace_history
from backend.services.custom_scene_generator import generate_custom_scene
from backend.services.short_planner import plan_or_load_short, save_user_overrides
from backend.config import DEFAULT_GEMINI_MODEL

logger = logging.getLogger("viral_studio.ai")
router = APIRouter(tags=["ai"])


class SettingsUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    selected_model: Optional[str] = None


class CustomSceneRequest(BaseModel):
    media_id: Optional[str] = None
    clip_transcript: Optional[str] = ""
    prompt: Optional[str] = ""
    tag: Optional[str] = ""
    headline: Optional[str] = ""
    value: Optional[str] = ""
    subtext: Optional[str] = ""
    trigger_phrase: Optional[str] = ""
    detected_language: Optional[str] = "en"
    theme_accent: Optional[str] = "#00F5FF"
    theme_text: Optional[str] = "#FFFFFF"
    provider: Optional[str] = "gemini"
    api_key: Optional[str] = ""
    model: Optional[str] = ""


@router.get("/api/ai-trace")
def get_ai_trace_endpoint(media_id: Optional[str] = None):
    history_payload = get_video_trace_history(media_id)
    active = history_payload.get("active_trace", {})
    return {
        **active,
        "history": history_payload.get("history", []),
        "total_calls": history_payload.get("total_calls", 0),
        "total_video_tokens": history_payload.get("total_tokens", 0),
        "cumulative_tokens": history_payload.get("tokens", {}),
    }


@router.get("/api/settings")
def get_settings_endpoint():
    key = os.getenv("GEMINI_API_KEY", "")
    has_key = bool(key and len(key.strip()) > 8)
    masked = f"{key[:6]}...{key[-4:]}" if has_key and len(key) >= 12 else ("Configured" if has_key else "")

    ant_key = os.getenv("ANTHROPIC_API_KEY", "")
    has_ant = bool(ant_key and len(ant_key.strip()) > 8)
    masked_ant = f"{ant_key[:6]}...{ant_key[-4:]}" if has_ant and len(ant_key) >= 12 else ("Configured" if has_ant else "")

    selected_model = os.getenv("SELECTED_GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip()
    return {
        "has_gemini_key": has_key,
        "masked_key": masked,
        "has_anthropic_key": has_ant,
        "masked_anthropic_key": masked_ant,
        "mode": "gemini" if has_key else "fallback",
        "selected_model": selected_model,
        "available_models": [
            {"id": "gemini-3.5-flash-lite", "label": "Gemini 3.5 Flash-Lite (Fast Story & Motion Planning - Recommended)"},
            {"id": "gemini-3.1-flash-lite", "label": "Gemini 3.1 Flash-Lite (High Speed Fallback)"},
            {"id": "gemini-3.8-flash", "label": "Gemini 3.8 Flash (Deep Reasoning)"},
            {"id": "claude-3-5-sonnet-latest", "label": "Claude 3.5 Sonnet (Anthropic)"},
        ],
    }


@router.post("/api/settings")
def update_settings_endpoint(req: SettingsUpdateRequest):
    env_file = Path(".env")
    lines = env_file.read_text(encoding="utf-8").splitlines() if env_file.exists() else []

    if req.gemini_api_key is not None:
        clean_key = req.gemini_api_key.strip().strip('"').strip("'")
        os.environ["GEMINI_API_KEY"] = clean_key
        import backend.config
        backend.config.GEMINI_API_KEY = clean_key
        key_found = False
        new_lines = []
        for line in lines:
            if line.startswith("GEMINI_API_KEY="):
                new_lines.append(f'GEMINI_API_KEY="{clean_key}"')
                key_found = True
            else:
                new_lines.append(line)
        if not key_found:
            new_lines.append(f'GEMINI_API_KEY="{clean_key}"')
        lines = new_lines

    if req.anthropic_api_key is not None:
        clean_ant_key = req.anthropic_api_key.strip().strip('"').strip("'")
        os.environ["ANTHROPIC_API_KEY"] = clean_ant_key
        ant_found = False
        new_lines = []
        for line in lines:
            if line.startswith("ANTHROPIC_API_KEY="):
                new_lines.append(f'ANTHROPIC_API_KEY="{clean_ant_key}"')
                ant_found = True
            else:
                new_lines.append(line)
        if not ant_found:
            new_lines.append(f'ANTHROPIC_API_KEY="{clean_ant_key}"')
        lines = new_lines

    if req.selected_model:
        clean_model = req.selected_model.strip()
        os.environ["SELECTED_GEMINI_MODEL"] = clean_model
        model_found = False
        new_lines = []
        for line in lines:
            if line.startswith("SELECTED_GEMINI_MODEL="):
                new_lines.append(f'SELECTED_GEMINI_MODEL="{clean_model}"')
                model_found = True
            else:
                new_lines.append(line)
        if not model_found:
            new_lines.append(f'SELECTED_GEMINI_MODEL="{clean_model}"')
        lines = new_lines

    try:
        env_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    except Exception as e:
        logger.warning(f"Could not persist settings to .env: {e}")

    active_key = os.getenv("GEMINI_API_KEY", "")
    has_key = bool(active_key and len(active_key.strip()) > 8)
    masked = f"{active_key[:6]}...{active_key[-4:]}" if len(active_key) >= 12 else "Configured"

    active_ant = os.getenv("ANTHROPIC_API_KEY", "")
    has_ant = bool(active_ant and len(active_ant.strip()) > 8)
    masked_ant = f"{active_ant[:6]}...{active_ant[-4:]}" if len(active_ant) >= 12 else "Configured"

    current_model = os.getenv("SELECTED_GEMINI_MODEL", "gemini-3.8-flash")

    return {
        "success": True,
        "has_gemini_key": has_key,
        "masked_key": masked,
        "has_anthropic_key": has_ant,
        "masked_anthropic_key": masked_ant,
        "mode": "gemini" if has_key else "fallback",
        "selected_model": current_model,
    }


@router.post("/api/generate-custom-scene")
def generate_custom_scene_endpoint(req: CustomSceneRequest):
    transcript_text = req.clip_transcript or ""
    if not transcript_text and req.media_id:
        transcript_file = TRANSCRIPTS_DIR / f"{req.media_id}_transcript.json"
        if transcript_file.exists():
            try:
                with open(transcript_file, "r", encoding="utf-8") as f:
                    t_data = json.load(f)
                    words = t_data.get("words", [])
                    transcript_text = " ".join(w.get("word", "") for w in words[:120])
            except Exception as e:
                logger.warning(f"Failed to read transcript for custom scene: {e}")

    result = generate_custom_scene(
        clip_transcript=transcript_text,
        user_prompt=req.prompt or "",
        tag=req.tag or "",
        headline=req.headline or "",
        value=req.value or "",
        subtext=req.subtext or "",
        trigger_phrase=req.trigger_phrase or "",
        detected_language=req.detected_language or "en",
        theme_accent=req.theme_accent or "#00F5FF",
        theme_text=req.theme_text or "#FFFFFF",
        provider=req.provider or "gemini",
        api_key=req.api_key or "",
        preferred_model=req.model or "",
    )
    return result


@router.post("/api/remix-motion")
def remix_motion_endpoint(req: RemixMotionRequest):
    transcript_file = TRANSCRIPTS_DIR / f"{req.media_id}_transcript.json"
    if not transcript_file.exists():
        raise HTTPException(status_code=404, detail="Transcript not found for this media.")

    with open(transcript_file, "r", encoding="utf-8") as f:
        transcript_data = json.load(f)

    seed = req.variation_seed if req.variation_seed is not None else random.randint(1000, 999999)
    detailed_res = remix_clip_motion_events(
        transcript_data=transcript_data,
        start_time=req.start_time,
        end_time=req.end_time,
        viral_title=req.viral_title,
        api_key=req.api_key or get_gemini_api_key(),
        variation_seed=seed,
        media_id=req.media_id,
        return_details=True,
    )
    return {
        "success": True,
        "variation_seed": seed,
        "motion_events": detailed_res["motion_events"],
        "story": detailed_res.get("story"),
        "clean_intervals": detailed_res.get("clean_intervals", []),
        "dropped_moments": detailed_res.get("dropped_moments", []),
    }


class PlanShortAPIRequest(BaseModel):
    media_id: str
    start_time: float
    end_time: float
    preset_id: Optional[str] = "podcast_punch"
    variation_seed: Optional[int] = None
    force_regenerate: Optional[bool] = False
    api_key: Optional[str] = None


class PlanOverridesAPIRequest(BaseModel):
    media_id: str
    start_time: float
    end_time: float
    overrides: dict


@router.post("/api/plan-short")
def plan_short_endpoint(req: PlanShortAPIRequest):
    plan_result = plan_or_load_short(
        media_id=req.media_id,
        start_time=req.start_time,
        end_time=req.end_time,
        preset_id=req.preset_id or "podcast_punch",
        variation_seed=req.variation_seed,
        force_regenerate=bool(req.force_regenerate),
        api_key=req.api_key or "",
    )
    return plan_result


@router.post("/api/save-plan-overrides")
def save_plan_overrides_endpoint(req: PlanOverridesAPIRequest):
    ok = save_user_overrides(
        media_id=req.media_id,
        start_time=req.start_time,
        end_time=req.end_time,
        overrides=req.overrides,
    )
    return {"success": ok}

