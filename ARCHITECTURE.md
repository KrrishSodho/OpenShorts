# Viral Studio — Architecture & Extensibility Guide

> **Enterprise Modular Architecture**: Python FastAPI + FFmpeg/Whisper/Gemini Backend & React 18 + Zustand + Remotion Frontend.

---

## 1. System Overview & Core Principles

Viral Studio is designed around **Single Responsibility Modules**, **Plugin-Style Registries**, and **Strict Contract Parity**. Every major domain is decoupled so that developers can add new motion graphics, subtitle styles, AI director models, or pipeline stages by editing **only 1–2 isolated files** without touching the rest of the application.

```
viral-studio/
├── backend/
│   ├── api/                           # Thin FastAPI routers partitioned by domain
│   │   ├── health.py                  # GET /api/health
│   │   ├── presets.py                 # GET /api/presets
│   │   ├── ingest.py                  # POST /api/ingest, /api/ingest/upload
│   │   ├── jobs.py                    # GET /api/jobs/{id}
│   │   ├── clips.py                   # POST /api/prepare-clip, /api/auto-track-pan
│   │   ├── ai.py                      # POST /api/remix-motion
│   │   ├── export.py                  # POST /api/render-export, cancel, status, download
│   │   └── __init__.py                # Aggregates and mounts all routers on api_router
│   ├── core/                          # Cross-cutting infrastructure
│   │   ├── config.py                  # Settings, dynamic Python binary resolution & paths
│   │   └── jobs.py                    # Thread-safe in-memory JobManager (isolated state & locks)
│   ├── schemas/                       # Typed Pydantic request & response models
│   │   ├── ingest.py                  # IngestRequest, YouTubeRequest
│   │   ├── clip.py                    # PrepareClipRequest, RemixMotionRequest, AutoTrackPanRequest
│   │   ├── export.py                  # RenderExportRequest
│   │   └── __init__.py
│   ├── services/                      # Pure business logic services (isolated pipeline stages)
│   │   ├── pipeline_orchestrator.py   # Full Studio Ingest & Choreography Pipeline Worker
│   │   ├── export_orchestrator.py     # Chromium Render Worker & Lifecycle Management
│   │   ├── ai_director.py             # Gemini Choreographer, Few-shot prompts, Safe JSON Parser
│   │   ├── face_tracker.py            # Shot boundary & speaker centering
│   │   ├── transcriber.py             # Faster-Whisper ASR
│   │   ├── remotion_exporter.py       # Node child process runner
│   │   ├── sfx_generator.py           # Procedural sound designer
│   │   └── broll_fetcher.py           # B-roll asset manager
│   ├── utils/                         # Reusable OS & FFmpeg utilities
│   │   └── ffmpeg_helper.py           # Audio extraction, trimming, media probe
│   └── main.py                        # Ultra-thin app entrypoint (< 75 lines)
│
├── frontend/
│   ├── render_short.mjs               # Node.js headless Remotion bundler & renderer
│   └── src/
│       ├── api/                       # Typed, centralized API Client Layer
│       │   ├── client.ts              # Base fetch wrapper, error handling
│       │   ├── mediaApi.ts            # Ingest, upload, presets, health
│       │   ├── jobsApi.ts             # Ingest job status queries
│       │   ├── motionApi.ts           # Prepare clip, auto-track, AI remix
│       │   ├── exportApi.ts           # Trigger render, poll status, cancel render
│       │   └── index.ts               # Barrel re-export
│       ├── types/                     # Domain-split TypeScript contracts
│       │   ├── media.ts               # MediaMetadata, TranscriptWord, TranscriptData
│       │   ├── motion.ts              # MotionEventType, Zone, Transition, MotionEvent, SceneBeat
│       │   ├── captions.ts            # SubtitleStyleId, SubtitleConfig, PhraseToken
│       │   ├── presets.ts             # PresetConfig, TypographyConfig, ColorPalette
│       │   ├── jobs.ts                # IngestJob, JobResultPayload, ViralClipRecommendation
│       │   ├── export.ts              # ExportProps, RenderJobState, ExportHistoryItem
│       │   └── index.ts               # Barrel re-export matching types.ts
│       ├── types.ts                   # Backward-compatible facade (re-exports types/index.ts)
│       ├── store/
│       │   ├── types.ts               # StudioState, StudioActions, SliceCreator
│       │   ├── slices/                # Modular Zustand store slices (< 180 lines each)
│       │   │   ├── mediaSlice.ts      # Active media, presets, FPS, audio volumes
│       │   │   ├── ingestSlice.ts     # Ingest jobs, polling, job progress
│       │   │   ├── clipSlice.ts       # Active clip selection, pan keyframes, subclip caching
│       │   │   ├── motionSlice.ts     # Motion events, AI remix
│       │   │   ├── captionSlice.ts    # Subtitle config, transcript inline edits
│       │   │   ├── exportSlice.ts     # Active export status, progress, export history
│       │   │   └── uiSlice.ts         # Playhead seeking, currentPlaySec, modal toggles
│       │   └── useStudioStore.ts      # Backward-compatible facade assembling slices (< 25 lines)
│       ├── utils/                     # Shared UI & media utilities
│       │   ├── audioPreview.ts        # Reusable Audio playback singleton for SFX
│       │   ├── timeFormat.ts          # Seconds to MM:SS:FF formatters
│       │   └── transcriptUtils.ts     # Word range filters & click-to-seek helpers
│       ├── remotion/
│       │   ├── archetypes/            # Plugin Architecture: Self-Contained Motion Archetypes
│       │   │   ├── types.ts           # ArchetypeComponentProps, ArchetypeDefinition
│       │   │   ├── transitionHelpers.tsx # Transition styles, spline paths, odometer counter
│       │   │   ├── KeywordCascade.tsx # Keyword cascade visualizer
│       │   │   ├── ExplainerTimeline.tsx # 3-step vertical timeline
│       │   │   ├── KineticWordWall.tsx# Kinetic multi-word grid
│       │   │   ├── PosterSlam.tsx     # Spotlight circle + punchy headline
│       │   │   ├── EditorialSplit.tsx # Editorial hook card
│       │   │   ├── RadialGaugeStat.tsx# Animated circular SVG gauge
│       │   │   ├── OdometerCounter.tsx# Rolling digits + spline chart
│       │   │   ├── VectorDiagram.tsx  # Flowchart nodes & animated links
│       │   │   ├── SpecVersus.tsx     # 2-column comparison card
│       │   │   ├── QuoteEditorial.tsx # Pull-quote with author tag
│       │   │   └── registry.ts        # Typed ARCHETYPE_REGISTRY: single source of truth for
│       │   │                          # id, label, defaultZone, duration, and Component
│       │   ├── captions/              # Plugin Architecture: Modular Caption Styles
│       │   │   ├── types.ts           # CaptionPhrase, CaptionRenderProps, StyleDefinition
│       │   │   ├── phraseBuilder.ts   # Punctuation-aware phrase chunking
│       │   │   ├── HormoziPop.tsx     # Outlined yellow bounce
│       │   │   ├── OpusPaper.tsx      # Clean swiss paper strip + red pill
│       │   │   ├── MinimalShadow.tsx  # Soft drop-shadow editorial
│       │   │   ├── KaraokePill.tsx    # Smooth progressive fill
│       │   │   ├── PaperOrBoxCaptions.tsx # Tape crimson, opus paper & neon cyan
│       │   │   └── registry.ts        # Typed SUBTITLE_STYLE_REGISTRY: styles, swatches, labels
│       │   ├── layers/
│       │   │   ├── DynamicStageRenderer.tsx # Clean registry consumer (< 30 lines)
│       │   │   └── KineticCaptions.tsx      # Clean registry consumer (< 75 lines)
│       │   ├── MasterShortComposition.tsx   # Canvas & composition coordinator
│       │   ├── sceneCompiler.ts             # Reads from ARCHETYPE_REGISTRY (< 240 lines)
│       │   └── themeEngine.ts               # Theme styles
│       └── components/
│           ├── motion-director/
│           │   ├── BeatPillTrack.tsx        # Interactive pill track
│           │   └── BeatCardEditor.tsx       # Form fields (zone, duration, SFX, text)
│           ├── inspector/
│           │   ├── FramingAudioTab.tsx      # Face tracking & manual pan slider
│           │   └── TranscriptTab.tsx        # Word search & click-to-seek
│           ├── top-bar/
│           │   ├── SubtitleDropdown.tsx     # Subtitle style dropdown (from registry)
│           │   ├── PresetDropdown.tsx       # Theme preset dropdown
│           │   └── ExportHistoryDropdown.tsx# Export history list & download links
│           ├── MotionDirectorPanel.tsx      # Orchestrator (< 210 lines)
│           ├── LeftInspector.tsx            # Tab container (< 160 lines)
│           └── TopCommandBar.tsx            # Command bar container (< 220 lines)
```

---

## 2. "How to Add a Feature" Developer Cheat Sheet

### A. How to Add a New Motion Graphic Archetype
> **Goal:** Create a new animated motion overlay (e.g. `glowing_matrix_alert`).
1. **Create the Archetype Component:**  
   Create `frontend/src/remotion/archetypes/GlowingMatrixAlert.tsx`:
   ```tsx
   import React from 'react';
   import { ArchetypeComponentProps } from './types';

   export const GlowingMatrixAlert: React.FC<ArchetypeComponentProps> = ({ scene, enterSpring }) => {
     return (
       <div className="w-full h-full flex items-center justify-center pointer-events-none">
         <h1 className="text-5xl font-black text-cyan-400">{scene.headline}</h1>
       </div>
     );
   };
   ```
2. **Register it in the Registry:**  
   In `frontend/src/remotion/archetypes/registry.ts`, add:
   ```ts
   MOTION_ARCHETYPE_REGISTRY['glowing_matrix_alert'] = {
     id: 'glowing_matrix_alert',
     label: 'Glowing Matrix Alert',
     description: 'Cyberpunk alert card with glowing matrix outline',
     defaultZone: 'center_spotlight',
     defaultDuration: 2.5,
     Component: GlowingMatrixAlert,
   };
   ```
3. **Done!**  
   - `DynamicStageRenderer.tsx` automatically renders it.
   - `MotionDirectorPanel.tsx` automatically includes it in the dropdown.
   - `sceneCompiler.ts` automatically assigns its default zone and stage height.

---

### B. How to Add a New Subtitle Style
> **Goal:** Create a new caption style (e.g. `cyber_glitch`).
1. **Create the Style Component:**  
   Create `frontend/src/remotion/captions/CyberGlitch.tsx`:
   ```tsx
   import React from 'react';
   import { CaptionRenderProps } from './types';

   export const CyberGlitch: React.FC<CaptionRenderProps> = ({ activePhrase, activeWordIndex, formatWord }) => (
     <div className="w-full flex justify-center gap-2">
       {activePhrase.words.map((w, idx) => (
         <span key={idx} className={idx === activeWordIndex ? "text-cyan-400 font-bold" : "text-white"}>
           {formatWord(w.word)}
         </span>
       ))}
     </div>
   );
   ```
2. **Register it in the Registry:**  
   In `frontend/src/remotion/captions/registry.ts`, add:
   ```ts
   SUBTITLE_STYLE_REGISTRY['cyber_glitch'] = {
     id: 'cyber_glitch',
     name: 'Cyber Glitch',
     desc: 'Neon cyan glitch with chromatic aberration',
     swatch: 'bg-cyan-400',
     Component: CyberGlitch,
   };
   ```
3. **Done!**  
   - `KineticCaptions.tsx` automatically renders it.
   - `TopCommandBar.tsx` subtitle picker automatically surfaces it with its swatch.

---

### C. How to Add a New API Endpoint
> **Goal:** Add a new endpoint (e.g. `POST /api/extract-audio-stems`).
1. **Add Route Handler:**  
   In `backend/api/`, create or open the appropriate domain router (e.g. `backend/api/clips.py`):
   ```python
   @router.post("/api/extract-audio-stems")
   def extract_stems(req: StemsRequest):
       return {"success": True}
   ```
2. **Add Frontend API Client Call:**  
   In `frontend/src/api/motionApi.ts`, export the typed fetch helper:
   ```ts
   export async function extractAudioStems(mediaId: string): Promise<StemsResponse> {
     return requestJson('/api/extract-audio-stems', { method: 'POST', body: JSON.stringify({ media_id: mediaId }) });
   }
   ```
3. **Done!** The router is auto-mounted via `backend/api/__init__.py`.

---

### D. How to Swap the AI Director Model
> **Goal:** Switch from Gemini 2.5 Flash to Claude, OpenAI, or a fine-tuned local model.
1. Open `backend/services/ai_director.py`.
2. Edit `generate_ranked_viral_suite()` and `remix_clip_motion_events()`.
3. The rest of the backend (`pipeline_orchestrator.py`, `backend/main.py`), in-memory job queues, and frontend remain 100% untouched.

---

## 3. Verification & Compliance Checklist

- [x] Zero behavior regression across API routes and UI actions.
- [x] All 22 files expected by `verify.py` exist and pass verification.
- [x] TypeScript compiler (`npx tsc --noEmit`) passes with **0 errors**.
- [x] Vite production bundle (`npm run build`) builds cleanly with **0 errors**.
- [x] Automated regression suite (`tests/test_regression.py`) passes all tests.
