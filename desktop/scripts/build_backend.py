# PATH: desktop/scripts/build_backend.py
"""
Build Script for Freezing the Python FastAPI Backend via PyInstaller
Compiles backend into desktop/dist/backend/viral-studio-backend/
"""

import sys
import shutil
import subprocess
from pathlib import Path

DESKTOP_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = DESKTOP_DIR.parent
SPEC_FILE = DESKTOP_DIR / "pyinstaller" / "backend.spec"
DIST_DIR = DESKTOP_DIR / "dist" / "backend"
BUILD_DIR = DESKTOP_DIR / "build" / "pyinstaller"


def build_frozen_backend():
    print("=" * 60)
    print("Building Viral Studio Python Backend with PyInstaller")
    print("=" * 60)

    if not SPEC_FILE.exists():
        print(f"[Error] Spec file not found at: {SPEC_FILE}", file=sys.stderr)
        return False

    DIST_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        f"--distpath={DIST_DIR}",
        f"--workpath={BUILD_DIR}",
        str(SPEC_FILE),
    ]

    print(f"Running command:\n{' '.join(cmd)}\n")
    proc = subprocess.run(cmd, cwd=str(PROJECT_ROOT))
    if proc.returncode != 0:
        print("[Error] PyInstaller build failed with non-zero exit code.", file=sys.stderr)
        return False

    output_exe = DIST_DIR / "viral-studio-backend" / "viral-studio-backend.exe"
    if not output_exe.exists():
        print(f"[Error] Target binary not found at: {output_exe}", file=sys.stderr)
        return False

    # Copy presets folder into compiled bundle
    presets_src = PROJECT_ROOT / "presets"
    presets_dest = DIST_DIR / "viral-studio-backend" / "presets"
    if presets_src.exists():
        shutil.copytree(presets_src, presets_dest, dirs_exist_ok=True)
        print(f"[Success] Copied presets from {presets_src} to {presets_dest}")

    print("=" * 60)
    print(f"SUCCESS: Frozen backend created at:\n{output_exe}")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = build_frozen_backend()
    sys.exit(0 if success else 1)
