@echo off
title OpenShort Launcher
echo ======================================================================
echo   OPENSHORT - AI SHORT-FORM VIDEO PRODUCTION ENGINE
echo ======================================================================

where py >nul 2>nul
if %errorlevel% neq 0 (
    where python >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python 3.10+ is required but not found in PATH.
        pause
        exit /b 1
    )
    set PY_CMD=python
) else (
    set PY_CMD=py -3
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js / npm is required but not found in PATH.
    pause
    exit /b 1
)

where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] FFmpeg not found in PATH. Ingest and rendering may fail without FFmpeg.
)

echo Starting OpenShort servers...
%PY_CMD% run_studio.py
pause
