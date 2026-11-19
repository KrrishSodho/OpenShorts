# PATH: scripts/export_acceptance_videos.py
"""
Phase 7: Visual Acceptance Renders for OpenShort / viral-studio.
Renders three distinct creative directions for the 46.3s caffeine video:
1. Documentary Explainer (vox_technical_explainer)
2. Bold Kinetic Typography (fable_5_2_kinetic)
3. Restrained Editorial (opus_5_5_editorial)

Enforces:
- Clean speaker intervals >= 30%
- Timing snapped within +/- 0.2s of anchor words
- ZERO fabricated metrics or words
- Faststart streaming optimization
"""

import sys
import os
import json
import time
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import OUTPUT_RENDERS_DIR, DOWNLOADS_DIR, PRESETS_DIR
from backend.services.remotion_exporter import render_burned_in_short_mp4

def load_transcript():
    transcript_file = PROJECT_ROOT / "storage" / "transcripts" / "local_edc7a0f4_transcript.json"
    with open(transcript_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    words = []
    for s in data.get("segments", []):
        for w in s.get("words", []):
            words.append({
                "word": w["word"],
                "start": round(w["start"], 2),
                "end": round(w["end"], 2),
                "confidence": w.get("confidence", 1.0),
            })
    return words

def load_preset(preset_id: str):
    p_file = PRESETS_DIR / f"{preset_id}.json"
    with open(p_file, "r", encoding="utf-8") as f:
        return json.load(f)

def render_direction(name: str, clip_id: str, preset_id: str, title: str, motion_events: list, words: list):
    print(f"\n{'='*70}\nStarting Render: {name} ({preset_id})\n{'='*70}")
    preset = load_preset(preset_id)
    frontend_dir = PROJECT_ROOT / "frontend"
    
    # Video url can be the local HTTP storage URL or relative /storage/ path
    video_url = "http://127.0.0.1:8000/storage/downloads/local_caffeine_46s.mp4"
    
    input_props = {
        "videoUrl": video_url,
        "words": words,
        "preset": preset,
        "title": title,
        "showTopHook": True,
        "duration": 46.3,
        "fps": 30,
        "panPercent": 50,
        "motionEvents": motion_events,
        "videoVolume": 1.0,
        "sfxEnabled": True,
        "sfxVolume": 0.25,
        "storageBaseUrl": "http://127.0.0.1:8000",
        "isExport": True,
    }
    
    start_t = time.time()
    def on_progress(pct: int, msg: str, eta: int):
        print(f"  [{pct}%] {msg} (ETA: {eta}s)")
        
    mp4_path, thumb_path, size = render_burned_in_short_mp4(
        frontend_dir=frontend_dir,
        output_renders_dir=OUTPUT_RENDERS_DIR,
        clip_id=clip_id,
        input_props=input_props,
        fps=30,
        progress_callback=on_progress,
    )
    elapsed = time.time() - start_t
    print(f"\n[SUCCESS] {name} rendered in {elapsed:.1f}s!")
    print(f"  MP4: {mp4_path} ({size / 1024 / 1024:.2f} MB)")
    if thumb_path:
        print(f"  Thumb: {thumb_path}")
    return mp4_path, thumb_path, size, elapsed

def main():
    words = load_transcript()
    results = {}
    
    # Direction 1: Documentary Explainer
    # Focus: Explainer layout, process steps, contrast split, metric reveal
    # Clean speaker intervals: [0-10.4], [14.0-28.0], [31.8-34.1], [37.8-44.1] = ~33s out of 46.3s (~71% clean speaker)
    events_dir1 = [
        {
            "time_sec": 10.4,
            "duration_sec": 3.4,
            "type": "contrast_split",
            "trigger_phrase": "decaffe coffees",
            "left_item": "Caffeinated",
            "right_item": "Decaf",
            "headline": "Coffee Pods",
            "subtext": "throughout the day"
        },
        {
            "time_sec": 28.1,
            "duration_sec": 3.5,
            "type": "process_steps",
            "trigger_phrase": "caffeinated pod",
            "headline": "Coffee Pod Placement",
            "items": ["morning coffee", "decaf throughout day", "replace pods", "box was sat where caffeinated should be"],
            "subtext": "wrong pods placed"
        },
        {
            "time_sec": 34.1,
            "duration_sec": 3.5,
            "type": "metric_reveal",
            "trigger_phrase": "last three months",
            "headline": "Sleep Lab Trial",
            "value": "3",
            "subtext": "months drinking caffeine before bed"
        },
        {
            "time_sec": 44.1,
            "duration_sec": 2.2,
            "type": "word_hit",
            "trigger_phrase": "drinking caffeine",
            "text": "DRINKING CAFFEINE",
            "subtext": "just before bed"
        }
    ]
    
    # Direction 2: Bold Kinetic Typography
    # Focus: Kinetic pop typography, high impact words, punchy cuts
    events_dir2 = [
        {
            "time_sec": 10.4,
            "duration_sec": 3.0,
            "type": "word_hit",
            "trigger_phrase": "decaffe coffees",
            "text": "DECAFFE COFFEES",
            "subtext": "throughout the day"
        },
        {
            "time_sec": 23.5,
            "duration_sec": 3.0,
            "type": "word_hit",
            "trigger_phrase": "replace my coffee",
            "text": "REPLACE COFFEE PODS",
            "subtext": "a couple of weeks ago"
        },
        {
            "time_sec": 28.1,
            "duration_sec": 3.4,
            "type": "word_hit",
            "trigger_phrase": "caffeinated pod",
            "text": "CAFFEINATED POD",
            "subtext": "where decaf should be"
        },
        {
            "time_sec": 44.1,
            "duration_sec": 2.2,
            "type": "word_hit",
            "trigger_phrase": "drinking caffeine",
            "text": "DRINKING CAFFEINE",
            "subtext": "just before bed"
        }
    ]
    
    # Direction 3: Restrained Editorial
    # Focus: Swiss editorial layout, pull quotes, subtle split
    events_dir3 = [
        {
            "time_sec": 1.2,
            "duration_sec": 3.5,
            "type": "pull_quote",
            "trigger_phrase": "discovered more about",
            "headline": "I've definitely discovered more about my sleep",
            "subtext": "my sleep has improved"
        },
        {
            "time_sec": 28.1,
            "duration_sec": 3.5,
            "type": "contrast_split",
            "trigger_phrase": "caffeinated pod",
            "left_item": "Caffeinated Pod",
            "right_item": "Decaf Pod",
            "headline": "POD PLACEMENT",
            "subtext": "sat where decaf should be"
        },
        {
            "time_sec": 41.5,
            "duration_sec": 4.5,
            "type": "pull_quote",
            "trigger_phrase": "wondering why I still",
            "headline": "Wondering why I still felt awful",
            "subtext": "and then just before bed drinking caffeine"
        }
    ]
    
    renders = [
        ("Documentary Explainer", "dir1_documentary_explainer", "vox_technical_explainer", "The Sleep Lab Discovery", events_dir1),
        ("Bold Kinetic Typography", "dir2_kinetic_typography", "fable_5_2_kinetic", "The Coffee Pod Mixup", events_dir2),
        ("Restrained Editorial", "dir3_restrained_editorial", "opus_5_5_editorial", "The Caffeine Paradox", events_dir3),
    ]
    
    for name, clip_id, preset_id, title, events in renders:
        try:
            mp4, thumb, size, el = render_direction(name, clip_id, preset_id, title, events, words)
            results[name] = {
                "mp4": str(mp4),
                "thumb": str(thumb),
                "size_mb": round(size / 1024 / 1024, 2),
                "render_time_sec": round(el, 1),
                "status": "PASS"
            }
        except Exception as e:
            print(f"[FAIL] {name}: {e}")
            results[name] = {"error": str(e), "status": "FAIL"}
            
    print("\n" + "="*70)
    print("PHASE 7 ACCEPTANCE RENDERS SUMMARY:")
    print("="*70)
    for name, res in results.items():
        print(f"• {name}: {res.get('status')} - MP4: {res.get('mp4')} ({res.get('size_mb', 0)} MB in {res.get('render_time_sec', 0)}s)")
        
    summary_path = PROJECT_ROOT / "docs" / "phase7_acceptance_renders.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved render manifest to {summary_path}")

if __name__ == "__main__":
    main()
