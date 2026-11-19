# OpenShorts
> Open-source, self-hosted short-form video generator. Cut long videos and podcasts into 9:16 vertical shorts with motion graphics and captions.

OpenShorts runs locally on your machine. Speech transcription is powered by Faster-Whisper, motion graphics are rendered with Remotion (React), and clip discovery is handled by Google Gemini using only the actual words said in the video.

---

## Why OpenShorts?

Most AI video clip tools (Opus Clip, Klap, Munch) are paid cloud subscriptions that upload your raw video to external servers, burn in basic captions, and offer minimal control over visual styling.

OpenShorts is designed differently:
- **Private & Local-First:** Audio transcription (Whisper) and video rendering (FFmpeg + Remotion) run directly on your hardware.
- **Zero Hallucinations:** The AI selects clips, hooks, and keywords strictly from transcript word timestamps. It never invents fake metrics, quotes, or claims.
- **14 Editable Remotion Graphics:** Includes kinetic text, explainer timelines, metric gauges, split-screen comparisons, and editorial pull quotes. Reposition on canvas with drag-and-drop, scale font size (1.0x to 2.3x), and customize hex colors (`#FFFFFF`).
- **Zero API Calls During Editing:** Gemini is called once per video to plan clips. Scrubbing, styling, reordering, and MP4 rendering require zero AI tokens.

---

## How It Works

```
Long Video (File or YouTube URL)
       │
       ▼
[1] Local Audio Extraction & Word-Level Transcription (Faster-Whisper)
       │
       ▼
[2] Single-Request Clip & Hook Discovery (Google Gemini 2.5 / 3.5 / 3.8)
       │
       ▼
[3] Motion Studio Editor (Canvas Drag, Hex Color Picker, 14 Graphic Archetypes)
       │
       ▼
[4] Production 1080x1920 MP4 Export (Remotion + FFmpeg)
```

1. **Ingest & Transcribe:** Feed a YouTube URL or a local MP4/MKV/MOV file. Faster-Whisper transcribes speech into word-level timestamps locally on CPU or GPU.
2. **Find High-Retention Clips:** A single prompt sends the numbered transcript words to Gemini (`gemini-2.5-flash`, `gemini-3.5-flash-lite`, or `gemini-3.8-flash`). It identifies candidate shorts, opening hook windows, and key narrative moments.
3. **Edit in Motion Studio:**
   - Choose from 14 built-in motion graphics.
   - Drag graphics directly on the video player with 50% snap lines and caption safe-zone enforcement.
   - Adjust scale (1.0x to 2.3x) and set custom hex colors with the native pipette color dropper.
4. **Export:** Render clean 1080x1920 vertical MP4s with multi-track audio and procedural sound effects.

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- FFmpeg (must be available in your system PATH, or use the Desktop build)
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone & Configure

```bash
git clone https://github.com/KrrishSodho/OpenShorts.git
cd OpenShorts

# Copy environment template
cp .env.example .env
```

Edit `.env` and paste your Gemini API key:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
SELECTED_GEMINI_MODEL=gemini-2.5-flash
```

### 2. Run OpenShorts

#### On Windows:
```bat
start_studio.bat
```

#### On macOS / Linux:
```bash
chmod +x start_studio.sh
./start_studio.sh
```

#### With Docker Compose:
```bash
docker compose up --build
```

#### Manual Dev Launch:
```bash
# Terminal 1: Backend
pip install -r requirements.txt
py -3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:3000`** (FastAPI Swagger docs at `http://127.0.0.1:8000/docs`).

---

## Desktop App (Windows)

OpenShorts includes an Electron distribution that bundles the frontend, frozen Python backend, and static FFmpeg into an offline standalone package.

To build the desktop executable:
```bash
cd desktop
npm install
py -3 scripts/download_binaries.py
npm run package
```

The standalone application is generated at:
```text
desktop/release/win-unpacked/Viral Studio Pro.exe
```

---

## Built-In Motion Graphics

| Graphic | Description |
| :--- | :--- |
| **Keyword Cascade** | Multi-line kinetic typography that reveals and highlights spoken keywords. |
| **Kinetic Word Wall** | Full-screen typography grid with spotlight word reveals. |
| **Radial Gauge Ring** | Circular glowing dial for percentages and numerical stats. |
| **Odometer + Spline** | Smooth rolling counter with an animatable area spline graph. |
| **Explainer Timeline** | 3-step vertical progress timeline for sequential steps or points. |
| **Spec Versus** | 2-column comparison card with a center VS badge for contrasting points. |
| **Pull-Quote Card** | Editorial card (Glass, Paper, Dark) displaying a key statement. |
| **Yellow Circle Spotlight** | Camera punch-zoom with an animated highlight circle around the speaker. |
| **Bar Comparison** | Comparative animated horizontal bars for metric comparisons. |
| **Donut Metric** | Multi-slice breakdown ring with center readout and category legend. |
| **Pyramid Levels** | Hierarchical tiered structure illuminating from base to apex. |

---

## Tech Stack

- **Backend:** Python 3.10+, FastAPI, Faster-Whisper, PyTorch, CTranslate2, FFmpeg
- **Frontend & Player:** React 18, Vite, Remotion 4.0, Tailwind CSS, Lucide Icons
- **AI Planning:** Google Gemini API (`gemini-2.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`)
- **Desktop:** Electron 33, PyInstaller

---

## Contributing

Pull requests and bug reports are welcome. If you run into issues or want to add a new motion graphic:
1. Fork the repo and create your branch (`git checkout -b feature/my-feature`).
2. Commit your changes (`git commit -m "feat: add feature"`).
3. Push to your branch (`git push origin feature/my-feature`).
4. Open a Pull Request.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
