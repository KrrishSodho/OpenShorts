<div align="center">

# OpenShorts
### 🎬 Open Source Self-Hosted Clip Generator

Turn long-form videos into high-retention 9:16 vertical shorts (Reels, TikToks, Shorts) with grounded speech AI, 14 editable Remotion motion graphics archetypes, and local offline processing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Remotion 4.0](https://img.shields.io/badge/Remotion-4.0-0B84FE.svg?logo=react&logoColor=white)](https://www.remotion.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Electron 33](https://img.shields.io/badge/Electron-33-47848F.svg?logo=electron&logoColor=white)](https://www.electronjs.org/)

[Features](#-key-features) • [Quick Start](#-quick-start) • [Desktop App](#-desktop-app) • [Architecture](#-architecture) • [Contributing](#-contributing--bug-hunting)

</div>

---

## 🚀 Key Features

- **🎯 Word-Level Speech Grounding:** Uses `faster-whisper` for offline speech-to-text with microsecond word timestamps. No cloud transcription fees.
- **🧠 1-Request AI Viral Discovery:** Powered by Google Gemini (`gemini-2.5-flash`, `gemini-3.5-flash-lite`, or `gemini-3.8-flash`). Identifies hook windows, setups, turns, and payoffs strictly from transcript word indices without fabricating numbers, quotes, or claims.
- **🎨 14 Deterministic Remotion Archetypes:**
  - **Keyword Cascade & Kinetic Word Wall:** High-impact kinetic typography with spotlight reveals.
  - **Radial Gauge Ring & Odometer Counter:** Precise numeric readouts and animatable metrics.
  - **Explainer Timeline & Process Steps:** Escalating stages with chronological milestones.
  - **Spec Versus Contrast:** 2-column comparative cards with center badge.
  - **Pull Quote & Editorial Cards:** High-prestige media callouts with backdrop surfaces (Glass, Paper, Dark).
  - **Vector Flowcharts & Diagrams:** Directional node relationships and indicators.
- **🖐️ Interactive Canvas Overlay:** Drag and reposition motion graphics directly on the video player with 50% snap guides and caption safe-zone enforcement.
- **🎨 Unified Hex & Pipette Color System:** Full direct hex input (`#FFFFFF`) with native eye-dropper pipette, preset palettes, and theme auto-inheritance.
- **🔊 Multi-Track Audio & SFX Synthesis:** Integrated procedural sound design (whoosh, pop, click, chime, riser, shutter, sub-bass) normalized to -3 dBFS.
- **🖥️ Standalone Desktop App (Electron + PyInstaller + Static FFmpeg):** Bundled single executable for offline desktop editing without terminal commands.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Git**
- **Python 3.10+**
- **Node.js 18+ (with npm)**
- **FFmpeg** on system PATH (or use the standalone Desktop distribution)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey) (Free Tier available)

### 2. Clone & Setup

```bash
git clone https://github.com/KrrishSodho/OpenShorts.git
cd OpenShorts

# Copy environment variables
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```ini
GEMINI_API_KEY=AIzaSy...
SELECTED_GEMINI_MODEL=gemini-2.5-flash
```

### 3. Launching OpenShort

#### Option A: One-Click Launcher (Recommended for Dev)

**On Windows:**
```bat
start_studio.bat
```

**On macOS / Linux:**
```bash
chmod +x start_studio.sh
./start_studio.sh
```

#### Option B: Docker Compose

```bash
docker compose up --build
```

#### Option C: Manual Launch

1. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```
3. **Start the services:**
   ```bash
   python run_studio.py
   ```

Open your browser at **`http://localhost:3000`** (API docs available at `http://127.0.0.1:8000/docs`).

---

## 💻 Desktop App (Windows)

OpenShort includes a standalone desktop client that bundles the frontend, a frozen Python backend, and static FFmpeg into an Electron application.

To package the desktop app locally:
```bash
cd desktop
npm install
python scripts/download_binaries.py
npm run build
npm run package
```

The output standalone executable will be generated at:
```text
desktop/release/win-unpacked/Viral Studio Pro.exe
```

---

## 🏗️ Architecture

```
OpenShort/
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

## 🛠️ Contributing & Bug Hunting

We welcome contributions from the community!

1. **Fork the repository** on GitHub.
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes:**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** with a detailed summary and screenshots/screen recordings of your changes.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
