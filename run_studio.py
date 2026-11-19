import sys
import subprocess
import time
import os
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
PYTHON_EXE = os.getenv("PYTHON_EXECUTABLE") or sys.executable or shutil.which("python") or shutil.which("py") or "python"

def start_studio():
    print("=" * 70)
    print("  OPENSHORT // AUTONOMOUS OMNICHANNEL VIDEO ENGINE")
    print("=" * 70)
    print("  1. Starting Backend API Server (FastAPI on http://127.0.0.1:8000)...")
    
    backend_proc = subprocess.Popen(
        [PYTHON_EXE, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(PROJECT_ROOT)
    )
    
    time.sleep(2)
    
    print("  2. Starting Studio Web UI (Remotion Player on http://localhost:3000)...")
    frontend_dir = PROJECT_ROOT / "frontend"
    
    # Run npm run dev via shell on Windows
    frontend_proc = subprocess.Popen(
        "npm run dev",
        shell=True,
        cwd=str(frontend_dir)
    )
    
    print("\n" + "-" * 70)
    print("  STUDIO READY! Open in your browser:")
    print("  -> http://localhost:3000")
    print("  API Docs:")
    print("  -> http://127.0.0.1:8000/docs")
    print("-" * 70)
    print("  Press Ctrl + C in this terminal to stop both servers.")
    print("=" * 70 + "\n")
    
    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping Viral Studio servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Done.")

if __name__ == "__main__":
    start_studio()
