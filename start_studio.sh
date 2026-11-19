#!/usr/bin/env bash
set -e

echo "======================================================================"
echo "  OPENSHORT - AI SHORT-FORM VIDEO PRODUCTION ENGINE"
echo "======================================================================"

# 1. Check Python
if command -v python3 &>/dev/null; then
    PY_CMD="python3"
elif command -v python &>/dev/null; then
    PY_CMD="python"
else
    echo "[ERROR] Python 3.10+ is required but not found on PATH."
    exit 1
fi

# 2. Check Node & NPM
if ! command -v node &>/dev/null; then
    echo "[ERROR] Node.js is required but not found on PATH."
    exit 1
fi

if ! command -v npm &>/dev/null; then
    echo "[ERROR] npm is required but not found on PATH."
    exit 1
fi

# 3. Check FFmpeg
if ! command -v ffmpeg &>/dev/null; then
    echo "[WARNING] ffmpeg not found on PATH. Ingest and rendering require ffmpeg."
fi

# 4. Launch Studio
echo "Starting OpenShort servers with $PY_CMD..."
exec "$PY_CMD" run_studio.py
