<div align="center">

# OpenShorts
### 🎬 Open Source Self-Hosted Clip Generator

Turn long-form videos into high-retention 9:16 vertical shorts (Reels, TikToks, Shorts) with grounded speech AI, 14 editable Remotion motion graphics archetypes, and local offline processing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Remotion 4.0](https://img.shields.io/badge/Remotion-4.0-0B84FE.svg?logo=react&logoColor=white)](https://www.remotion.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Electron 33](https://img.shields.io/badge/Electron-33-47848F.svg?logo=electron&logoColor=white)](https://www.electronjs.org/)

[Features](#features) • [Quick Start](#quick-start) • [Desktop App](#desktop-app) • [Motion Archetypes](#motion-archetypes) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## Overview

Most AI short-form video tools are subscription-based cloud services that upload your footage to third-party servers, burn basic subtitles, and give you almost no control over graphic styling or layout.

**OpenShorts** is an open-source, self-hosted alternative designed for creators and developers who want complete control over their workflow:
- **100% Local & Private Processing:** Speech transcription (Whisper) and video rendering (FFmpeg + Remotion) run directly on your own hardware. Your raw media never leaves your computer.
- **Transcript-Grounded AI Planning:** The AI identifies clips, hooks, and keywords strictly from transcript word timestamps. It never fabricates quotes, statistics, or metrics.
- **Production Motion Graphics:** Includes 14 built-in Remotion archetypes that can be repositioned directly on the canvas, dynamically scaled, and styled with custom brand colors.
- **Zero Token Cost While Editing:** Gemini is invoked only once per video to plan candidate shorts. Scrubbing the timeline, repositioning graphics, modifying text, and rendering final MP4s require zero AI calls.

---

## Features

### 1. Local Speech-to-Text & Word Alignment
- Powered by `faster-whisper` for fast, offline audio transcription on CPU or CUDA GPU.
- Generates precise word-level timestamps used to snap subtitle timing and trigger motion graphic animations at the exact moment a word is spoken.

### 2. Single-Request Short Discovery
- Sends timestamped transcript words to Google Gemini (`gemini-2.5-flash`, `gemini-3.5-flash-lite`, or `gemini-3.8-flash`) in a single prompt.
- Extracts viral candidate clips, opening hook windows (0:00 - 2.4s), narrative setups, and payoffs without hallucinating content.

### 3. 14 Remotion Motion Graphic Archetypes
- Deterministic, frame-accurate motion graphics built with Remotion and React.
- Covers kinetic word stacks, explainer timelines, radial stat dials, rolling counters, 2-column contrast cards, and editorial pull quotes.
- Live canvas overlay with interactive drag-and-drop handles, center-snapping guides, and caption safe-zone enforcement.

### 4. Custom Styling & Reusable Color System
- Direct uppercase Hex color input (`#FFFFFF`, `#00F5FF`, `#FF2E54`) with a native pipette color dropper and preset brand swatches.
- Granular text scaling (1.0x up to 2.3x) for high-impact mobile viewing.
- Theming presets: Swiss Paper, Crimson Tape, Cyber Neon, Studio Clean, and Technical Explainer.

### 5. Multi-Track Audio Engine
- Procedural sound effect generation (whooshes, pops, clicks, risers, chimes, sub-bass hits) normalized to -3 dBFS.
- Individual volume faders for speech audio, background music, and SFX with master muting.

---

## Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** (with npm)
- **FFmpeg** on system PATH (or use the standalone Desktop distribution)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey) (Free Tier available)

### 1. Clone & Configure

```bash
git clone https://github.com/KrrishSodho/OpenShorts.git
cd OpenShorts

# Create environment file from template
cp .env.example .env
```

Open `.env` and add your Gemini API key:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
SELECTED_GEMINI_MODEL=gemini-2.5-flash
```

### 2. Run OpenShorts

#### Windows:
```bat
start_studio.bat
```

#### macOS / Linux:
```bash
chmod +x start_studio.sh
./start_studio.sh
```

#### Docker Compose:
```bash
docker compose up --build
```

#### Manual Development:
```bash
# Terminal 1: Backend Server
pip install -r requirements.txt
py -3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend Studio
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:3000`** (FastAPI documentation at `http://127.0.0.1:8000/docs`).

---

## Desktop App

OpenShorts can be packaged into a standalone Windows desktop application (`.exe`) that bundles the Electron UI, a frozen Python backend, and static FFmpeg binaries into an offline executable.

To package the desktop app locally:
```bash
cd desktop
npm install
py -3 scripts/download_binaries.py
npm run package
```

The standalone application is output to:
```text
desktop/release/win-unpacked/Viral Studio Pro.exe
```

---

## Motion Archetypes

| Graphic | Description |
| :--- | :--- |
| **Keyword Cascade** | Multi-line kinetic typography that reveals and spotlights spoken keywords in real time. |
| **Kinetic Word Wall** | Full-screen typography grid with spotlight word reveals. |
| **Radial Gauge Ring** | Circular dial for visualizing percentage stats and numerical metrics. |
| **Odometer + Spline** | Smooth rolling counter with an animatable area spline graph. |
| **Explainer Timeline** | 3-step vertical progress timeline for sequential steps or points. |
| **Spec Versus** | 2-column comparative layout with a center badge for contrasting concepts. |
| **Pull-Quote Card** | High-contrast editorial card (Glass, Paper, Dark) highlighting a key statement. |
| **Yellow Circle Spotlight** | Camera punch-zoom with an animated highlight circle around the speaker. |
| **Bar Comparison** | Comparative animated horizontal bars for metric comparisons. |
| **Donut Metric** | Multi-slice breakdown ring with center readout and category legend. |
| **Pyramid Levels** | Hierarchical tiered structure illuminating from base to apex. |

---

## Architecture

```
OpenShorts/
├── backend/                  # FastAPI REST API & Processing Pipeline
│   ├── api/                  # Endpoints (clips, framing, motion, export, settings)
│   ├── services/             # Audio, Whisper transcription, AI director, FFmpeg
│   └── main.py               # Server entrypoint
├── frontend/                 # React 18 + Vite + Tailwind CSS + Remotion Studio
│   ├── src/components/       # UI panels, inspectors, multi-track timeline, color pickers
│   └── src/remotion/         # Remotion composition, archetypes, scene compiler
├── desktop/                  # Electron desktop application & packaging scripts
│   ├── src/                  # Main process, preload scripts, IPC bridges
│   └── scripts/              # PyInstaller & binary packaging automation
├── presets/                  # Visual styling themes (Opus, Fable, Cyber, Minimal, Vox)
├── storage/                  # Local media storage (git-ignored for privacy)
└── docker-compose.yml        # Containerized deployment specification
```

---

## Contributing

Contributions, bug reports, and suggestions are welcome.
1. Fork the repository on GitHub.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Commit your changes: `git commit -m "feat: description of changes"`.
4. Push to your branch: `git push origin feature/your-feature-name`.
5. Open a Pull Request.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
