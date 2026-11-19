# PATH: desktop/pyinstaller/entrypoint.py
"""
Standalone Desktop Entrypoint for Viral Studio Backend
Enables running the FastAPI service in a frozen PyInstaller bundle.
- Relocates writable user storage to %APPDATA%/ViralStudio/storage
- Injects bundled ffmpeg/ffprobe binary directory into PATH
- Accepts dynamic port assignment from Electron supervisor
"""

import os
import sys
import argparse
import logging
from pathlib import Path

# Configure basic logging for standalone execution
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("viral_studio.desktop_entrypoint")


def setup_desktop_environment(storage_dir_arg: str = None, frontend_dir_arg: str = None) -> None:
    is_frozen = getattr(sys, "frozen", False)
    
    # 1. Determine writable user data / storage directory
    if storage_dir_arg and storage_dir_arg.strip():
        user_storage = Path(storage_dir_arg.strip()).resolve()
    elif is_frozen:
        app_data = os.environ.get("APPDATA") or os.environ.get("LOCALAPPDATA") or str(Path.home())
        user_storage = Path(app_data) / "ViralStudio" / "storage"
    else:
        # Development fallback
        user_storage = (Path(__file__).resolve().parent.parent.parent / "storage").resolve()

    user_storage.mkdir(parents=True, exist_ok=True)
    os.environ["VIRAL_STUDIO_STORAGE_DIR"] = str(user_storage)
    logger.info(f"Initialized Desktop Storage at: {user_storage}")

    if frontend_dir_arg and frontend_dir_arg.strip():
        frontend_path = Path(frontend_dir_arg.strip()).resolve()
        if frontend_path.exists():
            os.environ["VIRAL_STUDIO_FRONTEND_DIR"] = str(frontend_path)
            logger.info(f"Set Frontend Directory at: {frontend_path}")

    # Subdirectories
    for subdir in ("transcripts", "downloads", "renders", "cache", "plans"):
        (user_storage / subdir).mkdir(parents=True, exist_ok=True)

    # 2. Inject bundled FFmpeg / FFprobe binaries into PATH
    if is_frozen:
        bundle_dir = Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
        candidates = [
            bundle_dir / "bin",
            bundle_dir / "resources" / "bin",
            Path(sys.executable).parent / "bin",
            Path(sys.executable).parent / "resources" / "bin",
        ]
        for c in candidates:
            if c.exists() and (c / "ffmpeg.exe").exists():
                os.environ["PATH"] = str(c) + os.pathsep + os.environ.get("PATH", "")
                logger.info(f"Prepended bundled binary directory to PATH: {c}")
                break


def main():
    parser = argparse.ArgumentParser(description="Viral Studio Desktop Backend Service")
    parser.add_argument("--port", type=int, default=8000, help="Local HTTP port to bind")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host interface to bind")
    parser.add_argument("--storage-dir", type=str, default="", help="Custom storage root path")
    parser.add_argument("--frontend-dir", type=str, default="", help="Static frontend directory path")
    args = parser.parse_args()

    setup_desktop_environment(args.storage_dir, args.frontend_dir)

    import uvicorn
    # Import the FastAPI application
    from backend.main import app

    logger.info(f"Starting Viral Studio FastAPI Desktop Service on http://{args.host}:{args.port}")
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info",
        access_log=False,
    )


if __name__ == "__main__":
    main()
