import os
import sys
import json
import shutil
import py_compile
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

errors = []
warnings = []


def ok(msg: str):
    print(f"  [PASS] {msg}")


def warn(msg: str):
    warnings.append(msg)
    print(f"  [WARN] {msg}")


def fail(msg: str):
    errors.append(msg)
    print(f"  [FAIL] {msg}")


def main():
    print("=" * 70)
    print("  VIRAL STUDIO v4.1 // FULL SYSTEM PRE-FLIGHT VERIFIER")
    print("=" * 70)

    # 1. Check required files exist
    print("\n1. Checking Required v4.1 Files...")
    required_files = [
        "backend/main.py",
        "backend/config.py",
        "backend/utils/ffmpeg_helper.py",
        "backend/services/ai_director.py",
        "backend/services/broll_fetcher.py",
        "backend/services/face_tracker.py",
        "backend/services/remotion_exporter.py",
        "backend/services/sfx_generator.py",
        "frontend/render_short.mjs",
        "frontend/src/types.ts",
        "frontend/src/App.tsx",
        "frontend/src/store/useStudioStore.ts",
        "frontend/src/components/TopCommandBar.tsx",
        "frontend/src/components/LoadVideoModal.tsx",
        "frontend/src/components/LeftInspector.tsx",
        "frontend/src/components/MultiTrackTimeline.tsx",
        "frontend/src/components/MotionDirectorPanel.tsx",
        "frontend/src/remotion/sceneCompiler.ts",
        "frontend/src/remotion/themeEngine.ts",
        "frontend/src/remotion/MasterShortComposition.tsx",
        "frontend/src/remotion/layers/DynamicStageRenderer.tsx",
        "frontend/src/remotion/layers/KineticCaptions.tsx",
    ]
    for rel in required_files:
        p = ROOT / rel
        if p.exists() and p.stat().st_size > 10:
            ok(rel)
        else:
            fail(f"Missing or empty file: {rel}")

    # 2. Python syntax & FastAPI import check
    print("\n2. Checking Python Syntax & Backend Imports...")
    py_files = list(BACKEND_DIR.rglob("*.py"))
    syntax_ok = True
    for pf in py_files:
        try:
            py_compile.compile(str(pf), doraise=True)
        except py_compile.PyCompileError as e:
            syntax_ok = False
            fail(f"Python syntax error in {pf.name}: {e}")
    if syntax_ok:
        ok(f"All {len(py_files)} Python files compiled cleanly.")

    sys.path.insert(0, str(ROOT))
    try:
        from backend.main import app  # noqa: F401
        from backend.config import GEMINI_API_KEY
        ok("backend.main FastAPI app imported cleanly (zero circular/missing imports).")
        if GEMINI_API_KEY:
            ok("GEMINI_API_KEY is configured in .env.")
        else:
            warn("GEMINI_API_KEY is empty in .env (fallback mode will be used).")
    except Exception as e:
        fail(f"Failed importing backend.main: {e}")

    # 3. System binaries check (ffmpeg, ffprobe, node)
    print("\n3. Checking FFmpeg & Node Binaries...")
    for bin_name in ("ffmpeg", "ffprobe", "node"):
        if shutil.which(bin_name):
            ok(f"{bin_name} found on PATH.")
        else:
            fail(f"{bin_name} NOT found on PATH.")

    # 4. Frontend package.json & Remotion version parity check
    print("\n4. Checking Frontend Packages & Remotion Version Parity...")
    pkg_path = FRONTEND_DIR / "package.json"
    if pkg_path.exists():
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
        deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

        for req_pkg in ("zustand", "@radix-ui/react-dropdown-menu", "@radix-ui/react-dialog"):
            if req_pkg in deps:
                ok(f"Installed: {req_pkg} ({deps[req_pkg]})")
            else:
                fail(f"Missing package: {req_pkg} -> run: npm install {req_pkg}")

        remotion_pkgs = [
            "remotion",
            "@remotion/player",
            "@remotion/bundler",
            "@remotion/renderer",
            "@remotion/tailwind",
            "@remotion/cli",
            "@remotion/paths",
            "@remotion/shapes",
            "@remotion/transitions",
            "@remotion/motion-blur",
        ]
        versions = {p: deps.get(p, "MISSING").lstrip("^~") for p in remotion_pkgs}
        unique_vers = set(versions.values())
        if len(unique_vers) == 1 and "MISSING" not in unique_vers:
            ok(f"All 10 Remotion packages match exact version: {list(unique_vers)[0]}")
        else:
            fail(f"Remotion version mismatch detected: {versions}")

    # 5. Full TypeScript compiler check (npx tsc --noEmit)
    print("\n5. Running TypeScript Type-Check (npx tsc --noEmit)...")
    npx_bin = "npx.cmd" if os.name == "nt" else "npx"
    try:
        res = subprocess.run(
            [npx_bin, "tsc", "--noEmit"],
            cwd=str(FRONTEND_DIR),
            capture_output=True,
            text=True,
            timeout=90,
        )
        if res.returncode == 0:
            ok("TypeScript check passed with ZERO errors!")
        else:
            fail(f"TypeScript compiler reported errors:\n{res.stdout}\n{res.stderr}")
    except Exception as e:
        fail(f"Could not run TypeScript check: {e}")

    # 6. Backend Unit Tests
    print("\n6. Running Backend Unit Tests (unittest)...")
    try:
        res = subprocess.run(
            [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", "test_*.py"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=60,
        )
        if res.returncode == 0:
            ok("All backend unit tests passed cleanly!")
        else:
            fail(f"Backend unit tests failed:\n{res.stdout}\n{res.stderr}")
    except Exception as e:
        fail(f"Could not run backend unit tests: {e}")

    print("\n" + "=" * 70)
    if errors:
        print(f"  RESULT: {len(errors)} ERROR(S) FOUND, {len(warnings)} WARNING(S)")
        print("=" * 70)
        sys.exit(1)
    else:
        print(f"  RESULT: ALL CHECKS PASSED! ({len(warnings)} warning(s)) — READY TO RUN")
        print("=" * 70)
        sys.exit(0)


if __name__ == "__main__":
    main()