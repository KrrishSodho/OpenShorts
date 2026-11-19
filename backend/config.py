# PATH: backend/config.py
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Support dynamic storage and presets directories for frozen desktop packaging
_env_storage = os.getenv("VIRAL_STUDIO_STORAGE_DIR", "").strip()
if _env_storage:
    STORAGE_DIR = Path(_env_storage)
else:
    STORAGE_DIR = PROJECT_ROOT / "storage"

_env_presets = os.getenv("VIRAL_STUDIO_PRESETS_DIR", "").strip()
if _env_presets:
    PRESETS_DIR = Path(_env_presets)
else:
    # Check bundled PyInstaller directory if frozen
    _bundle_presets = Path(getattr(os.sys, "_MEIPASS", str(PROJECT_ROOT))) / "presets"
    PRESETS_DIR = _bundle_presets if _bundle_presets.exists() else (PROJECT_ROOT / "presets")

_env_frontend = os.getenv("VIRAL_STUDIO_FRONTEND_DIR", "").strip()
if _env_frontend:
    FRONTEND_DIR = Path(_env_frontend)
else:
    _bundle_frontend = Path(getattr(os.sys, "_MEIPASS", str(PROJECT_ROOT))) / "frontend"
    _desktop_frontend = PROJECT_ROOT / "desktop" / "dist" / "frontend"
    _web_frontend = PROJECT_ROOT / "frontend" / "dist"
    if _bundle_frontend.exists() and (_bundle_frontend / "index.html").exists():
        FRONTEND_DIR = _bundle_frontend
    elif _desktop_frontend.exists() and (_desktop_frontend / "index.html").exists():
        FRONTEND_DIR = _desktop_frontend
    elif _web_frontend.exists() and (_web_frontend / "index.html").exists():
        FRONTEND_DIR = _web_frontend
    else:
        FRONTEND_DIR = _desktop_frontend

# Force override=True so any update in .env is always loaded
load_dotenv(PROJECT_ROOT / ".env", override=True)
load_dotenv(BACKEND_DIR / ".env", override=True)

DOWNLOADS_DIR = STORAGE_DIR / "downloads"
TRANSCRIPTS_DIR = STORAGE_DIR / "transcripts"
MASKS_DIR = STORAGE_DIR / "masks"
OUTPUT_RENDERS_DIR = STORAGE_DIR / "output_renders"
PLANS_DIR = STORAGE_DIR / "plans"

for path in [DOWNLOADS_DIR, TRANSCRIPTS_DIR, MASKS_DIR, OUTPUT_RENDERS_DIR, PLANS_DIR]:
    path.mkdir(parents=True, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip().strip('"').strip("'")
DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite"
DEFAULT_GEMINI_MODEL_CHAIN = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"]
DEPRECATED_404_MODELS = {
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
}


def get_gemini_api_key() -> str:
    """Dynamically resolve GEMINI_API_KEY from environment or loaded .env."""
    return os.getenv("GEMINI_API_KEY", "").strip().strip('"').strip("'")


def get_anthropic_api_key() -> str:
    """Dynamically resolve ANTHROPIC_API_KEY from environment."""
    return os.getenv("ANTHROPIC_API_KEY", "").strip().strip('"').strip("'")


def get_selected_model() -> str:
    """Dynamically resolve SELECTED_GEMINI_MODEL from environment."""
    model = os.getenv("SELECTED_GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
    if model in DEPRECATED_404_MODELS:
        return "gemini-3.5-flash-lite"
    return model


def get_gemini_model_chain() -> list[str]:
    """Dynamically resolve model chain, prioritizing user's selected model and removing deprecated/404 models."""
    selected = os.getenv("SELECTED_GEMINI_MODEL", "").strip()
    raw = os.getenv("GEMINI_MODEL_CHAIN", "").strip()
    base_chain = [m.strip() for m in raw.split(",") if m.strip()] if raw else list(DEFAULT_GEMINI_MODEL_CHAIN)
    chain = []
    if selected and selected not in DEPRECATED_404_MODELS:
        chain.append(selected)
    for m in base_chain:
        if m not in chain and m not in DEPRECATED_404_MODELS:
            chain.append(m)
    return chain or ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]


import sys
import shutil

DEFAULT_WIDTH = 1080
DEFAULT_HEIGHT = 1920
DEFAULT_FPS = 30
DEFAULT_CLIP_DURATION = 50

PYTHON_EXECUTABLE = os.getenv("PYTHON_EXECUTABLE") or sys.executable or shutil.which("python") or shutil.which("py") or "python"
FFMPEG_PATH = os.getenv("FFMPEG_PATH", "ffmpeg")
FFPROBE_PATH = os.getenv("FFPROBE_PATH", "ffprobe")