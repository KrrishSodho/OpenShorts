# PATH: desktop/scripts/build_frontend.py
"""
Build Script for compiling the Vite React Frontend for Desktop
Runs production build and copies output to desktop/dist/frontend/
"""

import sys
import shutil
import subprocess
from pathlib import Path

DESKTOP_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = DESKTOP_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
TARGET_DIR = DESKTOP_DIR / "dist" / "frontend"


def build_frontend():
    print("=" * 60)
    print("Building Viral Studio React Frontend for Desktop Distribution")
    print("=" * 60)

    if not FRONTEND_DIR.exists():
        print(f"[Error] Frontend directory not found at: {FRONTEND_DIR}", file=sys.stderr)
        return False

    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    cmd = [npm_cmd, "run", "build"]

    print(f"Running command in {FRONTEND_DIR}:\n{' '.join(cmd)}\n")
    proc = subprocess.run(cmd, cwd=str(FRONTEND_DIR))
    if proc.returncode != 0:
        print("[Error] Frontend build failed with non-zero exit code.", file=sys.stderr)
        return False

    frontend_dist = FRONTEND_DIR / "dist"
    if not (frontend_dist / "index.html").exists():
        print(f"[Error] Expected index.html not found in {frontend_dist}", file=sys.stderr)
        return False

    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copytree(frontend_dist, TARGET_DIR, dirs_exist_ok=True)
    print(f"[Success] Copied static frontend bundle to: {TARGET_DIR}")
    return True


if __name__ == "__main__":
    success = build_frontend()
    sys.exit(0 if success else 1)
