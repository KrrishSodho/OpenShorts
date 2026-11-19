# PATH: desktop/scripts/package_desktop.py
"""
Master Desktop Packaging Orchestrator for Viral Studio
Executes all preparation and build stages in sequence:
  1. Provision binaries (FFmpeg & FFprobe)
  2. Build React frontend (Vite)
  3. Build Frozen Python backend (PyInstaller)
  4. Build Electron TypeScript main & preload
  5. Assemble packaging assets
"""

import os
import sys
import subprocess
from pathlib import Path

DESKTOP_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = DESKTOP_DIR.parent
SCRIPTS_DIR = DESKTOP_DIR / "scripts"


def run_stage(title: str, cmd: list, cwd: Path) -> bool:
    print("\n" + "=" * 65)
    print(f"STAGE: {title}")
    print("=" * 65)
    print(f"Command: {' '.join(cmd)}\nWorking Dir: {cwd}\n")
    proc = subprocess.run(cmd, cwd=str(cwd))
    if proc.returncode != 0:
        print(f"\n[Error] {title} failed with code {proc.returncode}!", file=sys.stderr)
        return False
    print(f"\n[OK] {title} completed successfully.")
    return True


def main():
    print("*" * 65)
    print("VIRAL STUDIO STANDALONE DESKTOP PACKAGING PIPELINE")
    print("*" * 65)

    py_exe = sys.executable
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

    # Stage 1: Provision static FFmpeg/FFprobe binaries
    if not run_stage(
        "Provision Static Media Binaries (FFmpeg/FFprobe)",
        [py_exe, str(SCRIPTS_DIR / "download_binaries.py")],
        DESKTOP_DIR,
    ):
        sys.exit(1)

    # Stage 2: Build Vite React Frontend
    if not run_stage(
        "Build Static Frontend Bundle",
        [py_exe, str(SCRIPTS_DIR / "build_frontend.py")],
        DESKTOP_DIR,
    ):
        sys.exit(1)

    # Stage 3: Build PyInstaller Frozen Backend
    if not run_stage(
        "Build Frozen Python FastAPI Backend",
        [py_exe, str(SCRIPTS_DIR / "build_backend.py")],
        DESKTOP_DIR,
    ):
        sys.exit(1)

    # Stage 4: Compile Electron TypeScript
    if not run_stage(
        "Compile Electron Main & Preload TypeScript",
        [npm_cmd, "run", "build:electron"],
        DESKTOP_DIR,
    ):
        sys.exit(1)

    print("\n" + "*" * 65)
    print("ALL BUILD STAGES COMPLETED SUCCESSFULLY!")
    print("Desktop assets ready in desktop/dist/ and desktop/dist-electron/")
    print("To package the final installer (.exe), run:")
    print("  cd desktop && npm run package")
    print("*" * 65)


if __name__ == "__main__":
    main()
