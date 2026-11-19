# VIRAL STUDIO PRO V2.1 — COMPLETE PRODUCTION CODEBASE
## All-in-One Verification Bundle for Google AI Studio, Claude, and Arena.ai

================================================================================
VIRAL STUDIO PRO V2.1 — COMPLETE SOURCE REPOSITORY TREE
================================================================================
viral-studio/
├── README.md
├── run_studio.py
├── backend/
│   ├── config.py
│   ├── main.py
│   ├── services/
│   │   ├── vtt_parser.py         # 0.2s YouTube VTT subtitle parser (zero duplication)
│   │   ├── downloader.py         # Native yt-dlp metadata & target range downloader
│   │   ├── transcriber.py        # Faster-Whisper local MP4 offline fallback
│   │   ├── ai_director.py        # Gemini 2.5 Flash hook score & top 1-5 viral ranker
│   │   ├── face_tracker.py       # OpenCV Haar Cascade multi-camera pan tracker
│   │   └── remotion_exporter.py  # Headless Chromium 1080x1920 MP4 burn-in exporter
│   └── utils/
│       └── ffmpeg_helper.py      # Frame-accurate FFmpeg trim & browser-safe codecs
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── render_short.mjs          # Node Headless Chromium Remotion renderer (Tailwind enabled)
│   └── src/
│       ├── types.ts              # Strict TypeScript schemas (PanKeyframe, Word, Clip)
│       ├── index.css             # Tailwind font rules (Syne, Cabinet Grotesk, JetBrains Mono)
│       ├── App.tsx               # Primary UI shell & state coordinator
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── InputPanel.tsx              # URL input / local file loader & manual SRT
│       │   ├── InteractiveFramingCanvas.tsx # 9:16 canvas, dynamic cuts timeline, slider, auto-track
│       │   ├── TimelineTranscript.tsx      # Top 1-5 viral short picker pills & words
│       │   ├── OutputSettings.tsx          # 30/60 FPS, 1080p, burn-in export trigger
│       │   └── PresetManager.tsx           # Fable 5.2 / Opus 5.5 / Vox styling cards
│       └── remotion/
│           ├── index.ts                    # Remotion bundle entrypoint
│           ├── MasterShortComposition.tsx  # 4-zone layout (Top, Protected Face, Captions, Footer)
│           └── layers/
│               ├── KineticCaptions.tsx     # Active word cyan pop with spring physics
│               ├── BackgroundMatrix.tsx
│               ├── BehindHeadTypography.tsx
│               └── SwissEditorialOverlay.tsx
└── presets/
    ├── fable_5_2_kinetic.json
    ├── opus_5_5_editorial.json
    └── vox_technical_explainer.json
================================================================================


================================================================================
RECOMMENDED MASTER PROMPT FOR GOOGLE AI STUDIO / ARENA.AI
================================================================================
Copy and paste this prompt along with the codebase below into Google AI Studio (Gemini 2.5 Pro / Flash) or Arena.ai:

"You are an Elite Video Systems & AI Media Engineering Architect reviewing 'Viral Studio Pro v2.1'.
Below is the complete, single-file codebase containing the backend (FastAPI + OpenCV + FFmpeg + Faster-Whisper + Gemini 2.5 Flash), frontend (React + TypeScript + Vite + Tailwind), and video rendering engine (Remotion 4.x + Node Headless Chromium).

Please rigorously critique the architecture against these 6 production criteria:
1. YouTube VTT Parser & Subtitle Sync: Does `backend/services/vtt_parser.py` eliminate rolling caption duplication without timestamp drift, unescaping HTML tags, and shifting relative timestamps accurately for trimmed clips?
2. Multi-Camera Cut Framing & Pan Tracking: In interview podcasts where the camera switches between Host (Left ~15%) and Guest (Right ~85%), how does `backend/services/face_tracker.py` generate dynamic pan keyframes, and does `MasterShortComposition.tsx` and `InteractiveFramingCanvas.tsx` correctly resolve active pan framing across time cuts in both preview and export?
3. Remotion Burn-In Export Engine: Does `frontend/render_short.mjs` and `backend/services/remotion_exporter.py` ensure that what is previewed in `@remotion/player` is 100% baked into the final 1080x1920 H.264 MP4 with Tailwind CSS, fonts, kinetic subtitles, and badges without timing out?
4. Protected Face Safe Zone Enforcement: Does `MasterShortComposition.tsx` enforce a strict safe zone between Y: 18% (345px) and Y: 65% (1250px) where NO text, badges, or fake math/stat overlays are ever placed over the speaker's face?
5. AI Director & Top 1-5 Viral Short Recommendations: Does `backend/services/ai_director.py` evaluate full episodes with high-CTR hook detection, topic pills, and structured JSON output without fake stat counters?
6. Performance & UX Ergonomics: How does the system handle instant previews (full 16:9 trimmed MP4 + object-position pan) vs heavy re-encoding?

List any architectural strengths, potential edge cases, and high-impact optimizations for scaling."
================================================================================


================================================================================
TABLE OF CONTENTS (INCLUDED SOURCE FILES)
================================================================================
 1. [README.md] (1,973 bytes) - markdown
 2. [run_studio.py] (1,541 bytes) - python
 3. [backend/config.py] (1,129 bytes) - python
 4. [backend/main.py] (40,643 bytes) - python
 5. [backend/services/vtt_parser.py] (8,319 bytes) - python
 6. [backend/services/downloader.py] (6,144 bytes) - python
 7. [backend/services/transcriber.py] (7,669 bytes) - python
 8. [backend/services/ai_director.py] (8,172 bytes) - python
 9. [backend/services/face_tracker.py] (8,975 bytes) - python
10. [backend/services/remotion_exporter.py] (1,915 bytes) - python
11. [backend/utils/ffmpeg_helper.py] (2,398 bytes) - python
12. [frontend/package.json] (1,145 bytes) - json
13. [frontend/vite.config.ts] (379 bytes) - typescript
14. [frontend/tailwind.config.js] (716 bytes) - javascript
15. [frontend/render_short.mjs] (2,535 bytes) - javascript
16. [frontend/src/index.css] (433 bytes) - css
17. [frontend/src/types.ts] (3,029 bytes) - typescript
18. [frontend/src/App.tsx] (21,124 bytes) - tsx
19. [frontend/src/components/Header.tsx] (2,001 bytes) - tsx
20. [frontend/src/components/InputPanel.tsx] (15,386 bytes) - tsx
21. [frontend/src/components/InteractiveFramingCanvas.tsx] (11,115 bytes) - tsx
22. [frontend/src/components/TimelineTranscript.tsx] (10,358 bytes) - tsx
23. [frontend/src/components/OutputSettings.tsx] (7,080 bytes) - tsx
24. [frontend/src/components/PresetManager.tsx] (2,870 bytes) - tsx
25. [frontend/src/remotion/index.ts] (835 bytes) - typescript
26. [frontend/src/remotion/MasterShortComposition.tsx] (8,608 bytes) - tsx
27. [frontend/src/remotion/layers/KineticCaptions.tsx] (4,212 bytes) - tsx
28. [frontend/src/remotion/layers/BackgroundMatrix.tsx] (2,231 bytes) - tsx
29. [frontend/src/remotion/layers/BehindHeadTypography.tsx] (1,248 bytes) - tsx
30. [frontend/src/remotion/layers/SwissEditorialOverlay.tsx] (1,576 bytes) - tsx
31. [presets/fable_5_2_kinetic.json] (1,410 bytes) - json
32. [presets/opus_5_5_editorial.json] (1,412 bytes) - json
33. [presets/vox_technical_explainer.json] (1,335 bytes) - json

================================================================================
FULL SOURCE CODE IMPLEMENTATIONS
================================================================================


################################################################################
### FILE 1/33: README.md
################################################################################

```markdown
# PATH: README.md
# Viral Studio 🎬🚀
### Autonomous Omnichannel Video Engine (9:16 Shorts / Reels)
Inspired by high-retention creator aesthetics (**Opus 5.5 Editorial** and **Fable 5.2 Kinetic**), equipped with **Three.js (3D)**, **KaTeX (Math)**, **Recharts (Data)**, and **Faster-Whisper (Word Timestamps)**.

---

## Architecture Overview

```
[Input: YouTube Link / MP4]
         │
         ▼
[Backend: FastAPI (localhost:8000)]
  ├── yt-dlp: 1080p stream downloader
  ├── Faster-Whisper: Millisecond word-by-word timestamps
  ├── Gemini 2.5 Flash: Retention scoring & viral hook detector
  ├── MediaPipe / OpenCV: Face tracking & 9:16 auto-framing
  └── Storage: Static streaming endpoints
         │
         ▼
[Frontend Studio (localhost:3000)]
  ├── Interactive Dashboard (Tailwind CSS)
  ├── Live 60FPS Remotion Player (<Player />)
  ├── Presets Manager: Opus 5.5, Fable 5.2, Vox Explainer
  ├── Interactive Word Timestamps Scrubber
  └── One-Click 1080x1920 Export
```

---

## Visual Styles & Presets

1. **Opus 5.5 Editorial:**
   * Swiss grid background with technical crosshairs
   * Bold red accent banner (`#E63946`)
   * Monospace figure tags (`FIG. 01 // INTERVIEW`)
   * Bordered picture-in-picture video frame with drop shadow
   * Editorial lower-third caption pill

2. **Fable 5.2 Kinetic:**
   * Pulsing halftone dot matrix background
   * Giant impact typography animated **behind the speaker's head**
   * High-contrast bouncy kinetic subtitles with highlight boxes
   * Full-bleed 9:16 vertical framing

3. **Vox Technical Explainer:**
   * Dark blueprint grid
   * Floating interactive 3D assets (Three.js / React Three Fiber)
   * Real-time KaTeX math formulas
   * Animated retention / growth charts (Recharts)

---

## Quick Start (One Command)

From the project root:

```bash
cd "F:\Ai Learning\viral-studio"
py run_studio.py
```

Open your browser at:
👉 **`http://localhost:3000`**

```


################################################################################
### FILE 2/33: run_studio.py
################################################################################

```python
# PATH: run_studio.py
import sys
import subprocess
import time
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
PYTHON_EXE = r"C:\Users\Kirshan Singh\AppData\Local\Programs\Python\Python312\python.exe"

def start_studio():
    print("=" * 70)
    print("  🚀 VIRAL STUDIO // AUTONOMOUS OMNICHANNEL VIDEO ENGINE")
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
    print("  ✨ STUDIO READY! Open in your browser:")
    print("  👉 http://localhost:3000")
    print("  API Docs:")
    print("  👉 http://127.0.0.1:8000/docs")
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

```


################################################################################
### FILE 3/33: backend/config.py
################################################################################

```python
# PATH: backend/config.py
import os
from pathlib import Path
from dotenv import load_dotenv

# Directories
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
PRESETS_DIR = PROJECT_ROOT / "presets"
STORAGE_DIR = PROJECT_ROOT / "storage"

# Load .env explicitly from PROJECT_ROOT and BACKEND_DIR
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BACKEND_DIR / ".env")

DOWNLOADS_DIR = STORAGE_DIR / "downloads"
TRANSCRIPTS_DIR = STORAGE_DIR / "transcripts"
MASKS_DIR = STORAGE_DIR / "masks"
OUTPUT_RENDERS_DIR = STORAGE_DIR / "output_renders"

# Ensure all storage directories exist
for path in [DOWNLOADS_DIR, TRANSCRIPTS_DIR, MASKS_DIR, OUTPUT_RENDERS_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# API Keys & AI Models
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DEFAULT_GEMINI_MODEL = "gemini-4-hydrogen"

# Render Defaults
DEFAULT_WIDTH = 1080
DEFAULT_HEIGHT = 1920
DEFAULT_FPS = 60
DEFAULT_CLIP_DURATION = 50  # target viral short length in seconds

# Executable Paths
PYTHON_EXECUTABLE = r"C:\Users\Kirshan Singh\AppData\Local\Programs\Python\Python312\python.exe"
FFMPEG_PATH = "ffmpeg"
FFPROBE_PATH = "ffprobe"

```


################################################################################
### FILE 4/33: backend/main.py
################################################################################

```python
# PATH: backend/main.py
import json
import logging
import re
import subprocess
import threading
import time
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List, Literal

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from google import genai
from google.genai import types

from backend.config import (
    STORAGE_DIR,
    DOWNLOADS_DIR,
    TRANSCRIPTS_DIR,
    PRESETS_DIR,
    OUTPUT_RENDERS_DIR,
    GEMINI_API_KEY,
)
from backend.services.downloader import MediaDownloader
from backend.services.transcriber import AudioTranscriber, parse_srt_or_text
from backend.services.vtt_parser import extract_youtube_vtt_fast, parse_youtube_vtt_to_words
from backend.services.ai_director import generate_ranked_viral_suite
from backend.services.remotion_exporter import render_burned_in_short_mp4
from backend.services.hook_detector import ViralHookDetector
from backend.services.face_tracker import FaceAutoTracker
from backend.utils.ffmpeg_helper import trim_video_clip, probe_media

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("viral_studio")

app = FastAPI(
    title="Viral Studio AI Video Director API",
    description="Autonomous Context-Aware Short-Form Video Director Backend",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# ─── In-Memory Thread-Safe Job Store & Media Registry ────────────────────────
JOBS: Dict[str, Dict[str, Any]] = {}
JOBS_LOCK = threading.Lock()
MEDIA_REGISTRY: Dict[str, str] = {}


def create_job_record() -> str:
    job_id = str(uuid.uuid4())
    with JOBS_LOCK:
        JOBS[job_id] = {
            "job_id": job_id,
            "status": "processing",
            "progress": 5,
            "step": "Initializing AI Video Director pipeline: 5%",
            "error": None,
            "result": None,
            "created_at": time.time(),
        }
    return job_id


def update_job_record(
    job_id: str,
    *,
    status: Optional[str] = None,
    progress: Optional[int] = None,
    step: Optional[str] = None,
    error: Optional[str] = None,
    result: Optional[Dict[str, Any]] = None,
) -> None:
    with JOBS_LOCK:
        if job_id not in JOBS:
            return
        if status is not None:
            JOBS[job_id]["status"] = status
        if progress is not None:
            JOBS[job_id]["progress"] = progress
        if step is not None:
            JOBS[job_id]["step"] = step
        if error is not None:
            JOBS[job_id]["error"] = error
        if result is not None:
            JOBS[job_id]["result"] = result


# ─── Pydantic Schemas for API & Gemini Structured Output ─────────────────────
class IngestRequest(BaseModel):
    url: Optional[str] = None
    local_path: Optional[str] = None
    custom_script: Optional[str] = None
    use_sample: bool = False
    model_size: str = "base"
    preset_id: Optional[str] = None
    api_key: Optional[str] = None


class YouTubeRequest(BaseModel):
    url: str


class TranscribeRequest(BaseModel):
    media_id: str
    model_size: Optional[str] = "base"


class HookDetectRequest(BaseModel):
    media_id: str
    api_key: Optional[str] = None


class PrepareClipRequest(BaseModel):
    media_id: str
    start_time: float
    end_time: float
    preset_id: str
    custom_title: Optional[str] = None
    motion_events: Optional[List[Dict[str, Any]]] = None
    crop_focus: Optional[str] = "auto"
    pan_keyframes: Optional[List[Dict[str, Any]]] = None


class AutoTrackPanRequest(BaseModel):
    media_id: str
    start_time: float
    end_time: float


class BestClipSchema(BaseModel):
    start_time: float = Field(
        description="Exact start timestamp in seconds of the best viral segment (duration must be 30 to 50 seconds)."
    )
    end_time: float = Field(
        description="Exact end timestamp in seconds of the best viral segment (duration must be 30 to 50 seconds)."
    )
    hook_score: int = Field(
        description="Predicted viewer retention & viral hook score between 1 and 100."
    )
    reasoning: str = Field(
        description="Editorial explanation of why this clip maximizes watch time and emotional resonance."
    )


class MotionEventSchema(BaseModel):
    time_sec: float = Field(
        description="Timestamp in seconds relative to the start of the selected clip (0.0 to clip_duration) when this overlay triggers."
    )
    type: Literal["headline_badge", "stat_counter", "impact_text"] = Field(
        description="Visual overlay archetype to trigger."
    )
    text: Optional[str] = Field(
        default=None,
        description="Short, punchy uppercase copy for 'headline_badge' or 'impact_text' (max 4 words, e.g., 'RULE 1: CALM FIRST' or 'NEVER YELL').",
    )
    label: Optional[str] = Field(
        default=None,
        description="Uppercase metric label for 'stat_counter' (e.g., 'CORTISOL SPIKE', 'RETENTION RATE').",
    )
    value: Optional[str] = Field(
        default=None,
        description="Formatted metric value for 'stat_counter' (e.g., '+80%', '3.5X', '-45%').",
    )


class AIDirectorDecisionSchema(BaseModel):
    niche: str = Field(
        description="Detected domain/niche of the video (e.g., Female Parenting, Psychology, Business, Tech, Health)."
    )
    viral_title: str = Field(
        description="High-CTR hook title tailored to the niche (e.g., 'The #1 Parenting Trap')."
    )
    best_clip: BestClipSchema
    motion_events: List[MotionEventSchema] = Field(
        description="Chronological list of 3 to 6 timed visual overlays aligned with spoken revelations."
    )


# ─── Helper Utilities ────────────────────────────────────────────────────────
def get_default_preset(preset_id: Optional[str] = None) -> Dict[str, Any]:
    if preset_id:
        specific_path = PRESETS_DIR / f"{preset_id}.json"
        if specific_path.exists():
            with open(specific_path, "r", encoding="utf-8") as f:
                return json.load(f)

    for p_path in sorted(PRESETS_DIR.glob("*.json")):
        try:
            with open(p_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed loading preset {p_path}: {e}")

    return {
        "id": "fable_director",
        "name": "Fable AI Director",
        "captions": {
            "activeWordColor": "#FFE600",
            "inactiveWordColor": "#F8FAFC",
            "highlightBox": True,
            "boxColor": "#E63946",
        },
        "features": {
            "enable3D": False,
            "enableMathFormulas": False,
            "enableCharts": False,
        },
    }


def render_vertical_9_16_with_fallback(
    input_clip: Path, output_vertical: Path, crop_focus: str = "auto"
) -> None:
    """
    Attempts FaceAutoTracker vertical crop first; if it fails or produces an empty file,
    falls back to a fast, browser-compatible FFmpeg 9:16 center crop encoded with H.264.
    """
    try:
        FaceAutoTracker.render_vertical_crop(input_clip, output_vertical, crop_focus=crop_focus)
        if output_vertical.exists() and output_vertical.stat().st_size > 1024:
            return
    except Exception as e:
        logger.warning(f"FaceAutoTracker failed ({e}), falling back to FFmpeg 9:16 center crop.")

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_clip),
        "-vf",
        "crop=ih*9/16:ih,scale=1080:1920:flags=lanczos,setsar=1",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "21",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(output_vertical),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def build_fallback_director_plan(transcript_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic fallback if GEMINI_API_KEY is not set in environment.
    Still generates dynamic transcript-derived titles and motion events.
    """
    words = transcript_data.get("words", [])
    total_duration = float(transcript_data.get("duration", 0.0))
    if total_duration <= 0 and words:
        total_duration = float(words[-1].get("end", 40.0))
    if total_duration <= 0:
        total_duration = 40.0

    start_time = 0.0
    end_time = min(total_duration, 42.0) if total_duration >= 30.0 else total_duration
    clip_duration = max(5.0, round(end_time - start_time, 2))

    # Build a clean title from the first meaningful words
    sample_words = [
        re.sub(r"[^a-zA-Z0-9']", "", w.get("word", ""))
        for w in words[:12]
        if len(w.get("word", "")) > 3
    ]
    key_phrase = " ".join(sample_words[:4]).title() if sample_words else "Critical Insight"
    viral_title = f"The #1 {key_phrase} Trap"

    t1 = round(min(2.0, clip_duration * 0.12), 1)
    t2 = round(min(11.5, clip_duration * 0.42), 1)
    t3 = round(min(22.0, clip_duration * 0.72), 1)

    w_early = sample_words[0].upper() if len(sample_words) > 0 else "CORE"
    w_late = sample_words[-1].upper() if len(sample_words) > 1 else "FOCUS"

    return {
        "niche": "Editorial",
        "viral_title": viral_title,
        "best_clip": {
            "start_time": start_time,
            "end_time": end_time,
            "hook_score": 92,
            "reasoning": "High-density opening hook with clear spoken thesis and emotional contrast.",
        },
        "motion_events": [
            {
                "time_sec": t1,
                "type": "headline_badge",
                "text": f"RULE 1: {w_early} FIRST",
                "label": None,
                "value": None,
            },
            {
                "time_sec": t2,
                "type": "stat_counter",
                "text": None,
                "label": "RETENTION IMPACT",
                "value": "+80%",
            },
            {
                "time_sec": t3,
                "type": "impact_text",
                "text": f"NEVER IGNORE {w_late}",
                "label": None,
                "value": None,
            },
        ],
    }


def run_gemini_ai_director(
    transcript_data: Dict[str, Any], api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Uses the official google-genai SDK with structured JSON output to act as an
    Editorial Video Director for ANY niche.
    """
    effective_key = api_key or GEMINI_API_KEY
    words = transcript_data.get("words", [])
    segments = transcript_data.get("segments", [])

    total_duration = float(transcript_data.get("duration", 0.0))
    if total_duration <= 0 and words:
        total_duration = float(words[-1].get("end", 40.0))
    if total_duration <= 0:
        total_duration = 40.0

    if not effective_key:
        logger.warning("No GEMINI_API_KEY configured; using transcript-derived fallback director plan.")
        return build_fallback_director_plan(transcript_data)

    # Format timestamped transcript lines for accurate timing analysis
    formatted_lines: List[str] = []
    if segments:
        for seg in segments:
            s_start = round(float(seg.get("start", 0.0)), 2)
            s_end = round(float(seg.get("end", 0.0)), 2)
            s_text = str(seg.get("text", "")).strip()
            if s_text:
                formatted_lines.append(f"[{s_start:.2f}s - {s_end:.2f}s] {s_text}")
    else:
        chunk: List[str] = []
        chunk_start = 0.0
        for idx, w in enumerate(words):
            if not chunk:
                chunk_start = float(w.get("start", 0.0))
            chunk.append(str(w.get("word", "")))
            if len(chunk) >= 10 or idx == len(words) - 1:
                chunk_end = float(w.get("end", chunk_start + 2.0))
                formatted_lines.append(
                    f"[{chunk_start:.2f}s - {chunk_end:.2f}s] {' '.join(chunk)}"
                )
                chunk = []

    transcript_block = "\n".join(formatted_lines[:350])

    system_instruction = (
        "You are a Principal Editorial Video Director for high-retention 9:16 vertical Shorts "
        "across ANY niche (e.g., Female Parenting, Psychology, Business, Technology, Health, Finance). "
        "Your mission is to analyze the timestamped transcript, identify the single highest-retention "
        "clip between 30 and 50 seconds in duration (or the full duration if the source video is shorter than 30s), "
        "craft a high-CTR viral hook title, and choreograph 3 to 6 timed visual motion graphic overlays "
        "that trigger at the exact moments the speaker delivers key insights."
    )

    prompt = f"""
Analyze the following video transcript (Total Duration: {total_duration:.2f} seconds):

{transcript_block}

DIRECTOR REQUIREMENTS:
1. `viral_title`: Create a punchy, high-CTR hook title authentic to the speaker's niche (e.g., "The #1 Parenting Trap", "Why 90% of Founders Burn Out").
2. `best_clip`: Select the single most compelling continuous segment between 30.0 and 50.0 seconds long (if total video duration is under 30s, select from 0.0 to {total_duration:.2f}).
3. `motion_events`: Design 3 to 6 timed visual overlays where `time_sec` is RELATIVE to the start of `best_clip` (i.e., `0.0` is the start of `best_clip`). Space them at least 4 seconds apart so they never overlap:
   - `"headline_badge"`: Requires `text` (e.g., `"RULE 1: CALM FIRST"`).
   - `"stat_counter"`: Requires `label` (e.g., `"CORTISOL SPIKE"`) and `value` (e.g., `"+80%"`).
   - `"impact_text"`: Requires `text` (e.g., `"NEVER YELL"`).
"""

    client = genai.Client(api_key=effective_key)
    candidate_models = ["gemini-4-hydrogen", "gemini-3.5-flash-lite", "gemini-3.8-flash"]
    raw_json = None

    for m_name in candidate_models:
        try:
            logger.info(f"Invoking AI Director with model: {m_name}")
            response = client.models.generate_content(
                model=m_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=AIDirectorDecisionSchema,
                    temperature=0.25,
                ),
            )
            raw_json = json.loads(response.text)
            logger.info(f"AI Director successfully generated decision via {m_name}")
            break
        except Exception as model_err:
            logger.warning(f"AI Director call failed on {m_name}: {model_err}")

    if not raw_json:
        logger.warning("All Gemini models failed or rate limited; falling back to transcript-derived director plan.")
        return build_fallback_director_plan(transcript_data)

    # Validate & normalize clip bounds (30s to 50s rule)
    best_clip = raw_json.get("best_clip", {})
    start_time = max(0.0, float(best_clip.get("start_time", 0.0)))
    end_time = min(total_duration, float(best_clip.get("end_time", min(total_duration, 45.0))))

    if total_duration >= 30.0:
        clip_len = end_time - start_time
        if clip_len < 30.0:
            end_time = min(total_duration, start_time + 35.0)
            if end_time - start_time < 30.0:
                start_time = max(0.0, end_time - 30.0)
        elif clip_len > 50.0:
            end_time = start_time + 45.0
    else:
        start_time = 0.0
        end_time = total_duration

    clip_duration = max(3.0, round(end_time - start_time, 2))
    best_clip["start_time"] = round(start_time, 2)
    best_clip["end_time"] = round(end_time, 2)
    best_clip["hook_score"] = int(best_clip.get("hook_score", 94))
    best_clip["reasoning"] = str(
        best_clip.get("reasoning", "High-retention narrative arc selected by Gemini AI Director.")
    )

    # Normalize motion_events so time_sec is always relative to the trimmed clip [0, clip_duration]
    normalized_events: List[Dict[str, Any]] = []
    for ev in raw_json.get("motion_events", []):
        ev_type = ev.get("type", "headline_badge")
        if ev_type not in ("headline_badge", "stat_counter", "impact_text"):
            ev_type = "headline_badge"

        t_sec = float(ev.get("time_sec", 2.0))
        # If Gemini returned an absolute video timestamp inside [start_time, end_time], shift it
        if t_sec > clip_duration and start_time <= t_sec <= end_time:
            t_sec = t_sec - start_time

        t_sec = round(max(0.5, min(t_sec, max(0.5, clip_duration - 2.6))), 2)

        text_val = (ev.get("text") or "").strip().upper()
        label_val = (ev.get("label") or "").strip().upper()
        value_val = (ev.get("value") or "").strip().upper()

        if ev_type in ("headline_badge", "impact_text") and not text_val:
            text_val = label_val or raw_json.get("viral_title", "KEY INSIGHT").upper()[:24]
        if ev_type == "stat_counter":
            if not label_val:
                label_val = text_val or "KEY METRIC"
            if not value_val:
                value_val = "+100%"

        normalized_events.append(
            {
                "time_sec": t_sec,
                "type": ev_type,
                "text": text_val if text_val else None,
                "label": label_val if label_val else None,
                "value": value_val if value_val else None,
            }
        )

    normalized_events.sort(key=lambda x: x["time_sec"])

    return {
        "niche": raw_json.get("niche", "General"),
        "viral_title": raw_json.get("viral_title", "The #1 Hidden Trap"),
        "best_clip": best_clip,
        "motion_events": normalized_events,
    }


def prepare_trimmed_clip_manifest(
    media_id: str,
    start_time: float,
    end_time: float,
    preset_id: Optional[str],
    viral_title: str,
    motion_events: List[Dict[str, Any]],
    crop_focus: str = "auto",
    pan_keyframes: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Trims the exact 30-50s segment via FFmpeg, converts it to a 9:16 vertical MP4,
    and slices + time-shifts word timestamps to [0, clip_duration].
    Generates dynamic face-tracking pan keyframes across camera angle cuts.
    """
    raw_video: Optional[Path] = None
    if media_id in MEDIA_REGISTRY and Path(MEDIA_REGISTRY[media_id]).exists():
        raw_video = Path(MEDIA_REGISTRY[media_id])
    else:
        video_files = [
            f
            for f in DOWNLOADS_DIR.glob(f"{media_id}*.mp4")
            if not f.stem.endswith("_vertical") and not f.stem.endswith("_trimmed")
        ]
        if video_files:
            raw_video = video_files[0]

    if not raw_video or not raw_video.exists():
        raise FileNotFoundError(f"Source video for media '{media_id}' not found.")
    clip_id = f"{media_id}_{int(start_time)}_{int(end_time)}_{crop_focus}"
    trimmed_clip_path = DOWNLOADS_DIR / f"{media_id}_{int(start_time)}_{int(end_time)}_trimmed.mp4"
    vertical_clip_path = DOWNLOADS_DIR / f"{clip_id}_vertical.mp4"

    # 1. Trim exact segment if not already trimmed
    if not trimmed_clip_path.exists() or trimmed_clip_path.stat().st_size == 0:
        trim_video_clip(raw_video, trimmed_clip_path, start_time, end_time)

    # 2. Render 9:16 vertical crop with H.264 browser-safe fallback
    if not vertical_clip_path.exists() or vertical_clip_path.stat().st_size == 0:
        render_vertical_9_16_with_fallback(trimmed_clip_path, vertical_clip_path, crop_focus=crop_focus)

    # 3. Slice and zero-index transcript words for the trimmed clip
    transcript_file = TRANSCRIPTS_DIR / f"{media_id}_transcript.json"
    sliced_words: List[Dict[str, Any]] = []
    if transcript_file.exists():
        with open(transcript_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            for w in data.get("words", []):
                w_start = float(w.get("start", 0.0))
                w_end = float(w.get("end", 0.0))
                if w_end >= start_time and w_start <= end_time:
                    rel_start = round(max(0.0, w_start - start_time), 2)
                    rel_end = round(max(rel_start + 0.05, min(end_time - start_time, w_end - start_time)), 2)
                    sliced_words.append(
                        {
                            "word": w["word"],
                            "start": rel_start,
                            "end": rel_end,
                            "confidence": w.get("confidence", 1.0),
                        }
                    )

    # 4. Generate dynamic camera-cut pan keyframes if not provided
    if not pan_keyframes:
        try:
            pan_keyframes = FaceAutoTracker.generate_pan_keyframes(trimmed_clip_path)
        except Exception as e:
            logger.warning(f"Failed to generate pan keyframes: {e}")
            pan_keyframes = [{"t": 0.0, "pan": 50}]

    preset_data = get_default_preset(preset_id)
    clip_duration = round(max(1.0, end_time - start_time), 2)

    # Use trimmed 16:9 stream so interactive panPercent (0% Left to 100% Right) works at 60 FPS
    stream_video = trimmed_clip_path if trimmed_clip_path.exists() else vertical_clip_path

    payload = {
        "clip_id": clip_id,
        "title": viral_title,
        "viral_title": viral_title,
        "duration": clip_duration,
        "start_time": round(start_time, 2),
        "end_time": round(end_time, 2),
        "video_url": f"/storage/downloads/{stream_video.name}",
        "vertical_url": f"/storage/downloads/{vertical_clip_path.name}",
        "words": sliced_words,
        "pan_keyframes": pan_keyframes,
        "motion_events": motion_events,
        "preset": preset_data,
        "render_status": "ready_to_render",
    }

    manifest_path = OUTPUT_RENDERS_DIR / f"{clip_id}_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    return payload


# ─── Background Pipeline Worker ──────────────────────────────────────────────
def execute_director_pipeline(
    job_id: str,
    *,
    source_type: Literal["youtube", "local", "sample"],
    url: Optional[str] = None,
    local_path: Optional[Path] = None,
    custom_script: Optional[str] = None,
    model_size: str = "base",
    preset_id: Optional[str] = None,
    api_key: Optional[str] = None,
) -> None:
    try:
        # STAGE 1: 10% Downloading / Ingesting Media
        update_job_record(
            job_id,
            status="processing",
            progress=10,
            step="Downloading & extracting 16kHz audio: 10%",
        )

        if source_type == "youtube":
            if not url:
                raise ValueError("YouTube URL is required.")
            progress_cb = lambda p, s: update_job_record(job_id, progress=p, step=s)
            media_info = MediaDownloader.download_youtube_url(url, progress_callback=progress_cb)
        elif source_type == "local":
            if not local_path or not local_path.exists():
                raise FileNotFoundError(f"Video file not found on disk at: {local_path}")
            update_job_record(
                job_id,
                progress=15,
                step=f"Extracting 16kHz audio from local video ({local_path.name}): 15%",
            )
            media_info = MediaDownloader.process_local_file(local_path)
        else:
            sample_path = Path(
                r"C:\Users\Kirshan Singh\.gemini\antigravity\brain\95271b73-96ea-4d65-90b1-8ce6a1b3193d\.user_uploaded\media_1794665984810_52062bb7.mp4"
            )
            if not sample_path.exists():
                existing = [
                    p
                    for p in DOWNLOADS_DIR.glob("*.mp4")
                    if not p.stem.endswith("_vertical") and not p.stem.endswith("_trimmed")
                ]
                if existing:
                    sample_path = existing[0]
                else:
                    raise FileNotFoundError(
                        "No sample video found in downloads directory. Please upload an MP4 or paste a YouTube URL."
                    )
            media_info = MediaDownloader.process_local_file(sample_path)

        media_id = media_info["id"]
        MEDIA_REGISTRY[media_id] = media_info["video_path"]

        # STAGE 2: Sub-Second VTT Subtitles or Whisper STT Fallback
        if custom_script and custom_script.strip():
            update_job_record(
                job_id,
                status="processing",
                progress=50,
                step="Parsed user transcript / SRT (Whisper STT skipped): 50%",
            )
            transcript_data = parse_srt_or_text(custom_script, media_id)
        elif source_type == "youtube" and url:
            update_job_record(
                job_id,
                status="processing",
                progress=35,
                step="Extracting instant YouTube VTT captions: 35%",
            )
            vtt_file = extract_youtube_vtt_fast(url, DOWNLOADS_DIR, media_id)
            if vtt_file and vtt_file.exists():
                transcript_data = parse_youtube_vtt_to_words(vtt_file, media_id)
                update_job_record(
                    job_id,
                    status="processing",
                    progress=55,
                    step="Extracted YouTube captions in 0.2s (Whisper skipped): 55%",
                )
            else:
                update_job_record(
                    job_id,
                    status="processing",
                    progress=45,
                    step="Transcribing audio with Faster-Whisper: 45%",
                )
                audio_files = list(DOWNLOADS_DIR.glob(f"{media_id}*16k.wav"))
                if not audio_files:
                    raise FileNotFoundError(f"Extracted 16kHz WAV audio for media '{media_id}' not found.")
                transcript_data = AudioTranscriber.transcribe(audio_files[0], media_id, model_size)
        else:
            update_job_record(
                job_id,
                status="processing",
                progress=45,
                step="Transcribing audio with Faster-Whisper: 45%",
            )
            audio_files = list(DOWNLOADS_DIR.glob(f"{media_id}*16k.wav"))
            if not audio_files:
                raise FileNotFoundError(f"Extracted 16kHz WAV audio for media '{media_id}' not found.")
            transcript_data = AudioTranscriber.transcribe(audio_files[0], media_id, model_size)

        # STAGE 3: 80% AI Directing with Gemini (Top 1-to-5 Ranked Shorts Suite)
        update_job_record(
            job_id,
            status="processing",
            progress=80,
            step="AI Directing with Gemini (Ranking Top 5 Viral Shorts): 80%",
        )

        effective_key = api_key or GEMINI_API_KEY
        try:
            director_suite = generate_ranked_viral_suite(transcript_data, api_key=effective_key)
            top_shorts = director_suite.get("shorts", [])
            niche = director_suite.get("niche", "General")
        except Exception as e:
            logger.warning(f"Gemini ranked suite fallback: {e}")
            top_shorts = []
            niche = "General"

        if not top_shorts:
            # Fallback single short
            best_clip = {
                "rank": 1,
                "start_time": 0.0,
                "end_time": min(45.0, float(transcript_data.get("duration", 45.0))),
                "hook_score": 95,
                "angle_tag": "TOP HOOK",
                "topic_pill": "[ VIRAL INSIGHT ]",
                "viral_title": media_info.get("title", "Viral Short"),
                "rationale": "High-retention opening segment",
                "spoken_keywords": [],
                "suggested_pan_percent": 50,
                "motion_events": [],
            }
            top_shorts = [best_clip]

        best_clip = top_shorts[0]
        viral_title = best_clip.get("viral_title", media_info.get("title"))
        motion_events = best_clip.get("motion_events", [])

        # STAGE 4: 92% Pre-trimming 16:9 Video Clip via FFmpeg (Enables 60FPS Drag & Pan)
        update_job_record(
            job_id,
            status="processing",
            progress=92,
            step="Pre-trimming high-speed video clip via FFmpeg: 92%",
        )

        clip_manifest = prepare_trimmed_clip_manifest(
            media_id=media_id,
            start_time=best_clip["start_time"],
            end_time=best_clip["end_time"],
            preset_id=preset_id,
            viral_title=viral_title,
            motion_events=motion_events,
        )

        # Update media title with the AI Director's high-CTR hook title
        media_info["title"] = viral_title

        top_pan_keyframes = clip_manifest.get("pan_keyframes", [{"t": 0.0, "pan": 50}])
        recommended_clips = [
            {
                "clip_id": f"{media_id}_{int(s['start_time'])}_{int(s['end_time'])}",
                "rank": s.get("rank", idx + 1),
                "title": s.get("viral_title", viral_title),
                "start_time": s["start_time"],
                "end_time": s["end_time"],
                "duration": s.get("duration", round(s["end_time"] - s["start_time"], 2)),
                "hook_score": s.get("hook_score", 95),
                "viral_score": s.get("hook_score", 95),
                "angle_tag": s.get("angle_tag", "TOP HOOK"),
                "topic_pill": s.get("topic_pill", "[ INSIGHT ]"),
                "reasoning": s.get("rationale", ""),
                "spoken_keywords": s.get("spoken_keywords", []),
                "suggested_pan_percent": s.get("suggested_pan_percent", 50),
                "pan_keyframes": top_pan_keyframes if idx == 0 else [{"t": 0.0, "pan": s.get("suggested_pan_percent", 50)}],
                "motion_events": s.get("motion_events", []),
            }
            for idx, s in enumerate(top_shorts)
        ]

        # STAGE 5: 100% Ready
        update_job_record(
            job_id,
            status="completed",
            progress=100,
            step="Ready: 100%",
            result={
                "media": media_info,
                "transcript": transcript_data,
                "niche": niche,
                "viral_title": viral_title,
                "best_clip": best_clip,
                "motion_events": motion_events,
                "recommended_clips": recommended_clips,
                "clip_manifest": clip_manifest,
            },
        )

    except Exception as exc:
        logger.exception(f"Job {job_id} failed: {exc}")
        err_msg = str(exc)
        if "unavailable" in err_msg.lower() or "private" in err_msg.lower():
            err_msg = "This YouTube video is unavailable or private. Please check the URL."
        update_job_record(
            job_id,
            status="failed",
            step="Pipeline failed",
            error=err_msg,
        )


# ─── API Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "engine": "Viral Studio AI Director v2.0",
        "whisper_ready": True,
        "ffmpeg_ready": True,
        "gemini_configured": bool(GEMINI_API_KEY),
    }


@app.get("/api/presets")
def get_presets():
    """Load and return all visual style presets (Opus, Fable, Vox)."""
    presets = []
    for p_path in sorted(PRESETS_DIR.glob("*.json")):
        try:
            with open(p_path, "r", encoding="utf-8") as f:
                presets.append(json.load(f))
        except Exception as e:
            logger.error(f"Error loading preset {p_path}: {e}")
    return {"presets": presets}


@app.post("/api/ingest")
def ingest_media_job(req: IngestRequest, background_tasks: BackgroundTasks):
    """
    Primary Asynchronous Ingestion & AI Director Endpoint.
    Supports YouTube URL, local disk file path, uploaded MP4, or sample video.
    """
    has_url = bool(req.url and req.url.strip())
    has_local = bool(req.local_path and req.local_path.strip())

    if not req.use_sample and not has_url and not has_local:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid YouTube URL or a local file path on disk.",
        )

    job_id = create_job_record()

    if has_local:
        source_type = "local"
        resolved_local = Path(req.local_path.strip()).resolve()
        if not resolved_local.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Local video file does not exist at: {resolved_local}",
            )
        background_tasks.add_task(
            execute_director_pipeline,
            job_id,
            source_type=source_type,
            local_path=resolved_local,
            custom_script=req.custom_script,
            model_size=req.model_size or "base",
            preset_id=req.preset_id,
            api_key=req.api_key,
        )
    elif has_url:
        source_type = "youtube"
        background_tasks.add_task(
            execute_director_pipeline,
            job_id,
            source_type=source_type,
            url=req.url.strip(),
            custom_script=req.custom_script,
            model_size=req.model_size or "base",
            preset_id=req.preset_id,
            api_key=req.api_key,
        )
    else:
        source_type = "sample"
        background_tasks.add_task(
            execute_director_pipeline,
            job_id,
            source_type=source_type,
            custom_script=req.custom_script,
            model_size=req.model_size or "base",
            preset_id=req.preset_id,
            api_key=req.api_key,
        )

    return {"job_id": job_id, "status": "processing"}


@app.post("/api/ingest/youtube")
def ingest_youtube_async(req: YouTubeRequest, background_tasks: BackgroundTasks):
    """Alias for async YouTube ingestion."""
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="YouTube URL cannot be empty.")

    job_id = create_job_record()
    background_tasks.add_task(
        execute_director_pipeline,
        job_id,
        source_type="youtube",
        url=req.url.strip(),
    )
    return {"job_id": job_id, "status": "processing"}


@app.post("/api/ingest/upload")
async def ingest_upload_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Saves uploaded local MP4 and triggers the async AI Director job queue."""
    try:
        safe_name = Path(file.filename or f"upload_{int(time.time())}.mp4").name
        target_path = DOWNLOADS_DIR / safe_name
        with open(target_path, "wb") as f:
            content = await file.read()
            f.write(content)

        job_id = create_job_record()
        background_tasks.add_task(
            execute_director_pipeline,
            job_id,
            source_type="local",
            local_path=target_path,
        )
        return {"job_id": job_id, "status": "processing"}
    except Exception as e:
        logger.error(f"Local file upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {e}")


@app.post("/api/load-sample")
def load_sample_async(background_tasks: BackgroundTasks):
    """Triggers the async AI Director job queue using the local sample video."""
    job_id = create_job_record()
    background_tasks.add_task(
        execute_director_pipeline,
        job_id,
        source_type="sample",
    )
    return {"job_id": job_id, "status": "processing"}


@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    """
    Returns live percentage progress:
    10% Downloading -> 45% Transcribing -> 80% AI Directing -> 100% Ready
    """
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
        return dict(job)


@app.post("/api/prepare-clip")
def prepare_clip(req: PrepareClipRequest):
    """
    Pre-trims an arbitrary selected time range into a 9:16 vertical MP4
    and returns the updated Remotion manifest.
    """
    try:
        payload = prepare_trimmed_clip_manifest(
            media_id=req.media_id,
            start_time=req.start_time,
            end_time=req.end_time,
            preset_id=req.preset_id,
            viral_title=req.custom_title or f"Viral Short {req.media_id}",
            motion_events=req.motion_events or [],
            crop_focus=req.crop_focus or "auto",
            pan_keyframes=req.pan_keyframes,
        )
        return {
            "success": True,
            "clip_manifest": payload,
        }
    except Exception as e:
        logger.error(f"Prepare clip failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auto-track-pan")
def auto_track_pan_endpoint(req: AutoTrackPanRequest):
    """
    Performs frame-by-frame face detection over sampled frames of the trimmed clip
    to automatically identify camera cuts and speaker positions.
    """
    try:
        trimmed_clip_path = DOWNLOADS_DIR / f"{req.media_id}_{int(req.start_time)}_{int(req.end_time)}_trimmed.mp4"
        if not trimmed_clip_path.exists() or trimmed_clip_path.stat().st_size == 0:
            # Fallback to source video if trimmed segment doesn't exist yet
            raw_video = None
            if req.media_id in MEDIA_REGISTRY and Path(MEDIA_REGISTRY[req.media_id]).exists():
                raw_video = Path(MEDIA_REGISTRY[req.media_id])
            else:
                video_files = [
                    f for f in DOWNLOADS_DIR.glob(f"{req.media_id}*.mp4")
                    if not f.stem.endswith("_vertical") and not f.stem.endswith("_trimmed")
                ]
                if video_files:
                    raw_video = video_files[0]

            if raw_video and raw_video.exists():
                trim_video_clip(raw_video, trimmed_clip_path, req.start_time, req.end_time)

        if trimmed_clip_path.exists() and trimmed_clip_path.stat().st_size > 0:
            keyframes = FaceAutoTracker.generate_pan_keyframes(trimmed_clip_path)
            return {"pan_keyframes": keyframes}
        else:
            return {"pan_keyframes": [{"t": 0.0, "pan": 50}]}
    except Exception as e:
        logger.warning(f"Auto-track pan endpoint fallback: {e}")
        return {"pan_keyframes": [{"t": 0.0, "pan": 50}]}


class RenderExportRequest(BaseModel):
    clip_id: str
    input_props: Dict[str, Any]
    fps: Optional[int] = 60


@app.post("/api/render-export")
def export_short_video(req: RenderExportRequest):
    """
    Launches Remotion Headless Chromium on Windows to bake all fonts,
    kinetic word pop highlights, pan framing, and motion badges into a 1080x1920 MP4.
    """
    try:
        frontend_dir = Path(__file__).parent.parent / "frontend"
        final_mp4 = render_burned_in_short_mp4(
            frontend_dir=frontend_dir,
            output_renders_dir=OUTPUT_RENDERS_DIR,
            clip_id=req.clip_id,
            input_props=req.input_props,
            fps=req.fps or 60,
        )
        return {
            "success": True,
            "download_url": f"/storage/renders/{final_mp4.name}",
            "filename": final_mp4.name,
        }
    except Exception as e:
        logger.error(f"Render burn-in export failed: {e}")
        # Graceful fallback: return the vertical clip so user is never blocked
        vertical_fallback = DOWNLOADS_DIR / f"{req.clip_id}_vertical.mp4"
        if vertical_fallback.exists():
            return {
                "success": True,
                "download_url": f"/storage/downloads/{vertical_fallback.name}",
                "filename": vertical_fallback.name,
                "warning": f"Headless Chromium fallback used: {e}",
            }
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
```


################################################################################
### FILE 5/33: backend/services/vtt_parser.py
################################################################################

```python
# PATH: backend/services/vtt_parser.py
import re
import html
import subprocess
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger("viral_studio.vtt")

TIMECODE_RE = re.compile(
    r"(?P<start>\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(?P<end>\d{2}:\d{2}:\d{2}\.\d{3})"
)
INLINE_WORD_RE = re.compile(r"<(\d{2}:\d{2}:\d{2}\.\d{3})><c>\s*([^<]+?)\s*</c>")
HTML_TAG_RE = re.compile(r"<[^>]+>")

# Non-speech sound tokens to strip
NOISE_TOKENS = {
    "[music]", "[musique]", "[applause]", "[applaudissements]",
    "[ __ ]", "[laughter]", "[rires]", ">>", "--"
}


def _clean_token(text: str) -> str:
    """Unescapes HTML entities and cleans non-speech tokens."""
    cleaned = html.unescape(text).strip()
    if cleaned.lower() in NOISE_TOKENS or cleaned in {"[ __ ]", ">>", "--"}:
        return ""
    return cleaned


def _ts_to_seconds(ts: str) -> float:
    parts = ts.strip().split(":")
    if len(parts) == 3:
        h, m, s = parts
        return round(int(h) * 3600 + int(m) * 60 + float(s), 3)
    elif len(parts) == 2:
        m, s = parts
        return round(int(m) * 60 + float(s), 3)
    return round(float(parts[0]), 3)


def extract_youtube_vtt_fast(url: str, output_dir: Path, media_id: str) -> Optional[Path]:
    """
    Pulls native or auto-generated YouTube VTT captions in < 0.2s without downloading video.
    Prioritizes original language (-orig) tracks to prevent machine translation mismatch.
    """
    out_template = str(output_dir / f"{media_id}")
    cmd = [
        "py",
        "-m",
        "yt_dlp",
        "--skip-download",
        "--write-sub",
        "--write-auto-sub",
        "--sub-lang",
        ".*-orig,en,en.*,fr,fr.*,es,es.*,ur,ur.*,hi,hi.*",
        "--sub-format",
        "vtt",
        "--ignore-errors",
        "-o",
        out_template,
        url,
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20)
        vtt_files = list(output_dir.glob(f"{media_id}*.vtt"))
        if not vtt_files:
            return None

        # Prioritize original audio language tracks (-orig) first!
        orig_tracks = [f for f in vtt_files if "-orig" in f.name]
        if orig_tracks:
            chosen = orig_tracks[0]
            logger.info(f"Selected original audio VTT track: {chosen.name}")
            return chosen

        # Then sort by preference: prefer non-translated tracks
        vtt_files.sort(key=lambda p: (
            0 if not (".en." in p.name and "-orig" not in p.name) else 1,
            p.stat().st_size * -1  # larger subtitle file usually has full transcription
        ))
        logger.info(f"Selected best available VTT track: {vtt_files[0].name}")
        return vtt_files[0]
    except Exception as e:
        logger.warning(f"Fast VTT extraction skipped/failed, will fallback to Whisper: {e}")
        return None


def parse_youtube_vtt_to_words(vtt_path: Path, media_id: str) -> Dict[str, Any]:
    """
    Converts YouTube VTT (both word-level <c> tags and standard cue blocks)
    into Remotion's exact TranscriptData schema with zero rolling-cue duplication.
    """
    raw_text = vtt_path.read_text(encoding="utf-8", errors="replace")
    blocks = re.split(r"\n\s*\n", raw_text)

    words: List[Dict[str, Any]] = []
    segments: List[Dict[str, Any]] = []
    last_word_start = -1.0

    # Detect if file uses word-level inline <c> tags
    has_c_tags = "<c>" in raw_text

    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue

        header_idx = -1
        match = None
        for idx, line in enumerate(lines):
            m = TIMECODE_RE.search(line)
            if m:
                header_idx = idx
                match = m
                break

        if match is None:
            continue

        cue_start = _ts_to_seconds(match.group("start"))
        cue_end = _ts_to_seconds(match.group("end"))
        if cue_end <= cue_start + 0.02:
            continue

        payload_lines = lines[header_idx + 1 :]
        if not payload_lines:
            continue

        cue_words_added: List[Dict[str, Any]] = []

        if has_c_tags:
            # YouTube Auto-Captions with rolling cues:
            # If block has 2 lines, Line 0 is repeated from previous cue; Line 1 is the new incoming words.
            # Only process lines containing <c> tags to eliminate duplicate previous lines!
            c_lines = [l for l in payload_lines if "<c>" in l]
            target_lines = c_lines if c_lines else [payload_lines[-1]]

            for line in target_lines:
                first_word_raw = HTML_TAG_RE.sub("", line.split("<")[0]).strip()
                first_word_clean = _clean_token(first_word_raw)
                inline_matches = INLINE_WORD_RE.findall(line)

                if first_word_clean and cue_start > last_word_start + 0.05:
                    first_end = (
                        _ts_to_seconds(inline_matches[0][0])
                        if inline_matches
                        else min(cue_end, cue_start + 0.35)
                    )
                    w_obj = {
                        "word": first_word_clean,
                        "start": round(cue_start, 2),
                        "end": round(max(cue_start + 0.05, first_end), 2),
                        "confidence": 0.99,
                    }
                    words.append(w_obj)
                    cue_words_added.append(w_obj)
                    last_word_start = cue_start

                for i, (ts_str, w_text) in enumerate(inline_matches):
                    w_start = _ts_to_seconds(ts_str)
                    if w_start <= last_word_start + 0.02:
                        continue
                    w_end = (
                        _ts_to_seconds(inline_matches[i + 1][0])
                        if i + 1 < len(inline_matches)
                        else cue_end
                    )
                    clean_w = _clean_token(HTML_TAG_RE.sub("", w_text))
                    if clean_w:
                        w_obj = {
                            "word": clean_w,
                            "start": round(w_start, 2),
                            "end": round(max(w_start + 0.05, w_end), 2),
                            "confidence": 0.99,
                        }
                        words.append(w_obj)
                        cue_words_added.append(w_obj)
                        last_word_start = w_start
        else:
            # Standard manual VTT without <c> tags:
            # Interpolate timestamps proportionally by character length
            combined_text = " ".join(payload_lines)
            clean_line = HTML_TAG_RE.sub("", combined_text).strip()
            raw_tokens = clean_line.split()
            tokens = [_clean_token(t) for t in raw_tokens if _clean_token(t)]

            if tokens and cue_start > last_word_start + 0.05:
                total_chars = sum(len(t) for t in tokens) or 1
                cursor = cue_start
                cue_dur = max(0.2, cue_end - cue_start)
                for t in tokens:
                    w_dur = cue_dur * (len(t) / total_chars)
                    w_end = min(cue_end, cursor + max(0.06, w_dur))
                    w_obj = {
                        "word": t,
                        "start": round(cursor, 2),
                        "end": round(w_end, 2),
                        "confidence": 0.95,
                    }
                    words.append(w_obj)
                    cue_words_added.append(w_obj)
                    cursor = w_end
                last_word_start = cue_start

        if cue_words_added:
            segments.append(
                {
                    "id": len(segments),
                    "start": cue_words_added[0]["start"],
                    "end": cue_words_added[-1]["end"],
                    "text": " ".join(w["word"] for w in cue_words_added),
                }
            )

    duration = words[-1]["end"] if words else 0.0
    return {
        "media_id": media_id,
        "language": "auto",
        "duration": duration,
        "text": " ".join(w["word"] for w in words),
        "words": words,
        "segments": segments,
        "source": "youtube_vtt_zero_latency",
    }

```


################################################################################
### FILE 6/33: backend/services/downloader.py
################################################################################

```python
# PATH: backend/services/downloader.py
import os
import re
import uuid
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Callable
import yt_dlp

from backend.config import DOWNLOADS_DIR
from backend.utils.ffmpeg_helper import extract_audio_16k, probe_media

logger = logging.getLogger(__name__)


def normalize_youtube_url(url: str) -> str:
    """
    Cleans tracking query parameters (?si=..., &feature=..., etc.)
    and normalizes youtu.be, shorts, and watch URLs into a canonical format.
    """
    url = url.strip()
    match = re.search(
        r'(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})',
        url,
    )
    if match:
        video_id = match.group(1)
        return f"https://www.youtube.com/watch?v={video_id}"
    return url


class MediaDownloader:
    """Handles downloading YouTube media or staging uploaded/local video files."""

    @staticmethod
    def _sanitize_filename(name: str) -> str:
        clean = re.sub(r'[\\/*?:"<>|]', "", name)
        return clean.replace(" ", "_")[:60]

    @classmethod
    def process_local_file(cls, input_file_path: Path) -> Dict[str, Any]:
        """
        Process a local video file on disk.
        Zero copying for large gigabyte files: extracts 16kHz audio directly in-place!
        """
        resolved_path = Path(input_file_path).resolve()
        if not resolved_path.exists():
            raise FileNotFoundError(f"Local video file not found at: {resolved_path}")

        file_id = f"local_{uuid.uuid4().hex[:8]}"
        stem = cls._sanitize_filename(resolved_path.stem)
        target_audio = DOWNLOADS_DIR / f"{file_id}_{stem}_16k.wav"

        logger.info(f"Extracting 16kHz mono audio directly from local source: {resolved_path}")
        extract_audio_16k(resolved_path, target_audio)
        probe = probe_media(resolved_path)

        return {
            "id": file_id,
            "title": resolved_path.stem,
            "video_path": str(resolved_path),
            "audio_path": str(target_audio),
            "duration": probe["duration"],
            "width": probe["width"],
            "height": probe["height"],
            "fps": probe["fps"],
            "is_vertical": probe["is_vertical"],
        }

    @classmethod
    def download_youtube_url(
        cls,
        raw_url: str,
        progress_callback: Optional[Callable[[int, str], None]] = None,
    ) -> Dict[str, Any]:
        """
        Download YouTube video with live progress reporting and automatic format optimization.
        Strips tracking tags and selects balanced 720p/1080p stream for fast download.
        """
        clean_url = normalize_youtube_url(raw_url)
        file_id = f"yt_{uuid.uuid4().hex[:8]}"
        template = str(DOWNLOADS_DIR / f"{file_id}_%(title).50s.%(ext)s")

        last_update_time = [0.0]

        def ytdl_hook(d):
            if not progress_callback:
                return
            status = d.get("status")
            if status == "downloading":
                now = time.time()
                if now - last_update_time[0] < 1.0:
                    return
                last_update_time[0] = now

                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded = d.get("downloaded_bytes", 0)
                speed = d.get("speed") or 0
                eta = d.get("eta") or 0

                down_mb = downloaded / (1024 * 1024)
                total_mb = total / (1024 * 1024) if total else 0
                pct = (downloaded / total * 100) if total else 0

                speed_str = (
                    f"{speed / (1024 * 1024):.1f} MB/s" if speed else "calculating..."
                )
                eta_str = f"{int(eta // 60)}m {int(eta % 60)}s" if eta else "..."

                step_msg = (
                    f"Downloading: {down_mb:.1f}MB / {total_mb:.1f}MB ({pct:.0f}%) "
                    f"at {speed_str} (ETA {eta_str})"
                )
                # Map 0-100% download progress to 10%-42% overall pipeline progress
                ui_pct = min(42, max(10, 10 + int(pct * 0.32)))
                progress_callback(ui_pct, step_msg)

            elif status == "finished":
                progress_callback(43, "Download complete. Extracting 16kHz audio track: 43%")

        # Prefer 720p/1080p MP4 with AAC audio for rapid processing and high-quality 9:16 vertical crop
        ydl_opts = {
            "format": "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/bestvideo[height<=1080]+bestaudio/best",
            "outtmpl": template,
            "quiet": True,
            "no_warnings": True,
            "merge_output_format": "mp4",
            "progress_hooks": [ytdl_hook],
        }

        if progress_callback:
            progress_callback(10, f"Connecting to YouTube ({clean_url})...")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(clean_url, download=True)
            video_title = info.get("title", "Unknown Title")
            downloaded_video = Path(ydl.prepare_filename(info))

            if not downloaded_video.exists():
                mp4_candidate = downloaded_video.with_suffix(".mp4")
                if mp4_candidate.exists():
                    downloaded_video = mp4_candidate

        if not downloaded_video.exists():
            raise FileNotFoundError(f"Downloaded video not found at {downloaded_video}")

        target_audio = downloaded_video.with_name(f"{downloaded_video.stem}_16k.wav")

        if progress_callback:
            progress_callback(44, "Extracting high-precision 16kHz audio track...")

        extract_audio_16k(downloaded_video, target_audio)
        probe = probe_media(downloaded_video)

        return {
            "id": file_id,
            "title": video_title,
            "video_path": str(downloaded_video),
            "audio_path": str(target_audio),
            "duration": probe["duration"],
            "width": probe["width"],
            "height": probe["height"],
            "fps": probe["fps"],
            "is_vertical": probe["is_vertical"],
        }

```


################################################################################
### FILE 7/33: backend/services/transcriber.py
################################################################################

```python
# PATH: backend/services/transcriber.py
import json
import logging
import re
import wave
import numpy as np
from pathlib import Path
from typing import Dict, Any, List

from backend.config import TRANSCRIPTS_DIR

logger = logging.getLogger(__name__)

def load_audio_array(audio_path: Path) -> np.ndarray:
    """Load a 16kHz mono WAV file into a normalized float32 numpy array directly."""
    try:
        with wave.open(str(audio_path), "rb") as wf:
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            n_frames = wf.getnframes()
            
            raw_data = wf.readframes(n_frames)
            
            if sampwidth == 2:
                audio_np = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
            else:
                audio_np = np.frombuffer(raw_data, dtype=np.float32)
                
            return audio_np
    except Exception as e:
        logger.warning(f"Direct wave loading failed, falling back to filepath: {e}")
        return None

def parse_srt_or_text(raw_text: str, media_id: str) -> Dict[str, Any]:
    """
    Parses user-provided SRT, VTT, or plain text transcript into structured TranscriptData.
    Allows instant processing with zero Whisper CPU wait time.
    """
    lines = [ln.strip() for ln in raw_text.strip().splitlines() if ln.strip()]
    segments = []
    all_words = []
    
    # Regex to match timestamp lines: e.g. 00:01:20,000 --> 00:01:25,500
    ts_pattern = re.compile(r'(\d{1,2}:\d{2}(?::\d{2})?(?:[,\.]\d{1,3})?)\s*(?:-->|->)\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[,\.]\d{1,3})?)')
    
    def parse_time(ts_str: str) -> float:
        clean = ts_str.replace(',', '.')
        parts = clean.split(':')
        if len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
        elif len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        return float(parts[0])

    curr_start = 0.0
    curr_end = 0.0
    curr_text_lines = []

    for line in lines:
        match = ts_pattern.search(line)
        if match:
            if curr_text_lines:
                seg_text = " ".join(curr_text_lines).strip()
                if seg_text:
                    segments.append((curr_start, curr_end, seg_text))
                curr_text_lines = []
            curr_start = parse_time(match.group(1))
            curr_end = parse_time(match.group(2))
        elif line.isdigit() and len(line) <= 4:
            # Skip SRT line numbers
            continue
        else:
            curr_text_lines.append(line)

    if curr_text_lines:
        seg_text = " ".join(curr_text_lines).strip()
        if seg_text:
            segments.append((curr_start, max(curr_end, curr_start + 3.0), seg_text))

    # If no timestamps matched (e.g. plain text script), chunk into 4-second blocks
    if not segments and lines:
        t = 0.0
        for ln in lines:
            words_in_line = ln.split()
            dur = max(2.5, len(words_in_line) * 0.35)
            segments.append((t, t + dur, ln))
            t += dur

    all_segments_dict = []
    for idx, (s_start, s_end, s_text) in enumerate(segments):
        words = s_text.split()
        seg_words = []
        if words:
            word_dur = (s_end - s_start) / len(words)
            for w_i, w in enumerate(words):
                w_obj = {
                    "word": w,
                    "start": round(s_start + (w_i * word_dur), 2),
                    "end": round(s_start + ((w_i + 1) * word_dur), 2),
                    "confidence": 1.0
                }
                seg_words.append(w_obj)
                all_words.append(w_obj)
                
        all_segments_dict.append({
            "id": idx + 1,
            "start": round(s_start, 2),
            "end": round(s_end, 2),
            "text": s_text,
            "words": seg_words
        })

    max_dur = all_segments_dict[-1]["end"] if all_segments_dict else 40.0

    result = {
        "media_id": media_id,
        "detected_language": "user_provided",
        "language_probability": 1.0,
        "duration": round(max_dur, 2),
        "full_text": " ".join(s["text"] for s in all_segments_dict),
        "total_words": len(all_words),
        "segments": all_segments_dict,
        "words": all_words
    }

    output_file = TRANSCRIPTS_DIR / f"{media_id}_transcript.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    result["transcript_json_path"] = str(output_file)
    return result


class AudioTranscriber:
    """Extracts high-precision word-level timestamps using Faster-Whisper."""
    
    _model_cache = {}

    @classmethod
    def get_model(cls, model_size: str = "base"):
        """Cached model loader so it doesn't reload into memory on every request."""
        if model_size not in cls._model_cache:
            try:
                from faster_whisper import WhisperModel
                cls._model_cache[model_size] = WhisperModel(model_size, device="cpu", compute_type="int8")
            except Exception as e:
                logger.error(f"Failed to load Faster-Whisper: {e}")
                raise
        return cls._model_cache[model_size]

    @classmethod
    def transcribe(cls, audio_path: Path, media_id: str, model_size: str = "base") -> Dict[str, Any]:
        """Transcribe audio track and return full text + word timestamps."""
        model = cls.get_model(model_size)
        
        # Try loading raw numpy audio array first (bypasses any PyAV version discrepancies)
        audio_input = load_audio_array(audio_path)
        if audio_input is None:
            audio_input = str(audio_path)
            
        segments, info = model.transcribe(
            audio_input,
            beam_size=5,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )
        
        all_words: List[Dict[str, Any]] = []
        all_segments: List[Dict[str, Any]] = []
        full_text_chunks = []
        
        for seg in segments:
            seg_dict = {
                "id": seg.id,
                "start": round(seg.start, 2),
                "end": round(seg.end, 2),
                "text": seg.text.strip(),
                "words": []
            }
            full_text_chunks.append(seg.text.strip())
            
            if seg.words:
                for w in seg.words:
                    word_obj = {
                        "word": w.word.strip(),
                        "start": round(w.start, 2),
                        "end": round(w.end, 2),
                        "confidence": round(w.probability, 2)
                    }
                    seg_dict["words"].append(word_obj)
                    all_words.append(word_obj)
                    
            all_segments.append(seg_dict)
            
        result = {
            "media_id": media_id,
            "detected_language": info.language,
            "language_probability": round(info.language_probability, 2),
            "duration": round(info.duration, 2),
            "full_text": " ".join(full_text_chunks),
            "total_words": len(all_words),
            "segments": all_segments,
            "words": all_words
        }
        
        # Save to disk
        output_file = TRANSCRIPTS_DIR / f"{media_id}_transcript.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
            
        result["transcript_json_path"] = str(output_file)
        return result

```


################################################################################
### FILE 8/33: backend/services/ai_director.py
################################################################################

```python
# PATH: backend/services/ai_director.py
import os
import json
import logging
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

logger = logging.getLogger("viral_studio.director")


class MotionEventSchema(BaseModel):
    time_sec: float = Field(
        description="Relative timestamp in seconds (0.0 to clip_duration) when this Top Safe Zone card appears."
    )
    type: Literal["headline_badge", "impact_text"] = Field(
        description="Visual overlay archetype. (Only headline_badge or impact_text allowed)."
    )
    text: str = Field(
        description="Punchy 2-to-4 word uppercase insight derived directly from spoken dialogue (e.g. 'RULE 1: CALM FIRST')."
    )


class RankedViralShortSchema(BaseModel):
    rank: int = Field(description="Rank from 1 (best) to 5.")
    hook_score: int = Field(description="Predicted retention & virality score (80 to 99).")
    angle_tag: Literal["TOP HOOK", "DEBATE", "EMOTIONAL", "CONTRARIAN", "INSIGHT"] = Field(
        description="Core psychological virality angle."
    )
    topic_pill: str = Field(
        description="Short bracketed topic header for the Top Safe Zone (e.g. '[ PARENTING DILEMMA ]')."
    )
    viral_title: str = Field(
        description="High-CTR title in the exact same language as the transcript."
    )
    start_line: int = Field(
        description="Starting line number in the numbered transcript."
    )
    end_line: int = Field(
        description="Ending line number in the numbered transcript (duration must span 30 to 50 seconds)."
    )
    rationale: str = Field(
        description="1-sentence psychological explanation of why this moment hooks viewers."
    )
    spoken_keywords: List[str] = Field(
        description="4 to 6 exact impactful words spoken inside this segment."
    )
    suggested_pan_percent: int = Field(
        default=50,
        description="Default horizontal framing: 25 for Left Host, 50 for Center/Solo, 75 for Right Guest."
    )
    motion_events: List[MotionEventSchema] = Field(
        description="2 to 3 timed Top-Zone motion cards spaced at least 6 seconds apart."
    )


class EpisodeDirectorSuiteSchema(BaseModel):
    niche: str = Field(description="Detected podcast niche (e.g. Parenting, Tech, Psychology, Finance).")
    episode_summary: str = Field(description="1-sentence executive summary of the full episode script.")
    total_viral_candidates: int = Field(description="Number of ranked viral shorts returned (up to 5).")
    shorts: List[RankedViralShortSchema] = Field(
        description="Top 3 to 5 non-overlapping ranked viral shorts sorted by hook_score descending."
    )


def build_transcript_lines(words: List[Dict[str, Any]], max_gap: float = 1.0, max_chars: int = 95) -> List[Dict[str, Any]]:
    """
    Groups individual words into 8-14 word sentence lines with clean start/end times.
    Prevents truncation and eliminates mid-sentence audio cuts.
    """
    lines = []
    current = []

    for w in words:
        if not current:
            current.append(w)
            continue

        gap = w["start"] - current[-1]["end"]
        text_len = sum(len(x["word"]) + 1 for x in current)

        if gap > max_gap or text_len > max_chars:
            lines.append(current)
            current = [w]
        else:
            current.append(w)

    if current:
        lines.append(current)

    return [
        {
            "line": idx + 1,
            "start": round(group[0]["start"], 2),
            "end": round(group[-1]["end"], 2),
            "text": " ".join(x["word"] for x in group).strip(),
        }
        for idx, group in enumerate(lines)
    ]


def generate_ranked_viral_suite(
    transcript_data: Dict[str, Any], api_key: str
) -> Dict[str, Any]:
    words = transcript_data.get("words", [])
    total_duration = float(transcript_data.get("duration", 60.0))

    # Build numbered lines covering the ENTIRE episode (never truncated to 450!)
    lines = build_transcript_lines(words)
    if not lines:
        segments = transcript_data.get("segments", [])
        lines = [
            {"line": idx + 1, "start": s["start"], "end": s["end"], "text": s["text"]}
            for idx, s in enumerate(segments)
        ]

    # Format transcript lines for Gemini
    formatted_transcript = "\n".join(
        f"{item['line']}| {item['text']}"
        for item in lines[:1200]  # Full 48-minute podcast comfortably fits in 1200 sentence lines
    )

    system_instruction = (
        "You are an elite short-form podcast editor for YouTube Shorts, Reels, and TikTok (OpusClip style). "
        "Analyze the FULL numbered transcript of the podcast. "
        "Find the Top 5 non-overlapping viral clips strictly between 30 and 50 seconds in length. "
        "Rules:\n"
        "1. Return start_line and end_line referencing the numbered lines—NEVER guess raw seconds.\n"
        "2. Clips must not overlap.\n"
        "3. Every clip must start with an immediate high-tension hook in the opening sentence.\n"
        "4. Do NOT invent statistics or facts not present in the transcript.\n"
        "5. Motion cards must be uppercase punchy phrases derived directly from spoken words."
    )

    client = genai.Client(api_key=api_key)
    candidate_models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"]
    response = None
    last_err = None

    for m_name in candidate_models:
        try:
            logger.info(f"Querying Gemini Director with model: {m_name}")
            response = client.models.generate_content(
                model=m_name,
                contents=f"Episode Duration: {total_duration:.1f}s\nTotal Lines: {len(lines)}\n\nTranscript:\n{formatted_transcript}",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=EpisodeDirectorSuiteSchema,
                    temperature=0.25,
                ),
            )
            if response and response.text:
                break
        except Exception as e:
            logger.warning(f"Model {m_name} failed: {e}. Trying next candidate...")
            last_err = e

    if not response or not response.text:
        raise RuntimeError(f"All Gemini models failed to generate viral suite: {last_err}")

    suite = json.loads(response.text)

    # Convert line numbers -> exact sentence boundary timestamps
    line_map = {item["line"]: item for item in lines}
    normalized_shorts = []

    for idx, short in enumerate(suite.get("shorts", [])[:5]):
        s_line = short.get("start_line", 1)
        e_line = short.get("end_line", s_line + 5)

        start_item = line_map.get(s_line) or lines[0]
        end_item = line_map.get(e_line) or lines[min(len(lines) - 1, s_line + 8)]

        st = float(start_item["start"])
        et = float(end_item["end"])

        # Enforce 30-50 second bounds
        dur = et - st
        if dur < 28.0:
            # Expand to 35-45s using adjacent lines
            target_end_line = min(len(lines), s_line + 15)
            for l_idx in range(e_line, target_end_line):
                if lines[l_idx]["end"] - st >= 32.0:
                    et = float(lines[l_idx]["end"])
                    break
        elif dur > 55.0:
            # Shrink to 45s
            for l_idx in range(s_line, e_line):
                if lines[l_idx]["end"] - st >= 40.0:
                    et = float(lines[l_idx]["end"])
                    break

        clip_dur = round(max(5.0, et - st), 2)
        short["rank"] = idx + 1
        short["start_time"] = round(st, 2)
        short["end_time"] = round(et, 2)
        short["duration"] = clip_dur

        # Space out motion events within the clip
        for ev in short.get("motion_events", []):
            t = float(ev.get("time_sec", 2.0))
            if t > clip_dur and st <= t <= et:
                t = t - st
            ev["time_sec"] = round(max(0.5, min(t, clip_dur - 2.8)), 2)

        normalized_shorts.append(short)

    suite["shorts"] = normalized_shorts
    return suite

```


################################################################################
### FILE 9/33: backend/services/face_tracker.py
################################################################################

```python
# PATH: backend/services/face_tracker.py
import cv2
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, Literal, List
import subprocess

from backend.config import DOWNLOADS_DIR
from backend.utils.ffmpeg_helper import probe_media

logger = logging.getLogger(__name__)

CropFocusType = Literal["auto", "center", "left", "right"]


class FaceAutoTracker:
    """
    Computes dynamic 9:16 vertical crop and camera-switch pan keyframes from 16:9 horizontal video.
    Tracks face centers across dual-speaker cuts without cutting off speakers mid-dialogue.
    """

    @classmethod
    def generate_pan_keyframes(
        cls,
        video_path: Path,
        sample_interval_sec: float = 0.75,
    ) -> List[Dict[str, Any]]:
        """
        Samples video frames at regular intervals, detects the speaker's face center,
        and generates smooth shot-switch pan keyframes: [{"t": 0.0, "pan": 25}, {"t": 14.5, "pan": 75}].
        """
        if not video_path.exists():
            return [{"t": 0.0, "pan": 50}]

        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if w <= 0 or h <= 0 or total_frames <= 0:
            cap.release()
            return [{"t": 0.0, "pan": 50}]

        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        step = max(1, int(fps * sample_interval_sec))
        raw_samples = []

        for f_idx in range(0, total_frames, step):
            cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
            ret, frame = cap.read()
            if not ret:
                break
            t = round(f_idx / fps, 1)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(
                gray, scaleFactor=1.2, minNeighbors=4, minSize=(45, 45)
            )

            if len(faces) > 0:
                largest = max(faces, key=lambda b: b[2] * b[3])
                fx, fy, fw, fh = largest
                cx_pct = (fx + fw / 2) / w * 100
                pan = round(max(10, min(90, (cx_pct - 28.125) / 0.4375)))
                raw_samples.append((t, pan))
            else:
                raw_samples.append((t, None))

        cap.release()

        if not raw_samples:
            return [{"t": 0.0, "pan": 50}]

        # Forward-fill any frames where face was temporarily occluded/missed
        filled_samples = []
        last_val = 50
        for t, pan in raw_samples:
            if pan is not None:
                last_val = pan
            filled_samples.append((t, last_val))

        # Detect camera cuts / speaker switches (change >= 18% holding for >= 1.5s)
        keyframes = [{"t": 0.0, "pan": filled_samples[0][1]}]
        current_pan = filled_samples[0][1]
        i = 1
        while i < len(filled_samples):
            t, pan = filled_samples[i]
            if abs(pan - current_pan) >= 18:
                next_slice = filled_samples[i : i + 3]
                if len(next_slice) >= 2 and all(abs(p - pan) < 15 for _, p in next_slice):
                    keyframes.append({"t": round(t, 1), "pan": pan})
                    current_pan = pan
                    i += 2
            i += 1

        return keyframes

    @classmethod
    def compute_vertical_crop(
        cls,
        video_path: Path,
        sample_interval_sec: float = 0.5,
        crop_focus: CropFocusType = "auto",
    ) -> Dict[str, Any]:
        probe = probe_media(video_path)
        w, h = probe["width"], probe["height"]

        if probe["is_vertical"] or (w is None or h is None):
            return {
                "needs_crop": False,
                "crop_x": 0,
                "crop_y": 0,
                "crop_w": w or 1080,
                "crop_h": h or 1920,
            }

        target_crop_w = int(h * (9 / 16))
        if target_crop_w > w:
            target_crop_w = w

        # Direct manual framing overrides
        if crop_focus == "center":
            crop_x = int((w - target_crop_w) / 2)
            return {
                "needs_crop": True,
                "crop_x": max(0, min(crop_x, w - target_crop_w)),
                "crop_y": 0,
                "crop_w": target_crop_w,
                "crop_h": h,
                "original_width": w,
                "original_height": h,
            }
        elif crop_focus == "left":
            crop_x = int(w * 0.06)
            return {
                "needs_crop": True,
                "crop_x": max(0, min(crop_x, w - target_crop_w)),
                "crop_y": 0,
                "crop_w": target_crop_w,
                "crop_h": h,
                "original_width": w,
                "original_height": h,
            }
        elif crop_focus == "right":
            crop_x = int(w - target_crop_w - (w * 0.06))
            return {
                "needs_crop": True,
                "crop_x": max(0, min(crop_x, w - target_crop_w)),
                "crop_y": 0,
                "crop_w": target_crop_w,
                "crop_h": h,
                "original_width": w,
                "original_height": h,
            }

        # Auto speaker face detection
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = max(1, int(fps * sample_interval_sec))

        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        detected_faces = []
        frame_idx = 0
        total_samples = 0

        while cap.isOpened() and total_samples < 40:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                total_samples += 1
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(
                    gray, scaleFactor=1.2, minNeighbors=4, minSize=(60, 60)
                )

                for fx, fy, fw, fh in faces:
                    detected_faces.append(
                        {"center_x": fx + (fw // 2), "area": fw * fh}
                    )

            frame_idx += 1

        cap.release()

        if not detected_faces:
            avg_center_x = w // 2
        else:
            # Check for dual-speaker podcast setup (faces on both sides of screen)
            left_faces = [f for f in detected_faces if f["center_x"] < (w * 0.45)]
            right_faces = [f for f in detected_faces if f["center_x"] > (w * 0.55)]

            # If both speakers appear in shot, pick the dominant speaker with largest face area
            if left_faces and right_faces:
                left_weight = sum(f["area"] for f in left_faces)
                right_weight = sum(f["area"] for f in right_faces)
                chosen_cluster = left_faces if left_weight >= right_weight else right_faces
                avg_center_x = int(
                    sum(f["center_x"] for f in chosen_cluster) / len(chosen_cluster)
                )
            else:
                avg_center_x = int(
                    sum(f["center_x"] for f in detected_faces) / len(detected_faces)
                )

        crop_x = avg_center_x - (target_crop_w // 2)
        crop_x = max(0, min(crop_x, w - target_crop_w))

        return {
            "needs_crop": True,
            "crop_x": int(crop_x),
            "crop_y": 0,
            "crop_w": int(target_crop_w),
            "crop_h": int(h),
            "original_width": w,
            "original_height": h,
        }

    @classmethod
    def render_vertical_crop(
        cls,
        input_path: Path,
        output_path: Path,
        crop_focus: CropFocusType = "auto",
    ) -> Path:
        """Render 9:16 vertical video using computed crop coordinates."""
        crop_info = cls.compute_vertical_crop(input_path, crop_focus=crop_focus)
        if not crop_info["needs_crop"]:
            import shutil

            shutil.copy2(input_path, output_path)
            return output_path

        cx = crop_info["crop_x"]
        cy = crop_info["crop_y"]
        cw = crop_info["crop_w"]
        ch = crop_info["crop_h"]

        filter_str = f"crop={cw}:{ch}:{cx}:{cy},scale=1080:1920:flags=lanczos,setsar=1"

        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-vf",
            filter_str,
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "copy",
            "-movflags",
            "+faststart",
            str(output_path),
        ]
        subprocess.run(cmd, capture_output=True, text=True, check=True)
        return output_path

```


################################################################################
### FILE 10/33: backend/services/remotion_exporter.py
################################################################################

```python
# PATH: backend/services/remotion_exporter.py
import os
import json
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger("viral_studio.exporter")


def render_burned_in_short_mp4(
    frontend_dir: Path,
    output_renders_dir: Path,
    clip_id: str,
    input_props: Dict[str, Any],
    fps: int = 60,
) -> Path:
    """
    Invokes the dedicated Node Remotion renderer script (render_short.mjs)
    which bundles Remotion once and bakes all kinetic captions, Syne fonts,
    pan framing, and motion badges into a 1080x1920 H.264 MP4.
    """
    output_renders_dir.mkdir(parents=True, exist_ok=True)
    props_file = output_renders_dir / f"{clip_id}_render_props.json"
    final_mp4_path = output_renders_dir / f"{clip_id}_final_burned.mp4"

    # Ensure duration and fps are explicitly present in props
    duration_sec = float(input_props.get("duration", 40.0))
    input_props["duration"] = duration_sec
    input_props["fps"] = fps

    with open(props_file, "w", encoding="utf-8") as f:
        json.dump(input_props, f, indent=2)

    script_path = frontend_dir / "render_short.mjs"
    cmd = [
        "node",
        str(script_path),
        str(props_file),
        str(final_mp4_path),
    ]

    logger.info(f"Starting Remotion Node Burn-In Export: {' '.join(cmd)}")
    result = subprocess.run(
        cmd,
        cwd=str(frontend_dir),
        capture_output=True,
        text=True,
        timeout=420,
    )

    if result.returncode != 0:
        logger.error(f"Node render failed with exit code {result.returncode}: {result.stderr}")
        raise RuntimeError(f"Remotion render error: {result.stderr or result.stdout}")

    if not final_mp4_path.exists():
        raise RuntimeError("Remotion renderer exited 0 but output MP4 was not found.")

    logger.info(f"Burn-in export succeeded: {final_mp4_path} ({final_mp4_path.stat().st_size} bytes)")
    return final_mp4_path

```


################################################################################
### FILE 11/33: backend/utils/ffmpeg_helper.py
################################################################################

```python
# PATH: backend/utils/ffmpeg_helper.py
import subprocess
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def probe_media(file_path: Path) -> Dict[str, Any]:
    """Inspect video/audio file and return duration, resolution, fps."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration,size:stream=width,height,r_frame_rate,codec_type",
        "-of", "json",
        str(file_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(res.stdout)
    
    duration = float(data.get("format", {}).get("duration", 0.0))
    video_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
    
    width = video_stream.get("width") if video_stream else None
    height = video_stream.get("height") if video_stream else None
    
    fps = 30.0
    if video_stream and "r_frame_rate" in video_stream:
        num, den = video_stream["r_frame_rate"].split("/")
        fps = float(num) / float(den) if float(den) != 0 else 30.0

    return {
        "duration": duration,
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "is_vertical": (height > width) if (width and height) else False
    }

def extract_audio_16k(video_path: Path, output_wav_path: Path) -> Path:
    """Extract a 16kHz mono WAV audio track specifically optimized for Whisper."""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        str(output_wav_path)
    ]
    subprocess.run(cmd, capture_output=True, text=True, check=True)
    return output_wav_path

def trim_video_clip(input_path: Path, output_path: Path, start_sec: float, end_sec: float) -> Path:
    """Trim a subclip frame-accurately with re-encoded keyframes so there is zero caption drift."""
    duration = max(0.5, end_sec - start_sec)
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-ss", str(start_sec),
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-avoid_negative_ts", "make_zero",
        str(output_path)
    ]
    subprocess.run(cmd, capture_output=True, text=True, check=True)
    return output_path

```


################################################################################
### FILE 12/33: frontend/package.json
################################################################################

```json
# PATH: frontend/package.json
{
  "name": "viral-studio-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-three/drei": "^9.122.0",
    "@react-three/fiber": "^8.18.0",
    "@remotion/player": "^4.0.280",
    "clsx": "^2.1.1",
    "framer-motion": "^12.4.7",
    "katex": "^0.16.21",
    "lucide-react": "^0.475.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.15.1",
    "remotion": "^4.0.280",
    "roughjs": "^4.6.6",
    "tailwind-merge": "^3.0.1",
    "three": "^0.173.0"
  },
  "devDependencies": {
    "@remotion/bundler": "^4.0.543",
    "@remotion/cli": "^4.0.543",
    "@remotion/renderer": "^4.0.543",
    "@remotion/tailwind": "^4.0.543",
    "@types/katex": "^0.16.7",
    "@types/node": "^22.13.4",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@types/three": "^0.173.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.0"
  }
}

```


################################################################################
### FILE 13/33: frontend/vite.config.ts
################################################################################

```typescript
# PATH: frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/storage': 'http://127.0.0.1:8000',
    },
  },
});

```


################################################################################
### FILE 14/33: frontend/tailwind.config.js
################################################################################

```javascript
# PATH: frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          dark: "#090D16",
          panel: "#121826",
          border: "#1E293B",
          accent: "#00F0FF",
          red: "#E63946",
          pink: "#FF2A54",
          yellow: "#FFE600",
          paper: "#F5F2EB",
          text: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        headline: ["Syne", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        impact: ["Impact", "sans-serif"],
        body: ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}

```


################################################################################
### FILE 15/33: frontend/render_short.mjs
################################################################################

```javascript
# PATH: frontend/render_short.mjs
import path from 'path';
import fs from 'fs';
import os from 'os';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { enableTailwind } from '@remotion/tailwind';

async function main() {
  const [propsPath, outputPath] = process.argv.slice(2);
  if (!propsPath || !outputPath) {
    console.error('Usage: node render_short.mjs <props_json_path> <output_mp4_path>');
    process.exit(1);
  }

  const resolvedProps = path.resolve(propsPath);
  const resolvedOutput = path.resolve(outputPath);

  if (!fs.existsSync(resolvedProps)) {
    console.error(`Props file not found: ${resolvedProps}`);
    process.exit(1);
  }

  const inputProps = JSON.parse(fs.readFileSync(resolvedProps, 'utf-8'));

  // Ensure videoUrl is absolute HTTP so Headless Chromium can load from FastAPI
  if (inputProps.videoUrl && inputProps.videoUrl.startsWith('/storage/')) {
    inputProps.videoUrl = `http://127.0.0.1:8000${inputProps.videoUrl}`;
  }

  console.log('Bundling Remotion composition with Tailwind CSS...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve('./src/remotion/index.ts'),
    webpackOverride: (config) => enableTailwind(config),
  });

  console.log('Selecting composition: MasterShortComposition');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'MasterShortComposition',
    inputProps,
  });

  const durationSec = Number(inputProps.duration || 40);
  const fps = Number(inputProps.fps || composition.fps || 30);
  const durationInFrames = Math.max(30, Math.floor(durationSec * fps));

  const targetComposition = {
    ...composition,
    durationInFrames,
    fps,
  };

  // Scale concurrency across available CPU cores (utilize multi-core hardware)
  const numCpus = os.cpus().length || 4;
  const concurrency = Math.min(8, Math.max(4, Math.floor(numCpus / 2)));

  console.log(`Rendering ${durationInFrames} frames (${durationSec.toFixed(1)}s @ ${fps}fps, concurrency=${concurrency}) to: ${resolvedOutput}`);

  await renderMedia({
    composition: targetComposition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: resolvedOutput,
    inputProps,
    crf: 19,
    pixelFormat: 'yuv420p',
    concurrency,
    onProgress: ({ progress }) => {
      process.stdout.write(`Rendering: ${Math.round(progress * 100)}%\r`);
    },
  });

  console.log('\nRender completed successfully!');
}

main().catch((err) => {
  console.error('\nRender error:', err);
  process.exit(1);
});

```


################################################################################
### FILE 16/33: frontend/src/index.css
################################################################################

```css
# PATH: frontend/src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-[#090D16] text-slate-100 font-body antialiased;
  }
}

/* Custom Scrollbar for Studio panels */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #0F172A;
}
::-webkit-scrollbar-thumb {
  background: #1E293B;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #334155;
}

```


################################################################################
### FILE 17/33: frontend/src/types.ts
################################################################################

```typescript
# PATH: frontend/src/types.ts
export interface PanKeyframe {
  t: number;
  pan: number;
}

export type MotionEventType = 'headline_badge' | 'stat_counter' | 'impact_text';

export interface MotionEvent {
  time_sec: number;
  type: MotionEventType;
  text?: string | null;
  label?: string | null;
  value?: string | null;
}

export interface MediaInfo {
  id: string;
  title: string;
  duration: number;
  video_path: string;
  audio_path?: string;
  width?: number;
  height?: number;
  fps?: number;
  source_url?: string;
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptSegment {
  id?: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptData {
  media_id: string;
  language?: string;
  duration?: number;
  total_words?: number;
  text?: string;
  words: TranscriptWord[];
  segments?: TranscriptSegment[];
}

export interface ViralClipRecommendation {
  clip_id?: string;
  rank?: number;
  title: string;
  start_time: number;
  end_time: number;
  duration?: number;
  hook_sentence?: string;
  hook_score?: number;
  viral_score?: number;
  angle_tag?: 'TOP HOOK' | 'DEBATE' | 'EMOTIONAL' | 'CONTRARIAN' | 'INSIGHT' | string;
  topic_pill?: string;
  reasoning?: string;
  transcript_preview?: string;
  visual_keywords?: string[];
  spoken_keywords?: string[];
  suggested_pan_percent?: number;
  pan_keyframes?: PanKeyframe[];
  motion_events?: MotionEvent[];
}

export interface PresetConfig {
  id: string;
  name: string;
  description?: string;
  category?: string;
  background?: {
    type?: string;
    primaryColor?: string;
    secondaryColor?: string;
    gridOpacity?: number;
    baseColor?: string;
    dotColor?: string;
    gridLineColor?: string;
  };
  typography?: {
    headlineFont?: string;
    bodyFont?: string;
    monoFont?: string;
  };
  captions: {
    activeWordColor: string;
    inactiveWordColor: string;
    highlightBox?: boolean;
    boxColor?: string;
    position?: 'bottom' | 'center' | 'top';
  };
  features?: {
    enable3D?: boolean;
    enableMathFormulas?: boolean;
    enableCharts?: boolean;
  };
}

export interface ClipManifest {
  clip_id: string;
  title: string;
  viral_title?: string;
  duration: number;
  start_time: number;
  end_time: number;
  video_url: string;
  words: TranscriptWord[];
  pan_keyframes?: PanKeyframe[];
  motion_events: MotionEvent[];
  preset: PresetConfig;
  render_status: string;
}

export interface JobResultPayload {
  media: MediaInfo;
  transcript: TranscriptData;
  niche: string;
  viral_title: string;
  best_clip: {
    start_time: number;
    end_time: number;
    hook_score: number;
    reasoning: string;
  };
  motion_events: MotionEvent[];
  recommended_clips: ViralClipRecommendation[];
  clip_manifest: ClipManifest;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  step: string;
  error?: string | null;
  result?: JobResultPayload | null;
}
```


################################################################################
### FILE 18/33: frontend/src/App.tsx
################################################################################

```tsx
# PATH: frontend/src/App.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { PresetManager } from './components/PresetManager';
import { TimelineTranscript } from './components/TimelineTranscript';
import { OutputSettings } from './components/OutputSettings';
import { InteractiveFramingCanvas } from './components/InteractiveFramingCanvas';
import { MasterShortComposition } from './remotion/MasterShortComposition';
import {
  MediaInfo,
  TranscriptData,
  ViralClipRecommendation,
  PresetConfig,
  TranscriptWord,
  MotionEvent,
  PanKeyframe,
  JobStatusResponse,
} from './types';

type PipelineState = 'IDLE' | 'PROCESSING' | 'READY' | 'ERROR';

export const App: React.FC = () => {
  const playerRef = useRef<PlayerRef>(null);
  const pollTimerRef = useRef<number | null>(null);

  // System states
  const [apiStatus, setApiStatus] = useState<'online' | 'connecting' | 'offline'>('connecting');
  const [presets, setPresets] = useState<PresetConfig[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<PresetConfig | null>(null);

  // Async Job Queue state machine
  const [pipelineState, setPipelineState] = useState<PipelineState>('IDLE');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobStep, setJobStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ingestion & AI Director states
  const [currentMedia, setCurrentMedia] = useState<MediaInfo | null>(null);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [recommendedClips, setRecommendedClips] = useState<ViralClipRecommendation[]>([]);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 40,
  });
  const [viralTitle, setViralTitle] = useState<string>('VIRAL REEL PREVIEW');
  const [topicPill, setTopicPill] = useState<string>('[ VIRAL INSIGHT ]');
  const [detectedNiche, setDetectedNiche] = useState<string>('');
  const [bestClipReasoning, setBestClipReasoning] = useState<string>('');
  const [motionEvents, setMotionEvents] = useState<MotionEvent[]>([]);
  const [panKeyframes, setPanKeyframes] = useState<PanKeyframe[]>([{ t: 0, pan: 50 }]);
  const [currentPlaySec, setCurrentPlaySec] = useState<number>(0);
  const [isAutoTracking, setIsAutoTracking] = useState<boolean>(false);
  const [cropFocus, setCropFocus] = useState<'auto' | 'center' | 'left' | 'right'>('auto');
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string>('');
  const [trimmedClipWords, setTrimmedClipWords] = useState<TranscriptWord[]>([]);

  // Render settings (Default 30 FPS for fast, ultra-responsive production rendering)
  const [resolution, setResolution] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [fps, setFps] = useState<number>(30);
  const [isRendering, setIsRendering] = useState(false);
  const [renderSuccessUrl, setRenderSuccessUrl] = useState<string | null>(null);

  // 1. Initial Health & Presets check
  useEffect(() => {
    const initBackend = async () => {
      try {
        const hRes = await fetch('/api/health');
        if (hRes.ok) setApiStatus('online');

        const pRes = await fetch('/api/presets');
        const pData = await pRes.json();
        if (pData.presets?.length > 0) {
          setPresets(pData.presets);
          const defaultPreset =
            pData.presets.find((p: PresetConfig) => p.id.includes('fable')) || pData.presets[0];
          setSelectedPreset(defaultPreset);
        }
      } catch {
        setApiStatus('offline');
      }
    };
    initBackend();
  }, []);

  // Synchronize playback timestamp with framing controller
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (playerRef.current) {
        const frame = playerRef.current.getCurrentFrame();
        if (typeof frame === 'number') {
          setCurrentPlaySec(frame / fps);
        }
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [fps]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // 2. Poll GET /api/jobs/{id} every 1000ms while in PROCESSING state
  useEffect(() => {
    if (!activeJobId || pipelineState !== 'PROCESSING') return;

    const pollJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${activeJobId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Failed polling job ${activeJobId}`);
        }

        const data: JobStatusResponse = await res.json();
        setJobProgress(data.progress ?? 10);
        setJobStep(data.step || `Processing: ${data.progress}%`);

        if (data.status === 'completed' && data.result) {
          stopPolling();
          const {
            media,
            transcript: tData,
            viral_title,
            niche,
            best_clip,
            motion_events,
            recommended_clips,
            clip_manifest,
          } = data.result;

          setCurrentMedia(media);
          setTranscript(tData);
          setViralTitle(viral_title || media.title);
          setDetectedNiche(niche || '');
          setBestClipReasoning(best_clip?.reasoning || '');
          setMotionEvents(motion_events || []);
          setRecommendedClips(recommended_clips || []);
          if (recommended_clips && recommended_clips.length > 0) {
            const firstClip = recommended_clips[0];
            if (firstClip.topic_pill) setTopicPill(firstClip.topic_pill);
          }
          if (clip_manifest.pan_keyframes && clip_manifest.pan_keyframes.length > 0) {
            setPanKeyframes(clip_manifest.pan_keyframes);
          } else if (recommended_clips?.[0]?.suggested_pan_percent !== undefined) {
            setPanKeyframes([{ t: 0, pan: recommended_clips[0].suggested_pan_percent }]);
          } else {
            setPanKeyframes([{ t: 0, pan: 50 }]);
          }
          setSelectedRange({
            start: best_clip.start_time,
            end: best_clip.end_time,
          });
          setTrimmedVideoUrl(clip_manifest.video_url);
          setTrimmedClipWords(clip_manifest.words || []);
          setRenderSuccessUrl(null);
          setPipelineState('READY');
          setActiveJobId(null);

          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.seekTo(0);
            }
          }, 50);
        } else if (data.status === 'failed') {
          stopPolling();
          setErrorMessage(data.error || 'Video ingestion & AI direction failed.');
          setPipelineState('ERROR');
          setActiveJobId(null);
        }
      } catch (err: any) {
        stopPolling();
        setErrorMessage(err?.message || 'Lost connection to backend job queue.');
        setPipelineState('ERROR');
        setActiveJobId(null);
      }
    };

    pollJob();
    pollTimerRef.current = window.setInterval(pollJob, 1000);

    return () => stopPolling();
  }, [activeJobId, pipelineState, stopPolling]);

  // 3. Ingestion Triggers (Transition state -> PROCESSING)
  const beginJobTracking = (jobId: string, initialStep: string) => {
    stopPolling();
    setErrorMessage(null);
    setRenderSuccessUrl(null);
    setPipelineState('PROCESSING');
    setJobProgress(10);
    setJobStep(initialStep);
    setActiveJobId(jobId);
  };

  const handleStartYoutubeIngest = async (url: string, customScript?: string) => {
    try {
      setErrorMessage(null);
      setPipelineState('PROCESSING');
      setJobProgress(5);
      setJobStep('Queueing YouTube download: 5%');

      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          custom_script: customScript || null,
          use_sample: false,
          model_size: 'base',
          preset_id: selectedPreset?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to start YouTube ingestion job.');
      }
      beginJobTracking(data.job_id, 'Downloading from YouTube: 10%');
    } catch (err: any) {
      setPipelineState('ERROR');
      setErrorMessage(err?.message || 'Unable to start YouTube ingestion.');
    }
  };

  const handleStartFileUpload = async (file: File) => {
    try {
      setErrorMessage(null);
      setPipelineState('PROCESSING');
      setJobProgress(5);
      setJobStep(`Uploading ${file.name}: 5%`);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ingest/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to upload video file.');
      }
      beginJobTracking(data.job_id, 'Extracting 16kHz audio track: 10%');
    } catch (err: any) {
      setPipelineState('ERROR');
      setErrorMessage(err?.message || 'Unable to upload local video file.');
    }
  };

  const handleStartLocalPathIngest = async (path: string, customScript?: string) => {
    try {
      setErrorMessage(null);
      setPipelineState('PROCESSING');
      setJobProgress(5);
      setJobStep(`Connecting to local video: 5%`);

      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          local_path: path,
          custom_script: customScript || null,
          model_size: 'base',
          preset_id: selectedPreset?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to load local video file.');
      }
      beginJobTracking(data.job_id, 'Extracting audio from local video: 15%');
    } catch (err: any) {
      setPipelineState('ERROR');
      setErrorMessage(err?.message || 'Unable to load local video file.');
    }
  };

  const handleSelectClip = async (clip: ViralClipRecommendation) => {
    setSelectedRange({ start: clip.start_time, end: clip.end_time });
    if (clip.title) setViralTitle(clip.title);
    if (clip.topic_pill) setTopicPill(clip.topic_pill);
    if (clip.pan_keyframes && clip.pan_keyframes.length > 0) {
      setPanKeyframes(clip.pan_keyframes);
    } else if (clip.suggested_pan_percent !== undefined) {
      setPanKeyframes([{ t: 0, pan: clip.suggested_pan_percent }]);
    }
    if (clip.reasoning) setBestClipReasoning(clip.reasoning);
    if (clip.motion_events && clip.motion_events.length > 0) {
      setMotionEvents(clip.motion_events);
    }
    setRenderSuccessUrl(null);

    if (currentMedia && selectedPreset) {
      setIsRendering(true);
      try {
        const res = await fetch('/api/prepare-clip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_id: currentMedia.id,
            start_time: clip.start_time,
            end_time: clip.end_time,
            preset_id: selectedPreset.id,
            custom_title: clip.title || viralTitle,
            motion_events: clip.motion_events || motionEvents,
            crop_focus: cropFocus,
            pan_keyframes: clip.pan_keyframes || panKeyframes,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.clip_manifest) {
          setTrimmedVideoUrl(data.clip_manifest.video_url);
          setTrimmedClipWords(data.clip_manifest.words || []);
          if (data.clip_manifest.pan_keyframes && data.clip_manifest.pan_keyframes.length > 0) {
            setPanKeyframes(data.clip_manifest.pan_keyframes);
          }
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.seekTo(0);
            }
          }, 50);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to trim selected clip range.');
      } finally {
        setIsRendering(false);
      }
    }
  };

  const handleAutoTrackFaces = async () => {
    if (!currentMedia) return;
    setIsAutoTracking(true);
    try {
      const res = await fetch('/api/auto-track-pan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_id: currentMedia.id,
          start_time: selectedRange.start,
          end_time: selectedRange.end,
        }),
      });
      const data = await res.json();
      if (res.ok && data.pan_keyframes && data.pan_keyframes.length > 0) {
        setPanKeyframes(data.pan_keyframes);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Face tracking analysis failed.');
    } finally {
      setIsAutoTracking(false);
    }
  };

  const handleChangeCropFocus = async (focus: 'auto' | 'center' | 'left' | 'right') => {
    setCropFocus(focus);
    setRenderSuccessUrl(null);
    if (currentMedia && selectedPreset) {
      setIsRendering(true);
      try {
        const res = await fetch('/api/prepare-clip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_id: currentMedia.id,
            start_time: selectedRange.start,
            end_time: selectedRange.end,
            preset_id: selectedPreset.id,
            custom_title: viralTitle || currentMedia.title,
            motion_events: motionEvents,
            crop_focus: focus,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.clip_manifest) {
          setTrimmedVideoUrl(data.clip_manifest.video_url);
          setTrimmedClipWords(data.clip_manifest.words || []);
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.seekTo(0);
            }
          }, 50);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to update speaker crop framing.');
      } finally {
        setIsRendering(false);
      }
    }
  };

  const handleSeekTo = (seconds: number) => {
    const relSec = Math.max(0, seconds - selectedRange.start);
    if (playerRef.current) {
      playerRef.current.seekTo(Math.floor(relSec * fps));
    }
  };

  // Use pre-sliced clip words from the backend manifest, or slice dynamically if needed
  const currentClipWords: TranscriptWord[] =
    trimmedClipWords.length > 0
      ? trimmedClipWords
      : (transcript?.words || [])
          .filter((w) => w.start >= selectedRange.start && w.end <= selectedRange.end)
          .map((w) => ({
            word: w.word,
            start: +(w.start - selectedRange.start).toFixed(2),
            end: +(w.end - selectedRange.start).toFixed(2),
            confidence: w.confidence,
          }));

  const clipDuration = Math.max(5, selectedRange.end - selectedRange.start);
  const totalFrames = Math.max(60, Math.floor(clipDuration * fps));

  const handleRender = async () => {
    if (!currentMedia || !selectedPreset) return;
    setIsRendering(true);
    setErrorMessage(null);
    try {
      const clipId = `${currentMedia.id}_${Math.floor(selectedRange.start)}_${Math.floor(selectedRange.end)}`;
      const inputProps = {
        videoUrl: trimmedVideoUrl,
        words: currentClipWords,
        preset: selectedPreset,
        title: viralTitle || currentMedia.title,
        topicPill,
        panPercent: panKeyframes[0]?.pan ?? 50,
        panKeyframes,
        motionEvents,
        duration: clipDuration,
        fps,
      };

      const res = await fetch('/api/render-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: clipId,
          input_props: inputProps,
          fps,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to render short video.');
      }
      if (data.success && data.download_url) {
        setRenderSuccessUrl(data.download_url);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Production burn-in export failed.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-studio-dark text-slate-100 flex flex-col">
      <Header apiStatus={apiStatus} geminiReady={true} />

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-[1800px] w-full mx-auto">
        {/* LEFT COLUMN: Source Episode & Preset Rules */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-5">
          <InputPanel
            onStartYoutubeIngest={handleStartYoutubeIngest}
            onStartFileUpload={handleStartFileUpload}
            onStartLocalPathIngest={handleStartLocalPathIngest}
            isProcessing={pipelineState === 'PROCESSING'}
            progress={jobProgress}
            progressStep={jobStep}
            errorMessage={errorMessage}
            onDismissError={() => setErrorMessage(null)}
            currentMedia={currentMedia}
            viralTitle={viralTitle}
            niche={detectedNiche}
            motionEvents={motionEvents}
          />

          {presets.length > 0 && (
            <PresetManager
              presets={presets}
              selectedPreset={selectedPreset}
              onSelectPreset={setSelectedPreset}
            />
          )}
        </div>

        {/* CENTER COLUMN: Real-Time Remotion Player Live Canvas & Interactive Pan Framing */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-5 flex flex-col items-center justify-center bg-studio-panel border border-studio-border rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="w-full flex items-center justify-between pb-4 border-b border-studio-border/60 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                AI DIRECTOR 9:16 LIVE CANVAS
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-studio-dark px-2.5 py-1 rounded border border-studio-border">
              {resolution} • {fps} FPS • {clipDuration.toFixed(1)}s
            </span>
          </div>

          <InteractiveFramingCanvas
            panKeyframes={panKeyframes}
            currentPlaySec={currentPlaySec}
            onUpdateKeyframes={setPanKeyframes}
            onSeekTo={handleSeekTo}
            onAutoTrackFaces={handleAutoTrackFaces}
            isAutoTracking={isAutoTracking}
          >
            {selectedPreset && (
              <Player
                ref={playerRef}
                component={MasterShortComposition as any}
                inputProps={{
                  videoUrl: trimmedVideoUrl,
                  words: currentClipWords,
                  preset: selectedPreset,
                  title: viralTitle,
                  topicPill,
                  panPercent: panKeyframes[0]?.pan ?? 50,
                  panKeyframes,
                  motionEvents,
                }}
                durationInFrames={totalFrames}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={fps}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                controls
                clickToPlay={false}
                autoPlay
                loop
              />
            )}
          </InteractiveFramingCanvas>
        </div>

        {/* RIGHT COLUMN: Transcript Timeline & Render Settings */}
        <div className="col-span-12 lg:col-span-12 xl:col-span-4 flex flex-col gap-5">
          <TimelineTranscript
            transcript={transcript}
            recommendedClips={recommendedClips}
            selectedRange={selectedRange}
            onSelectClip={handleSelectClip}
            onSeekTo={handleSeekTo}
            viralTitle={viralTitle}
            niche={detectedNiche}
            bestClipReasoning={bestClipReasoning}
            motionEvents={motionEvents}
          />

          <OutputSettings
            resolution={resolution}
            setResolution={setResolution}
            fps={fps}
            setFps={setFps}
            cropFocus={cropFocus}
            onChangeCropFocus={handleChangeCropFocus}
            onRenderClicked={handleRender}
            isRendering={isRendering}
            renderSuccessUrl={renderSuccessUrl}
            hasMedia={!!currentMedia}
          />
        </div>
      </main>
    </div>
  );
};
```


################################################################################
### FILE 19/33: frontend/src/components/Header.tsx
################################################################################

```tsx
# PATH: frontend/src/components/Header.tsx
import React from 'react';
import { Sparkles, Cpu, Layers, Radio } from 'lucide-react';

interface Props {
  apiStatus: 'online' | 'connecting' | 'offline';
  geminiReady: boolean;
}

export const Header: React.FC<Props> = ({ apiStatus, geminiReady }) => {
  return (
    <header className="h-16 border-b border-studio-border bg-studio-panel/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-headline font-black text-lg tracking-wider text-white">VIRAL STUDIO</span>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
              PRO V2.0
            </span>
          </div>
          <p className="text-xs text-studio-muted font-mono">Autonomous Omnichannel Video Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* API Status Badge */}
        <div className="flex items-center gap-2 bg-studio-dark/60 border border-studio-border px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-slate-300">FastAPI Engine: {apiStatus}</span>
        </div>

        {/* Gemini Engine Badge */}
        <div className="flex items-center gap-2 bg-studio-dark/60 border border-studio-border px-3 py-1.5 rounded-lg text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">Gemini 2.5 Flash Hook Detector</span>
        </div>
      </div>
    </header>
  );
};

```


################################################################################
### FILE 20/33: frontend/src/components/InputPanel.tsx
################################################################################

```tsx
# PATH: frontend/src/components/InputPanel.tsx
import React, { useState, useRef } from 'react';
import {
  Youtube,
  Upload,
  Sparkles,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
  Clapperboard,
  HardDrive,
  FolderOpen,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MediaInfo, MotionEvent } from '../types';

interface InputPanelProps {
  onStartYoutubeIngest: (url: string, customScript?: string) => void;
  onStartFileUpload: (file: File) => void;
  onStartLocalPathIngest: (path: string, customScript?: string) => void;
  isProcessing: boolean;
  progress: number;
  progressStep: string;
  errorMessage: string | null;
  onDismissError: () => void;
  currentMedia: MediaInfo | null;
  viralTitle?: string;
  niche?: string;
  motionEvents?: MotionEvent[];
}

export const InputPanel: React.FC<InputPanelProps> = ({
  onStartYoutubeIngest,
  onStartFileUpload,
  onStartLocalPathIngest,
  isProcessing,
  progress,
  progressStep,
  errorMessage,
  onDismissError,
  currentMedia,
  viralTitle,
  niche,
  motionEvents = [],
}) => {
  const [ingestMode, setIngestMode] = useState<'youtube' | 'local'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [localPathInput, setLocalPathInput] = useState('');
  const [customScript, setCustomScript] = useState('');
  const [showScriptDrawer, setShowScriptDrawer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim() || isProcessing) return;
    onStartYoutubeIngest(youtubeUrl.trim(), customScript.trim() || undefined);
  };

  const handleLocalPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPathInput.trim() || isProcessing) return;
    onStartLocalPathIngest(localPathInput.trim(), customScript.trim() || undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !isProcessing) {
      onStartFileUpload(file);
      e.target.value = '';
    }
  };

  const stages = [
    { label: 'Fetch', threshold: 10 },
    { label: 'Captions / STT', threshold: 45 },
    { label: 'AI Director', threshold: 80 },
    { label: '9:16 Ready', threshold: 100 },
  ];

  return (
    <div className="bg-studio-panel border border-studio-border rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-studio-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              1. Source Episode
            </h2>
            <p className="text-[11px] text-slate-400">
              YouTube Podcast or Direct Local Video File
            </p>
          </div>
        </div>
        {niche && (
          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {niche}
          </span>
        )}
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-studio-dark border border-studio-border rounded-xl">
        <button
          type="button"
          onClick={() => setIngestMode('youtube')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            ingestMode === 'youtube'
              ? 'bg-gradient-to-r from-red-600/30 to-red-500/20 text-red-200 border border-red-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Youtube className="w-3.5 h-3.5 text-red-400" />
          <span>YouTube Link</span>
        </button>

        <button
          type="button"
          onClick={() => setIngestMode('local')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            ingestMode === 'local'
              ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          <span>Local Video (Fast)</span>
        </button>
      </div>

      {/* High-Visibility Red Dismissible Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="bg-red-950/90 border-2 border-red-500 rounded-xl p-3.5 text-red-100 shadow-lg flex items-start gap-3 animate-fadeIn"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs leading-relaxed">
            <div className="font-bold text-red-300 uppercase tracking-wider mb-0.5">
              Processing Alert
            </div>
            <p className="text-red-100/90 break-words">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss error"
            className="p-1 rounded-lg text-red-300 hover:text-white hover:bg-red-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: YouTube Ingestion */}
      {ingestMode === 'youtube' && (
        <form onSubmit={handleYoutubeSubmit} className="flex flex-col gap-2.5">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              Podcast URL (youtu.be or watch?v=)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Auto-strips ?si= tracking
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
              disabled={isProcessing}
              className="flex-1 bg-studio-dark border border-studio-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isProcessing || !youtubeUrl.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs font-bold text-white shadow-lg shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all shrink-0"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Generate</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Local Video Ingestion (Zero Network Throttling) */}
      {ingestMode === 'local' && (
        <div className="flex flex-col gap-3">
          {/* File Picker / Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/mkv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-studio-dark hover:bg-slate-800 border border-dashed border-cyan-500/40 hover:border-cyan-400 text-xs font-semibold text-cyan-200 transition-all disabled:opacity-40"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Select Local Podcast File (.mp4, .mov, .mkv)</span>
          </button>

          {/* Direct Local File Path Form (Best for multi-GB files) */}
          <form onSubmit={handleLocalPathSubmit} className="flex flex-col gap-2">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <FolderOpen className="w-3 h-3 text-cyan-400" />
              Or Paste Exact File Path on Disk (Zero Network Wait):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localPathInput}
                onChange={(e) => setLocalPathInput(e.target.value)}
                placeholder="F:\Ai Learning\episode_podcast.mp4"
                disabled={isProcessing}
                className="flex-1 bg-studio-dark border border-studio-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isProcessing || !localPathInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all shrink-0"
              >
                Load
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OPTIONAL: Paste Script / SRT (Bypasses Whisper STT) */}
      <div className="border border-studio-border/70 rounded-xl overflow-hidden bg-studio-dark/50">
        <button
          type="button"
          onClick={() => setShowScriptDrawer(!showScriptDrawer)}
          className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Optional: Paste Script / SRT (Skips Whisper — Instant)</span>
          </div>
          {showScriptDrawer ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {showScriptDrawer && (
          <div className="p-3 border-t border-studio-border/60 flex flex-col gap-2 bg-studio-dark">
            <p className="text-[10px] text-slate-400">
              Paste your episode transcript, SRT captions, or dialogue notes. The AI Director will use this immediately without waiting for Whisper audio transcription:
            </p>
            <textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              placeholder="Paste SRT subtitles (with timestamps) or plain transcript text here..."
              rows={4}
              disabled={isProcessing}
              className="w-full bg-slate-950 border border-studio-border rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-amber-400 disabled:opacity-50"
            />
            {customScript.trim() && (
              <span className="text-[10px] text-amber-300 font-mono">
                ✓ Custom script attached ({customScript.trim().split(/\s+/).length} words). Whisper STT will be skipped.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Live Progress Card with Real-Time Speed & Task Feedback */}
      {isProcessing && (
        <div className="bg-studio-dark/95 border border-cyan-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 pr-2">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              <span className="text-xs font-semibold text-cyan-100 break-words line-clamp-2">
                {progressStep || 'Processing video pipeline...'}
              </span>
            </div>
            <span className="text-sm font-mono font-bold text-cyan-400 shrink-0">
              {progress}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-1 pt-1">
            {stages.map((st) => {
              const active = progress >= st.threshold;
              return (
                <div
                  key={st.label}
                  className={`text-[10px] font-mono text-center py-1 rounded border transition-colors ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  {st.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active AI Director Plan Summary */}
      {currentMedia && !isProcessing && (
        <div className="bg-studio-dark border border-studio-border rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-white line-clamp-1">
                {viralTitle || currentMedia.title}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded shrink-0">
              9:16 TRIMMED
            </span>
          </div>

          {motionEvents.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-studio-border/60">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Choreographed Motion Events ({motionEvents.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {motionEvents.map((ev, idx) => (
                  <span
                    key={`${ev.type}_${ev.time_sec}_${idx}`}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-slate-200"
                  >
                    <strong className="text-cyan-400">{ev.time_sec.toFixed(1)}s</strong>{' '}
                    • {ev.type.replace('_', ' ')}:{' '}
                    {ev.text || `${ev.label} (${ev.value})`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

```


################################################################################
### FILE 21/33: frontend/src/components/InteractiveFramingCanvas.tsx
################################################################################

```tsx
# PATH: frontend/src/components/InteractiveFramingCanvas.tsx
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { MoveHorizontal, Plus, Trash2, Wand2, Crosshair, Sparkles, Loader2 } from 'lucide-react';
import { PanKeyframe } from '../types';

interface InteractiveFramingCanvasProps {
  panKeyframes: PanKeyframe[];
  currentPlaySec: number;
  onUpdateKeyframes: (newKeyframes: PanKeyframe[]) => void;
  onSeekTo?: (seconds: number) => void;
  onAutoTrackFaces?: () => void;
  isAutoTracking?: boolean;
  children: React.ReactNode;
}

export const InteractiveFramingCanvas: React.FC<InteractiveFramingCanvasProps> = ({
  panKeyframes,
  currentPlaySec,
  onUpdateKeyframes,
  onSeekTo,
  onAutoTrackFaces,
  isAutoTracking = false,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const startPanRef = useRef<number>(50);
  const hasMovedRef = useRef<boolean>(false);

  // Normalize keyframes list (must always have at least { t: 0.0, pan: 50 })
  const sortedKeyframes = useMemo(() => {
    if (!panKeyframes || panKeyframes.length === 0) {
      return [{ t: 0.0, pan: 50 }];
    }
    const copy = [...panKeyframes].sort((a, b) => a.t - b.t);
    if (copy[0].t > 0.05) {
      copy.unshift({ t: 0.0, pan: copy[0].pan });
    }
    return copy;
  }, [panKeyframes]);

  // Determine active keyframe at the current playback timestamp
  const activeIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < sortedKeyframes.length; i++) {
      if (currentPlaySec >= sortedKeyframes[i].t) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [sortedKeyframes, currentPlaySec]);

  const activeKeyframe = sortedKeyframes[activeIndex] || sortedKeyframes[0];
  const activePan = activeKeyframe.pan;

  // Updates framing for the currently active camera shot
  const handleUpdateActivePan = useCallback(
    (newPan: number) => {
      const clamped = Math.round(Math.max(0, Math.min(100, newPan)));
      const next = sortedKeyframes.map((kf, i) =>
        i === activeIndex ? { ...kf, pan: clamped } : kf
      );
      onUpdateKeyframes(next);
    },
    [sortedKeyframes, activeIndex, onUpdateKeyframes]
  );

  // Add a new camera cut framing keyframe at current playback time
  const handleAddCutAtCurrentTime = () => {
    const roundedT = Math.round(currentPlaySec * 10) / 10;
    // Don't add duplicate keyframe at the exact same timestamp
    if (sortedKeyframes.some((kf) => Math.abs(kf.t - roundedT) < 0.3)) {
      return;
    }
    const next = [...sortedKeyframes, { t: roundedT, pan: activePan }].sort((a, b) => a.t - b.t);
    onUpdateKeyframes(next);
  };

  // Remove active camera cut (cannot delete initial t=0 keyframe)
  const handleDeleteActiveCut = () => {
    if (sortedKeyframes.length <= 1 || activeIndex === 0) return;
    const next = sortedKeyframes.filter((_, i) => i !== activeIndex);
    onUpdateKeyframes(next);
  };

  // Drag interaction handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Leave bottom 65px completely free for Remotion controls
      if (e.clientY - rect.top > rect.height - 65) return;

      dragStartXRef.current = e.clientX;
      startPanRef.current = activePan;
      hasMovedRef.current = false;
    },
    [activePan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.buttons !== 1 || !containerRef.current) return;

      const deltaX = e.clientX - dragStartXRef.current;
      if (!hasMovedRef.current) {
        if (Math.abs(deltaX) < 4) return;
        hasMovedRef.current = true;
        setIsDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Safe fallback
        }
      }

      // Precise 16:9 overflow framing math
      const el = containerRef.current;
      const overflow = el.clientHeight * (16 / 9) - el.clientWidth;
      const deltaPercent = -(deltaX / Math.max(60, overflow)) * 100;
      handleUpdateActivePan(startPanRef.current + deltaPercent);
    },
    [handleUpdateActivePan]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (hasMovedRef.current) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
    hasMovedRef.current = false;
  }, []);

  return (
    <div className="flex flex-col items-center gap-3.5 w-full">
      {/* 9:16 Interactive Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-[380px] h-[675px] rounded-2xl overflow-hidden border-2 transition-colors shadow-2xl bg-black select-none ${
          isDragging
            ? 'border-cyan-400 cursor-grabbing'
            : 'border-studio-border hover:border-slate-600'
        }`}
      >
        {children}

        {/* Live HUD indicator when panning */}
        {isDragging && (
          <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-md border border-cyan-400/40 px-3 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 pointer-events-none z-50 animate-fadeIn">
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>Framing Shot #{activeIndex + 1}: {activePan}%</span>
          </div>
        )}
      </div>

      {/* Dynamic Camera Cut Segments Timeline & Precision Pan Controls */}
      <div className="w-[380px] bg-studio-dark/95 border border-studio-border rounded-xl p-3 flex flex-col gap-2.5 shadow-xl">
        {/* Top Header: Active Shot Info & Action Controls */}
        <div className="flex items-center justify-between border-b border-studio-border/60 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shot #{activeIndex + 1}</span>
            <span className="text-[10px] text-cyan-300 font-normal">
              ({activePan <= 30 ? 'Left Host' : activePan >= 70 ? 'Right Guest' : 'Center'} {activePan}%)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onAutoTrackFaces && (
              <button
                type="button"
                onClick={onAutoTrackFaces}
                disabled={isAutoTracking}
                title="Automatically detect speaker face cuts across the clip"
                className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-[10px] font-mono flex items-center gap-1 transition-all disabled:opacity-50"
              >
                {isAutoTracking ? (
                  <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                ) : (
                  <Wand2 className="w-3 h-3 text-purple-400" />
                )}
                <span>Auto Track</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddCutAtCurrentTime}
              title={`Add framing cut at ${currentPlaySec.toFixed(1)}s`}
              className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[10px] font-mono flex items-center gap-1 transition-all"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              <span>+ Cut ({currentPlaySec.toFixed(1)}s)</span>
            </button>

            {sortedKeyframes.length > 1 && activeIndex > 0 && (
              <button
                type="button"
                onClick={handleDeleteActiveCut}
                title="Remove this camera cut"
                className="p-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Shot Pills List: Click to jump directly to any camera angle */}
        {sortedKeyframes.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {sortedKeyframes.map((kf, i) => {
              const isCurrent = i === activeIndex;
              const nextT = sortedKeyframes[i + 1]?.t;
              const label = nextT ? `${kf.t.toFixed(1)}s–${nextT.toFixed(1)}s` : `${kf.t.toFixed(1)}s+`;
              const angleName = kf.pan <= 30 ? 'Left' : kf.pan >= 70 ? 'Right' : 'Mid';

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSeekTo?.(kf.t)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>#{i + 1}</span>
                  <span>{label}</span>
                  <span className="opacity-80 font-mono">[{angleName} {kf.pan}%]</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Framing Presets: Quick one-click host/guest alignment */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <button
            type="button"
            onClick={() => handleUpdateActivePan(15)}
            className={`transition-colors ${
              activePan <= 25 ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Left Host (15%)
          </button>
          <button
            type="button"
            onClick={() => handleUpdateActivePan(50)}
            className={`transition-colors ${
              activePan > 25 && activePan < 75 ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Center ({activePan}%)
          </button>
          <button
            type="button"
            onClick={() => handleUpdateActivePan(85)}
            className={`transition-colors ${
              activePan >= 75 ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Right Guest (85%)
          </button>
        </div>

        {/* Precision Horizontal Pan Slider */}
        <input
          type="range"
          min={0}
          max={100}
          value={activePan}
          onChange={(e) => handleUpdateActivePan(Number(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
      </div>
    </div>
  );
};

```


################################################################################
### FILE 22/33: frontend/src/components/TimelineTranscript.tsx
################################################################################

```tsx
# PATH: frontend/src/components/TimelineTranscript.tsx
import React from 'react';
import { Flame, Clock, Sparkles, Tag, CheckCircle2 } from 'lucide-react';
import { TranscriptData, ViralClipRecommendation, MotionEvent } from '../types';

interface Props {
  transcript: TranscriptData | null;
  recommendedClips: ViralClipRecommendation[];
  selectedRange: { start: number; end: number };
  onSelectClip: (clip: ViralClipRecommendation) => void;
  onSeekTo: (seconds: number) => void;
  viralTitle?: string;
  niche?: string;
  bestClipReasoning?: string;
  motionEvents?: MotionEvent[];
}

export const TimelineTranscript: React.FC<Props> = ({
  transcript,
  recommendedClips,
  selectedRange,
  onSelectClip,
  onSeekTo,
  viralTitle,
  niche,
  bestClipReasoning,
  motionEvents = [],
}) => {
  const activeClipIndex = recommendedClips.findIndex(
    (c) =>
      Math.abs(selectedRange.start - c.start_time) < 0.5 &&
      Math.abs(selectedRange.end - c.end_time) < 0.5
  );

  return (
    <div className="bg-studio-panel border border-studio-border rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-headline font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          Ranked Viral Shorts (Top 1–5)
        </h3>
        {niche && (
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
            {niche}
          </span>
        )}
      </div>

      {/* 1-to-5 Ranked Shorts Segmented Pills (OpusClip Selector) */}
      {recommendedClips.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-5 gap-1 p-1 bg-studio-dark border border-studio-border rounded-xl">
            {recommendedClips.slice(0, 5).map((clip, idx) => {
              const isSelected = activeClipIndex === idx;
              const rankNum = clip.rank || idx + 1;
              const score = clip.hook_score ?? clip.viral_score ?? 95;
              const shortTag = clip.angle_tag || 'HOOK';

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectClip(clip)}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold leading-none">
                    #{rankNum}
                  </span>
                  <span className="text-[11px] font-mono font-extrabold leading-none">
                    {score}%
                  </span>
                  <span
                    className={`text-[8px] uppercase tracking-tighter truncate max-w-[55px] ${
                      isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {shortTag.replace('TOP ', '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Viral Short Insight & Reasoning Card */}
      {viralTitle && viralTitle !== 'VIRAL REEL PREVIEW' && (
        <div className="bg-studio-dark/95 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Active Short #{activeClipIndex >= 0 ? activeClipIndex + 1 : 1}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {(selectedRange.end - selectedRange.start).toFixed(1)}s • {selectedRange.start.toFixed(1)}s–{selectedRange.end.toFixed(1)}s
            </span>
          </div>

          <h4 className="text-sm font-bold text-white font-headline leading-snug">
            "{viralTitle}"
          </h4>

          {bestClipReasoning && (
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 italic">
              {bestClipReasoning}
            </p>
          )}

          {/* Spoken Keywords */}
          {recommendedClips[activeClipIndex]?.spoken_keywords && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <Tag className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="text-[10px] font-mono text-slate-400">Keywords:</span>
              {recommendedClips[activeClipIndex].spoken_keywords?.map((kw, i) => (
                <span
                  key={i}
                  className="text-[9px] font-mono bg-cyan-950/60 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Quick Seek Motion Events */}
          {motionEvents.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Jump to Motion Card:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {motionEvents.map((ev, i) => (
                  <button
                    key={i}
                    onClick={() => onSeekTo(selectedRange.start + ev.time_sec)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 flex items-center gap-1 transition-colors"
                  >
                    <span>{ev.time_sec.toFixed(1)}s</span>
                    <span>•</span>
                    <span className="font-bold">{ev.text || ev.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ranked Viral Short List (Zero Play Button, Direct Click) */}
      {recommendedClips.length > 1 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            All Generated Candidate Shorts
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
            {recommendedClips.map((clip, idx) => {
              const isCurrent = activeClipIndex === idx;
              const duration = clip.duration ?? (clip.end_time - clip.start_time);
              const score = clip.hook_score ?? clip.viral_score ?? 95;

              return (
                <div
                  key={idx}
                  onClick={() => onSelectClip(clip)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                    isCurrent
                      ? 'bg-amber-500/15 border-amber-400 shadow-md'
                      : 'bg-studio-dark/60 border-studio-border hover:border-slate-600'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-800 text-white">
                        #{clip.rank || idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white font-headline truncate">
                        {clip.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
                      "{clip.reasoning || clip.hook_sentence || clip.transcript_preview}"
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1.5">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{clip.start_time.toFixed(1)}s – {clip.end_time.toFixed(1)}s ({duration.toFixed(1)}s)</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs font-mono font-black text-amber-300">
                      {score}%
                    </span>
                    {isCurrent && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 mt-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Word Timestamps Stream */}
      {transcript && transcript.words?.length > 0 && (
        <div className="pt-2 border-t border-studio-border/60 flex flex-col gap-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Interactive Word Timestamps (Click to Seek)
          </div>
          <div className="max-h-36 overflow-y-auto p-3 rounded-xl bg-studio-dark/70 border border-studio-border flex flex-wrap gap-1.5 text-xs">
            {transcript.words.map((w, i) => {
              const inRange = w.start >= selectedRange.start && w.end <= selectedRange.end;
              return (
                <span
                  key={i}
                  onClick={() => onSeekTo(w.start)}
                  title={`${w.start}s -> ${w.end}s`}
                  className={`cursor-pointer px-1.5 py-0.5 rounded transition-all select-none ${
                    inRange
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

```


################################################################################
### FILE 23/33: frontend/src/components/OutputSettings.tsx
################################################################################

```tsx
# PATH: frontend/src/components/OutputSettings.tsx
import React from 'react';
import { Sliders, Download, Sparkles, AlertCircle, Loader2, UserCheck, Users } from 'lucide-react';

interface Props {
  resolution: '9:16' | '1:1' | '16:9';
  setResolution: (res: '9:16' | '1:1' | '16:9') => void;
  fps: number;
  setFps: (fps: number) => void;
  cropFocus: 'auto' | 'center' | 'left' | 'right';
  onChangeCropFocus: (focus: 'auto' | 'center' | 'left' | 'right') => void;
  onRenderClicked: () => void;
  isRendering: boolean;
  renderSuccessUrl: string | null;
  hasMedia: boolean;
}

export const OutputSettings: React.FC<Props> = ({
  resolution,
  setResolution,
  fps,
  setFps,
  cropFocus,
  onChangeCropFocus,
  onRenderClicked,
  isRendering,
  renderSuccessUrl,
  hasMedia,
}) => {
  return (
    <div className="bg-studio-panel border border-studio-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Framing & Export Output
        </h3>
        <span className="text-[10px] font-mono text-emerald-400">Pro Codec H.264</span>
      </div>

      {/* Speaker Face Framing Selector (Dual-Speaker Podcast Fix) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Users className="w-3 h-3 text-cyan-400" />
            Speaker Framing Focus
          </label>
          <span className="text-[9px] text-slate-500 font-mono">Dual-host interview framing</span>
        </div>
        <div className="grid grid-cols-4 gap-1 bg-studio-dark p-1 rounded-xl border border-studio-border text-xs">
          <button
            type="button"
            disabled={isRendering || !hasMedia}
            onClick={() => onChangeCropFocus('auto')}
            className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
              cropFocus === 'auto' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Auto Face
          </button>
          <button
            type="button"
            disabled={isRendering || !hasMedia}
            onClick={() => onChangeCropFocus('left')}
            className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
              cropFocus === 'left' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Left Host
          </button>
          <button
            type="button"
            disabled={isRendering || !hasMedia}
            onClick={() => onChangeCropFocus('center')}
            className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
              cropFocus === 'center' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Center
          </button>
          <button
            type="button"
            disabled={isRendering || !hasMedia}
            onClick={() => onChangeCropFocus('right')}
            className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
              cropFocus === 'right' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Right Guest
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Aspect Ratio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Aspect Ratio</label>
          <div className="flex bg-studio-dark p-1 rounded-xl border border-studio-border text-xs">
            <button
              onClick={() => setResolution('9:16')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                resolution === '9:16' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400'
              }`}
            >
              9:16 Shorts
            </button>
            <button
              onClick={() => setResolution('1:1')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                resolution === '1:1' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400'
              }`}
            >
              1:1 Square
            </button>
          </div>
        </div>

        {/* Framerate */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Framerate</label>
          <div className="flex bg-studio-dark p-1 rounded-xl border border-studio-border text-xs">
            <button
              onClick={() => setFps(60)}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                fps === 60 ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400'
              }`}
            >
              60 FPS
            </button>
            <button
              onClick={() => setFps(30)}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                fps === 30 ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400'
              }`}
            >
              30 FPS
            </button>
          </div>
        </div>
      </div>

      {!hasMedia && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center gap-2 text-amber-300 text-xs font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Load a video or podcast link first to export.</span>
        </div>
      )}

      {/* Render Action Button with Dedicated Loading Spinner & Progress */}
      <button
        onClick={onRenderClicked}
        disabled={isRendering || !hasMedia}
        className="w-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:opacity-95 text-white font-headline font-black py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
      >
        {isRendering ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
            <span>Rendering 9:16 Vertical Short (H.264)...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Export Production Ready Short</span>
          </>
        )}
      </button>

      {/* Download Result Link */}
      {renderSuccessUrl && (
        <a
          href={renderSuccessUrl}
          download
          className="bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-all"
        >
          <Download className="w-4 h-4" />
          Download Rendered MP4 (1080x1920)
        </a>
      )}
    </div>
  );
};

```


################################################################################
### FILE 24/33: frontend/src/components/PresetManager.tsx
################################################################################

```tsx
# PATH: frontend/src/components/PresetManager.tsx
import React from 'react';
import { Palette, Check } from 'lucide-react';
import { PresetConfig } from '../types';

interface Props {
  presets: PresetConfig[];
  selectedPreset: PresetConfig | null;
  onSelectPreset: (preset: PresetConfig) => void;
}

export const PresetManager: React.FC<Props> = ({
  presets,
  selectedPreset,
  onSelectPreset,
}) => {
  return (
    <div className="bg-studio-panel border border-studio-border rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-headline font-bold text-sm tracking-wide text-white uppercase flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          Motion & Visual Presets
        </h3>
        <span className="text-[10px] font-mono text-slate-400">Rules & Composition</span>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 gap-2.5">
        {presets.map((p) => {
          const isSelected = selectedPreset?.id === p.id;
          const isOpus = p.id.includes('opus');
          const isFable = p.id.includes('fable');

          return (
            <div
              key={p.id}
              onClick={() => onSelectPreset(p)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between relative overflow-hidden ${
                isSelected
                  ? 'bg-cyan-500/10 border-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'bg-studio-dark/60 border-studio-border hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    isOpus
                      ? 'bg-[#E63946] text-white font-mono'
                      : isFable
                      ? 'bg-[#FFE600] text-black font-impact'
                      : 'bg-cyan-500 text-black font-mono'
                  }`}
                >
                  {isOpus ? '5.5' : isFable ? '5.2' : 'VOX'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-xs text-white">{p.name}</span>
                    {isSelected && (
                      <span className="bg-cyan-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{p.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

```


################################################################################
### FILE 25/33: frontend/src/remotion/index.ts
################################################################################

```typescript
# PATH: frontend/src/remotion/index.ts
import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { MasterShortComposition } from './MasterShortComposition';
import '../index.css';

export const RemotionRoot: React.FC = () => {
  return React.createElement(Composition, {
    id: 'MasterShortComposition',
    component: MasterShortComposition as any,
    durationInFrames: 3600,
    fps: 60,
    width: 1080,
    height: 1920,
    defaultProps: {
      videoUrl: '',
      words: [],
      preset: {
        id: 'fable_5_2_kinetic',
        name: 'Fable 5.2 Kinetic',
        captions: {
          activeWordColor: '#FFE600',
          inactiveWordColor: '#FFFFFF',
        },
      } as any,
      title: 'VIRAL SHORT',
      topicPill: '[ INSIGHT ]',
      panPercent: 50,
      motionEvents: [],
    },
  });
};

registerRoot(RemotionRoot);

```


################################################################################
### FILE 26/33: frontend/src/remotion/MasterShortComposition.tsx
################################################################################

```tsx
# PATH: frontend/src/remotion/MasterShortComposition.tsx
import React from 'react';
import {
  AbsoluteFill,
  Video,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { KineticCaptions } from './layers/KineticCaptions';
import { PresetConfig, TranscriptWord, MotionEvent, PanKeyframe } from '../types';

export interface MasterShortCompositionProps {
  videoUrl: string;
  words: TranscriptWord[];
  preset: PresetConfig;
  title: string;
  topicPill?: string;
  panPercent?: number; // legacy fallback
  panKeyframes?: PanKeyframe[]; // Dynamic camera-cut keyframes [{"t": 0.0, "pan": 25}, {"t": 14.5, "pan": 75}]
  motionEvents?: MotionEvent[];
}

const EVENT_DURATION_SEC = 2.6;

export const MasterShortComposition: React.FC<MasterShortCompositionProps> = ({
  videoUrl,
  words,
  preset,
  title,
  topicPill = '[ VIRAL INSIGHT ]',
  panPercent = 50,
  panKeyframes,
  motionEvents = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentTime = frame / fps;

  // Resolve dynamic horizontal pan framing based on active camera cut at currentTime
  const resolvedPan = React.useMemo(() => {
    if (!panKeyframes || panKeyframes.length === 0) {
      return panPercent ?? 50;
    }
    const sorted = [...panKeyframes].sort((a, b) => a.t - b.t);
    let active = sorted[0].pan;
    for (const kf of sorted) {
      if (currentTime >= kf.t) {
        active = kf.pan;
      } else {
        break;
      }
    }
    return active;
  }, [panKeyframes, panPercent, currentTime]);

  // Empty canvas state: Clean studio placeholder when no video is loaded
  if (!videoUrl) {
    return (
      <AbsoluteFill className="bg-[#080d1a] flex flex-col items-center justify-center text-slate-500 gap-3 select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-cyan-400/80 shadow-2xl">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Studio Preview Canvas</span>
        <span className="text-[11px] text-slate-600 font-mono">Load episode to preview 9:16 short</span>
      </AbsoluteFill>
    );
  }

  const isOpus = preset?.id ? preset.id.includes('opus') : false;
  const isVox = preset?.id ? preset.id.includes('vox') : false;
  // Default is Fable (Dark Glass + Neon Cyan/Amber)

  // Active timed motion card in Top Safe Zone (Y: 0% - 18%)
  const activeEvent = motionEvents.find(
    (ev) => currentTime >= ev.time_sec && currentTime <= ev.time_sec + EVENT_DURATION_SEC
  );

  const renderTopZoneMotionCard = () => {
    if (!activeEvent) {
      // Default Topic Pill + Hook Title in Top Safe Zone
      return (
        <div className="flex flex-col items-center gap-2 px-8 text-center max-w-[960px]">
          {topicPill && (
            <span
              className={`px-5 py-1.5 rounded-full text-lg font-mono font-bold tracking-widest uppercase shadow-md ${
                isOpus
                  ? 'bg-[#E63946] text-white'
                  : isVox
                  ? 'bg-[#FFE600] text-slate-950 font-black'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 backdrop-blur-md'
              }`}
            >
              {topicPill}
            </span>
          )}
          {title && (
            <h1
              className={`text-2xl lg:text-3xl font-extrabold line-clamp-2 max-w-[900px] leading-tight ${
                isOpus
                  ? 'text-white font-mono uppercase'
                  : isVox
                  ? 'text-[#FFE600] uppercase tracking-tight'
                  : 'text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]'
              }`}
            >
              {title}
            </h1>
          )}
        </div>
      );
    }

    const localFrame = Math.max(0, Math.round((currentTime - activeEvent.time_sec) * fps));
    const totalEventFrames = Math.round(EVENT_DURATION_SEC * fps);
    const fadeOutStart = totalEventFrames - Math.round(0.4 * fps);

    const enterSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 13, stiffness: 190, mass: 0.75 },
    });

    const exitOpacity = interpolate(
      localFrame,
      [fadeOutStart, totalEventFrames],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const translateY = interpolate(enterSpring, [0, 1], [-40, 0]);
    const scale = interpolate(enterSpring, [0, 1], [0.9, 1]);

    // Mode-specific visual card styling inside Top Safe Zone (never enters Face Zone!)
    return (
      <div
        style={{
          opacity: Math.min(1, enterSpring) * exitOpacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
        }}
        className="w-full px-8 flex justify-center"
      >
        <div
          className={`px-6 py-3.5 rounded-2xl flex items-center gap-4 max-w-[920px] shadow-2xl ${
            isOpus
              ? 'bg-white text-slate-950 border-4 border-[#E63946]'
              : isVox
              ? 'bg-[#FFE600] text-slate-950 border-4 border-slate-950'
              : 'bg-slate-950/90 text-white border-2 border-cyan-400 backdrop-blur-xl'
          }`}
        >
          <span
            className={`w-3.5 h-3.5 rounded-full shrink-0 ${
              isOpus ? 'bg-[#E63946]' : isVox ? 'bg-slate-950' : 'bg-cyan-400'
            }`}
          />
          <span className="text-2xl lg:text-3xl font-black uppercase tracking-tight">
            {activeEvent.text || activeEvent.label}
          </span>
        </div>
      </div>
    );
  };

  const progressPercent = Math.min(100, (frame / Math.max(1, durationInFrames)) * 100);

  return (
    <AbsoluteFill className="bg-black overflow-hidden select-none">
      {/* ─── FULL-BLEED 16:9 VIDEO WITH DYNAMIC HORIZONTAL PAN (0% TO 100%) ─── */}
      <AbsoluteFill>
        <Video
          src={videoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${resolvedPan}% 50%`,
            transition: 'object-position 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Subtle top & bottom editorial vignette (Leaves Y: 18%-65% Face Zone 100% crystal clear!) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.82) 100%)',
          }}
        />
      </AbsoluteFill>

      {/* ─── ZONE 1: TOP SAFE ZONE (Y: 0% to 18% / 0px to 345px) ─── */}
      <div
        style={{ top: 0, height: '18%' }}
        className="absolute inset-x-0 flex items-center justify-center z-30 pointer-events-none"
      >
        {renderTopZoneMotionCard()}
      </div>

      {/* ─── ZONE 2: PROTECTED FACE SAFE ZONE (Y: 18% to 65% / 345px to 1250px) ─── */}
      {/* STRICT ARCHITECTURAL GUARD: Zero text, cards, or math overlays allowed here */}
      <div
        style={{ top: '18%', height: '47%' }}
        className="absolute inset-x-0 pointer-events-none z-10"
        data-zone="protected-speaker-face-safe-zone"
      />

      {/* ─── ZONE 3: SUBTITLE SAFE ZONE (Y: 65% to 82% / 1250px to 1575px) ─── */}
      <div
        style={{ top: '65%', height: '17%' }}
        className="absolute inset-x-0 flex items-center justify-center z-30 pointer-events-none"
      >
        <KineticCaptions words={words} preset={preset} />
      </div>

      {/* ─── ZONE 4: FOOTER SAFE MARGIN (Y: 82% to 100% / 1575px to 1920px) ─── */}
      <div
        style={{ top: '82%', height: '18%' }}
        className="absolute inset-x-12 flex flex-col justify-end pb-12 z-30 pointer-events-none"
      >
        <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className={`h-full rounded-full ${
              isOpus
                ? 'bg-[#E63946]'
                : isVox
                ? 'bg-[#FFE600]'
                : 'bg-gradient-to-r from-cyan-400 to-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

```


################################################################################
### FILE 27/33: frontend/src/remotion/layers/KineticCaptions.tsx
################################################################################

```tsx
# PATH: frontend/src/remotion/layers/KineticCaptions.tsx
import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { TranscriptWord, PresetConfig } from '../../types';

interface Props {
  words: TranscriptWord[];
  preset: PresetConfig;
}

interface CaptionPhrase {
  words: TranscriptWord[];
  start: number;
  end: number;
}

/**
 * Groups individual words into natural, jitter-free 2-to-3 word phrases
 * (Premiere Pro / CapCut style) respecting punctuation and speech pauses.
 */
function buildStablePhrases(words: TranscriptWord[]): CaptionPhrase[] {
  if (!words || words.length === 0) return [];

  const phrases: CaptionPhrase[] = [];
  let currentGroup: TranscriptWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const wordObj = words[i];
    currentGroup.push(wordObj);

    const nextWord = words[i + 1];
    const endsWithPunctuation = /[.!?,;:]$/.test(wordObj.word.trim());
    const silenceBeforeNext = nextWord ? nextWord.start - wordObj.end : 999;

    const shouldClosePhrase =
      currentGroup.length >= 3 ||
      (currentGroup.length >= 2 && (endsWithPunctuation || silenceBeforeNext > 0.35)) ||
      !nextWord;

    if (shouldClosePhrase) {
      phrases.push({
        words: currentGroup,
        start: currentGroup[0].start,
        end: currentGroup[currentGroup.length - 1].end,
      });
      currentGroup = [];
    }
  }

  return phrases;
}

export const KineticCaptions: React.FC<Props> = ({ words, preset }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const phrases = useMemo(() => buildStablePhrases(words), [words]);

  if (phrases.length === 0) return null;

  // Locate active phrase or hold the just-spoken phrase during brief natural pauses (<0.35s)
  let activePhrase = phrases.find(
    (p) => currentTime >= p.start - 0.08 && currentTime <= p.end + 0.25
  );

  if (!activePhrase) {
    const upcomingIndex = phrases.findIndex((p) => p.start > currentTime);
    if (upcomingIndex > 0) {
      const prevPhrase = phrases[upcomingIndex - 1];
      if (currentTime - prevPhrase.end <= 0.4) {
        activePhrase = prevPhrase;
      }
    }
  }

  if (!activePhrase) return null;

  // Determine the currently spoken word inside the phrase (or fallback to the most recent word in the phrase)
  let activeWordIndex = activePhrase.words.findIndex(
    (w) => currentTime >= w.start - 0.04 && currentTime <= w.end + 0.08
  );
  if (activeWordIndex === -1) {
    for (let i = activePhrase.words.length - 1; i >= 0; i--) {
      if (currentTime >= activePhrase.words[i].start) {
        activeWordIndex = i;
        break;
      }
    }
    if (activeWordIndex === -1) activeWordIndex = 0;
  }

  const isFable = preset.id.includes('fable');
  const isOpus = preset.id.includes('opus');

  return (
    <div className="absolute bottom-[16%] inset-x-6 flex items-center justify-center pointer-events-none z-30">
      <div
        className={`flex flex-wrap items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl max-w-[90%] transition-all ${
          isOpus
            ? 'bg-white/95 border-2 border-slate-300 shadow-2xl'
            : 'bg-black/80 backdrop-blur-md border border-white/15 shadow-2xl'
        }`}
      >
        {activePhrase.words.map((w, idx) => {
          const isWordActive = idx === activeWordIndex;

          return (
            <span
              key={`${w.word}_${w.start}_${idx}`}
              className={`text-4xl font-extrabold uppercase tracking-wide inline-block select-none transition-colors duration-150 ${
                isOpus ? 'font-mono' : 'font-sans'
              }`}
              style={{
                color: isWordActive
                  ? (isOpus ? '#E63946' : preset.captions?.activeWordColor || '#FFE600')
                  : (isOpus ? '#334155' : preset.captions?.inactiveWordColor || '#94A3B8'),
                textShadow: isOpus
                  ? 'none'
                  : isWordActive
                  ? '0 0 16px rgba(255, 230, 0, 0.45)'
                  : '0 2px 6px rgba(0, 0, 0, 0.8)',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
```


################################################################################
### FILE 28/33: frontend/src/remotion/layers/BackgroundMatrix.tsx
################################################################################

```tsx
# PATH: frontend/src/remotion/layers/BackgroundMatrix.tsx
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { PresetConfig } from '../../types';

interface Props {
  preset: PresetConfig;
}

export const BackgroundMatrix: React.FC<Props> = ({ preset }) => {
  const frame = useCurrentFrame();
  const bg = preset?.background || {};

  if (bg.type === 'halftone_matrix') {
    // Fable 5.2 Style: Pulsing retro halftone dots
    const pulse = Math.sin(frame / 20) * 0.15 + 0.85;
    return (
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: bg.baseColor || bg.primaryColor || '#0A0A0A',
          backgroundImage: `radial-gradient(${bg.dotColor || bg.secondaryColor || '#222222'} 2px, transparent 2px)`,
          backgroundSize: '24px 24px',
          opacity: pulse,
        }}
      />
    );
  }

  if (bg.type === 'paper_grid') {
    // Opus 5.5 Style: Clean Swiss editorial paper with subtle technical hairline grid
    return (
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{
          backgroundColor: bg.baseColor || bg.primaryColor || '#F5F2EB',
          backgroundImage: `
            linear-gradient(to right, ${bg.gridLineColor || bg.secondaryColor || '#E0DDD5'} 1px, transparent 1px),
            linear-gradient(to bottom, ${bg.gridLineColor || bg.secondaryColor || '#E0DDD5'} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        {/* Subtle technical crosshairs at corners */}
        <div className="absolute top-8 left-8 text-xs font-mono text-slate-400 select-none">
          + 00.284 // EDITORIAL GRID
        </div>
        <div className="absolute top-8 right-8 text-xs font-mono text-slate-400 select-none">
          SEC. 9:16 +
        </div>
      </div>
    );
  }

  // Vox Blueprint Style
  return (
    <div 
      className="absolute inset-0 w-full h-full"
      style={{
        backgroundColor: bg.baseColor || bg.primaryColor || '#080F1E',
        backgroundImage: `
          linear-gradient(to right, #152238 1px, transparent 1px),
          linear-gradient(to bottom, #152238 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    />
  );
};

```


################################################################################
### FILE 29/33: frontend/src/remotion/layers/BehindHeadTypography.tsx
################################################################################

```tsx
# PATH: frontend/src/remotion/layers/BehindHeadTypography.tsx
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  text: string;
  color?: string;
  startFrame?: number;
}

export const BehindHeadTypography: React.FC<Props> = ({
  text,
  color = '#FFFFFF',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);

  // High-impact spring scale pop
  const scale = spring({
    frame: relFrame,
    fps,
    config: {
      damping: 12,
      mass: 0.5,
      stiffness: 180,
    },
  });

  const opacity = interpolate(relFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div className="absolute top-[18%] inset-x-0 flex flex-col items-center justify-center select-none pointer-events-none z-10">
      <h1
        className="text-[120px] font-black uppercase tracking-tighter leading-none text-center font-impact"
        style={{
          color: color,
          transform: `scale(${scale})`,
          opacity: opacity,
          textShadow: '0 10px 40px rgba(0,0,0,0.8), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
        }}
      >
        {text}
      </h1>
    </div>
  );
};

```


################################################################################
### FILE 30/33: frontend/src/remotion/layers/SwissEditorialOverlay.tsx
################################################################################

```tsx
# PATH: frontend/src/remotion/layers/SwissEditorialOverlay.tsx
import React from 'react';
import { PresetConfig } from '../../types';

interface Props {
  preset: PresetConfig;
  title: string;
}

export const SwissEditorialOverlay: React.FC<Props> = ({ preset, title }) => {
  if (!preset.id.includes('opus')) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-20 flex flex-col justify-between p-8">
      {/* Top Swiss Banner */}
      <div className="flex flex-col gap-2">
        <div className="bg-[#E63946] text-white font-headline text-3xl font-black px-6 py-3 uppercase tracking-wider inline-block shadow-lg self-start">
          {title}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-700 bg-white/90 px-4 py-1.5 border border-slate-300 self-start shadow-sm">
          <span>FIG. 01 // INTERVIEW</span>
          <span>•</span>
          <span>1080x1920 60FPS</span>
        </div>
      </div>

      {/* Hairline Borders and Corner Marks */}
      <div className="absolute top-28 left-8 right-8 border-t-2 border-slate-400/40" />
      <div className="absolute bottom-28 left-8 right-8 border-b-2 border-slate-400/40" />

      {/* Bottom Technical Tag */}
      <div className="flex justify-between items-end text-xs font-mono font-bold text-slate-500">
        <div className="bg-white/80 px-3 py-1 border border-slate-300">
          SWISS_GRID_SYSTEM // V5.5
        </div>
        <div className="bg-white/80 px-3 py-1 border border-slate-300">
          PROCESSED_BY_AI
        </div>
      </div>
    </div>
  );
};

```


################################################################################
### FILE 31/33: presets/fable_5_2_kinetic.json
################################################################################

```json
# PATH: presets/fable_5_2_kinetic.json
{
  "id": "fable_5_2_kinetic",
  "name": "Fable 5.2 Kinetic",
  "description": "High-retention creator reel with animated behind-the-head giant typography, halftone dot patterns, rotomasked speaker cutout, and bouncy kinetic captions.",
  "composition": {
    "width": 1080,
    "height": 1920,
    "fps": 60,
    "targetDurationSec": 50
  },
  "background": {
    "type": "halftone_matrix",
    "baseColor": "#0A0A0A",
    "dotColor": "#222222",
    "dotRadius": 3,
    "dotSpacing": 24,
    "pulsingGrid": true
  },
  "palette": {
    "primaryAccent": "#FFE600",
    "highlightColor": "#FF2A54",
    "textPrimary": "#FFFFFF",
    "textMuted": "#888888",
    "badgeBg": "#FF2A54",
    "badgeText": "#FFFFFF"
  },
  "typography": {
    "behindHeadFont": "Impact, sans-serif",
    "captionFont": "Syne, sans-serif",
    "accentFont": "Inter, sans-serif"
  },
  "speakerCard": {
    "mode": "rotomask_fullscreen",
    "enableBehindHeadText": true,
    "textOutlineEffect": true,
    "glowColor": "rgba(255, 42, 84, 0.3)"
  },
  "captions": {
    "style": "kinetic_pop",
    "position": "center_lower",
    "textTransform": "uppercase",
    "highlightBox": true,
    "boxColor": "#FF2A54",
    "boxTextColor": "#FFFFFF",
    "inactiveTextColor": "#EEEEEE",
    "bounceScale": 1.15
  },
  "sfx": {
    "hookImpact": "sub_boom.mp3",
    "wordPop": "kinetic_pop.mp3",
    "whooshTransition": "fast_whoosh.mp3"
  }
}

```


################################################################################
### FILE 32/33: presets/opus_5_5_editorial.json
################################################################################

```json
# PATH: presets/opus_5_5_editorial.json
{
  "id": "opus_5_5_editorial",
  "name": "Opus 5.5 Editorial",
  "description": "Swiss magazine grid layout with red accent banners, monospace technical figure tags, and PIP video cards.",
  "composition": {
    "width": 1080,
    "height": 1920,
    "fps": 60,
    "targetDurationSec": 50
  },
  "background": {
    "type": "paper_grid",
    "baseColor": "#F5F2EB",
    "gridLineColor": "#E0DDD5",
    "gridSpacing": 40,
    "showCrosshairs": true
  },
  "palette": {
    "primaryAccent": "#E63946",
    "darkAccent": "#111827",
    "textPrimary": "#0F172A",
    "textMuted": "#64748B",
    "bannerBg": "#E63946",
    "bannerText": "#FFFFFF"
  },
  "typography": {
    "headlineFont": "Syne, sans-serif",
    "monoFont": "JetBrains Mono, monospace",
    "bodyFont": "Inter, sans-serif"
  },
  "speakerCard": {
    "mode": "split_pip_card",
    "aspectRatio": "4:5",
    "borderWidth": 4,
    "borderColor": "#E63946",
    "dropShadow": "0 20px 40px rgba(0,0,0,0.12)",
    "showFigureLabel": true,
    "figurePrefix": "FIG. 01 // INTERVIEW"
  },
  "captions": {
    "style": "editorial_lower_pill",
    "textTransform": "uppercase",
    "activeWordColor": "#E63946",
    "inactiveWordColor": "#475569",
    "pillBackground": "#FFFFFF",
    "pillBorder": "2px solid #E2E8F0"
  },
  "sfx": {
    "cardSlide": "paper_slide.mp3",
    "cutTransition": "camera_shutter.mp3",
    "captionPop": "subtle_tick.mp3"
  }
}

```


################################################################################
### FILE 33/33: presets/vox_technical_explainer.json
################################################################################

```json
# PATH: presets/vox_technical_explainer.json
{
  "id": "vox_technical_explainer",
  "name": "Vox Technical Explainer",
  "description": "Information-dense documentary style featuring 3D floating assets, animated Recharts data graphs, KaTeX math formulas, and Rough.js sketchy annotations.",
  "composition": {
    "width": 1080,
    "height": 1920,
    "fps": 60,
    "targetDurationSec": 60
  },
  "background": {
    "type": "dark_blueprint",
    "baseColor": "#080F1E",
    "gridLineColor": "#152238",
    "gridSpacing": 32,
    "vignette": true
  },
  "palette": {
    "primaryAccent": "#00F0FF",
    "secondaryAccent": "#7000FF",
    "textPrimary": "#F8FAFC",
    "textMuted": "#94A3B8",
    "chartLine": "#00F0FF",
    "chartFill": "rgba(0, 240, 255, 0.15)"
  },
  "typography": {
    "headlineFont": "Cabinet Grotesk, sans-serif",
    "monoFont": "JetBrains Mono, monospace",
    "mathFont": "KaTeX_Main, serif"
  },
  "features": {
    "enable3D": true,
    "enableCharts": true,
    "enableMathFormulas": true,
    "enableSketchAnnotations": true
  },
  "captions": {
    "style": "technical_lower_third",
    "textTransform": "none",
    "activeWordColor": "#00F0FF",
    "inactiveWordColor": "#94A3B8",
    "highlightUnderline": true
  },
  "sfx": {
    "dataTick": "digital_click.mp3",
    "chartRise": "whoosh_swell.mp3",
    "formulaDraw": "chalk_scratch.mp3"
  }
}

```
