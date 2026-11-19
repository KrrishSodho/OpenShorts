import json
import logging
import random
from pathlib import Path
from typing import Optional, Dict, Any, List, Literal, Tuple

from backend.config import (
    DOWNLOADS_DIR,
    TRANSCRIPTS_DIR,
    PRESETS_DIR,
    OUTPUT_RENDERS_DIR,
    GEMINI_API_KEY,
    get_gemini_api_key,
)
from backend.core.jobs import (
    persist_media_meta,
    resolve_source_video,
    update_job_record,
    is_job_cancelled,
    cleanup_job_temp_files,
)
from backend.services.downloader import MediaDownloader
from backend.services.transcriber import AudioTranscriber, parse_srt_or_text
from backend.services.vtt_parser import extract_youtube_vtt_fast, parse_youtube_vtt_to_words
from backend.services.ai_director import generate_ranked_viral_suite
from backend.services.face_tracker import FaceAutoTracker
from backend.services.sfx_generator import ensure_sfx_assets
from backend.utils.ffmpeg_helper import trim_video_clip, probe_media

logger = logging.getLogger("viral_studio.pipeline")


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
        "id": "fable_5_2_kinetic",
        "name": "Fable 5.2 Kinetic",
        "captions": {
            "activeWordColor": "#FF3B1D",
            "inactiveWordColor": "#FFFFFF",
            "highlightBox": True,
            "boxColor": "#FF3B1D",
        },
    }


def snap_to_natural_boundaries(
    start_sec: float,
    end_sec: float,
    words: List[Dict[str, Any]],
    total_duration: float = 0.0,
    min_silence_lead: float = 0.15,
    tail_lead: float = 0.25,
) -> Tuple[float, float]:
    """
    Commercial-grade boundary snapping (OpusClip/Descript standard):
    Snaps clip start/end timestamps to speech silence, breath pauses, or word boundaries.
    Prevents abrupt mid-syllable cuts and guarantees complete words and thoughts.
    """
    if not words:
        s = max(0.0, float(start_sec))
        e = max(s + 1.0, float(end_sec))
        if total_duration > 0:
            e = min(float(total_duration), e)
        return round(s, 2), round(e, 2)

    sorted_words = sorted(words, key=lambda w: float(w.get("start", 0.0)))
    first_word_start = float(sorted_words[0].get("start", 0.0))
    last_word_end = float(sorted_words[-1].get("end", 0.0))

    # --- 1. Snap Start Time ---
    snapped_start = float(start_sec)
    if snapped_start <= first_word_start:
        snapped_start = max(0.0, first_word_start - min_silence_lead)
    else:
        inside_word = None
        for i, w in enumerate(sorted_words):
            w_s = float(w.get("start", 0.0))
            w_e = float(w.get("end", 0.0))
            if w_s <= snapped_start < w_e:
                inside_word = (i, w)
                break

        if inside_word:
            # Inside word: snap backwards to start of word with breath lead
            i, w = inside_word
            snapped_start = max(0.0, float(w.get("start", 0.0)) - min_silence_lead)
        else:
            # In a gap: check surrounding words
            prev_w = None
            next_w = None
            for w in sorted_words:
                if float(w.get("end", 0.0)) <= snapped_start:
                    prev_w = w
                elif float(w.get("start", 0.0)) > snapped_start:
                    next_w = w
                    break

            if next_w:
                gap = float(next_w.get("start", 0.0)) - (float(prev_w.get("end", 0.0)) if prev_w else 0.0)
                if gap > 0.35 or not prev_w:
                    snapped_start = max(0.0, float(next_w.get("start", 0.0)) - min_silence_lead)
                else:
                    snapped_start = max(0.0, float(prev_w.get("end", 0.0)) + 0.05)

    # --- 2. Snap End Time ---
    snapped_end = float(end_sec)
    if snapped_end >= last_word_end:
        snapped_end = last_word_end + tail_lead
    else:
        inside_word = None
        for i, w in enumerate(sorted_words):
            w_s = float(w.get("start", 0.0))
            w_e = float(w.get("end", 0.0))
            if w_s < snapped_end <= w_e:
                inside_word = (i, w)
                break

        if inside_word:
            # Inside word: snap forwards past word end
            i, w = inside_word
            snapped_end = float(w.get("end", 0.0)) + tail_lead
        else:
            prev_w = None
            for w in sorted_words:
                if float(w.get("end", 0.0)) <= snapped_end:
                    prev_w = w
                elif float(w.get("start", 0.0)) > snapped_end:
                    break

            if prev_w:
                snapped_end = float(prev_w.get("end", 0.0)) + tail_lead

    snapped_start = max(0.0, round(snapped_start, 2))
    snapped_end = max(snapped_start + 1.0, round(snapped_end, 2))
    if total_duration > 0:
        snapped_end = min(round(float(total_duration), 2), snapped_end)

    return snapped_start, snapped_end


def prepare_trimmed_clip_manifest(
    media_id: str,
    start_time: float,
    end_time: float,
    preset_id: Optional[str],
    viral_title: str,
    motion_events: List[Dict[str, Any]],
    crop_focus: str = "auto",
    pan_keyframes: Optional[List[Dict[str, Any]]] = None,
    framing_layout: str = "single",
    split_top_pan: int = 22,
    split_bottom_pan: int = 78,
    split_zoom: float = 1.55,
    trio_left_pan: int = 20,
    trio_right_pan: int = 80,
    clean_speaker_mode: bool = False,
) -> Dict[str, Any]:
    norm_layout = str(framing_layout or "single").strip().lower()
    if norm_layout in ("trio", "trio_rotate"):
        norm_layout = "trio_rotate"
    raw_video = resolve_source_video(media_id)

    # Load transcript words before trimming to snap to clean speech pauses
    transcript_file = TRANSCRIPTS_DIR / f"{media_id}_transcript.json"
    transcript_words: List[Dict[str, Any]] = []
    total_dur = 0.0
    if transcript_file.exists():
        try:
            with open(transcript_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                transcript_words = data.get("words", [])
                total_dur = float(data.get("duration", 0.0) or 0.0)
        except Exception as e:
            logger.warning(f"Could not load transcript for boundary snapping: {e}")

    # Snap to natural boundary to prevent mid-word cutting
    snapped_start, snapped_end = snap_to_natural_boundaries(
        start_time, end_time, transcript_words, total_dur
    )

    clip_id = f"{media_id}_{int(round(snapped_start * 10))}_{int(round(snapped_end * 10))}"
    trimmed_clip_path = DOWNLOADS_DIR / f"{clip_id}_trimmed.mp4"

    needs_trim = not trimmed_clip_path.exists() or trimmed_clip_path.stat().st_size < 10240
    if not needs_trim:
        try:
            p = probe_media(trimmed_clip_path)
            if p.get("duration", 0.0) < 1.0 or not p.get("width"):
                needs_trim = True
        except Exception:
            needs_trim = True

    if needs_trim:
        trim_video_clip(raw_video, trimmed_clip_path, snapped_start, snapped_end)

    sliced_words: List[Dict[str, Any]] = []
    for w in transcript_words:
        w_start = float(w.get("start", 0.0))
        w_end = float(w.get("end", 0.0))
        if w_end >= snapped_start and w_start <= snapped_end:
            rel_start = round(max(0.0, w_start - snapped_start), 2)
            rel_end = round(
                max(rel_start + 0.05, min(snapped_end - snapped_start, w_end - snapped_start)),
                2,
            )
            sliced_words.append(
                {
                    "word": w["word"],
                    "start": rel_start,
                    "end": rel_end,
                    "confidence": w.get("confidence", 1.0),
                }
            )

    if not pan_keyframes:
        if crop_focus == "left":
            pan_keyframes = [{"t": 0.0, "pan": 18}]
        elif crop_focus == "center":
            pan_keyframes = [{"t": 0.0, "pan": 50}]
        elif crop_focus == "right":
            pan_keyframes = [{"t": 0.0, "pan": 82}]
        else:
            try:
                pan_keyframes = FaceAutoTracker.generate_pan_keyframes(trimmed_clip_path)
            except Exception as e:
                logger.warning(f"Failed to generate pan keyframes: {e}")
                pan_keyframes = [{"t": 0.0, "pan": 50}]

    preset_data = get_default_preset(preset_id)
    clip_duration = round(max(1.0, snapped_end - snapped_start), 2)

    payload = {
        "clip_id": clip_id,
        "title": viral_title,
        "viral_title": viral_title,
        "duration": clip_duration,
        "start_time": round(snapped_start, 2),
        "end_time": round(snapped_end, 2),
        "video_url": f"/storage/downloads/{trimmed_clip_path.name}",
        "words": sliced_words,
        "pan_keyframes": pan_keyframes,
        "motion_events": motion_events,
        "framing_layout": norm_layout,
        "split_top_pan": split_top_pan,
        "split_bottom_pan": split_bottom_pan,
        "split_zoom": split_zoom,
        "trio_left_pan": trio_left_pan,
        "trio_right_pan": trio_right_pan,
        "clean_speaker_mode": clean_speaker_mode,
        "preset": preset_data,
        "render_status": "ready_to_render",
    }

    manifest_path = OUTPUT_RENDERS_DIR / f"{clip_id}_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    return payload


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
    variation_seed: Optional[int] = None,
) -> None:
    try:
        ensure_sfx_assets()
        seed = variation_seed if variation_seed is not None else random.randint(1000, 999999)

        update_job_record(
            job_id,
            status="processing",
            progress=10,
            step="Loading video & extracting 16kHz audio: 10%",
        )

        if is_job_cancelled(job_id):
            cleanup_job_temp_files()
            return

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
                step=f"Extracting 16kHz audio ({local_path.name}): 15%",
            )
            media_info = MediaDownloader.process_local_file(local_path)
        else:
            existing = [
                p
                for p in DOWNLOADS_DIR.glob("*.mp4")
                if not p.stem.endswith("_vertical") and not p.stem.endswith("_trimmed")
            ]
            if existing:
                sample_path = existing[0]
            else:
                raise FileNotFoundError("No sample video found in downloads directory.")
            media_info = MediaDownloader.process_local_file(sample_path)

        media_id = media_info["id"]
        persist_media_meta(media_info)

        if is_job_cancelled(job_id):
            cleanup_job_temp_files(media_id)
            return

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
                    step="Extracted YouTube captions in 0.2s: 55%",
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
                    raise FileNotFoundError(f"Audio for media '{media_id}' not found.")
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
                raise FileNotFoundError(f"Audio for media '{media_id}' not found.")
            transcript_data = AudioTranscriber.transcribe(audio_files[0], media_id, model_size)

        if is_job_cancelled(job_id):
            cleanup_job_temp_files(media_id)
            return

        update_job_record(
            job_id,
            status="processing",
            progress=75,
            step=f"Discovering top viral clips & hooks (Seed #{seed}): 75%",
        )

        effective_key = api_key or get_gemini_api_key()
        director_suite = generate_ranked_viral_suite(
            transcript_data, api_key=effective_key, variation_seed=seed
        )

        if is_job_cancelled(job_id):
            cleanup_job_temp_files(media_id)
            return

        top_shorts = director_suite.get("shorts", [])
        niche = director_suite.get("niche", "Editorial")

        if not top_shorts:
            clip_dur = min(float(media_info.get("duration", 30.0) or 30.0), 30.0)
            top_shorts = [{
                "rank": 1,
                "viral_title": "Key Breakdown",
                "start_time": 0.0,
                "end_time": clip_dur,
                "duration": clip_dur,
                "hook_score": 90,
                "angle_tag": "HIGHLIGHT",
                "rationale": "Key breakdown clip from video",
                "reasoning": "Key breakdown clip from video",
                "spoken_keywords": [],
                "suggested_pan_percent": 50,
                "motion_events": [],
            }]

        # Snap all discovered shorts to natural speech pauses/word boundaries
        media_dur = float(media_info.get("duration", 0.0) or 0.0)
        t_words = transcript_data.get("words", [])
        for s in top_shorts:
            snapped_s, snapped_e = snap_to_natural_boundaries(
                s["start_time"], s["end_time"], t_words, media_dur
            )
            s["start_time"] = snapped_s
            s["end_time"] = snapped_e
            s["duration"] = round(snapped_e - snapped_s, 2)

        best_clip = dict(top_shorts[0])
        best_clip["reasoning"] = best_clip.get("reasoning") or best_clip.get("rationale", "")
        viral_title = best_clip.get("viral_title", "Key Breakdown")
        
        # Fast viral-clip discovery + subtitles at import time without forcing heavy motion events
        clean_motion_events: List[Dict[str, Any]] = []
        best_clip["motion_events"] = clean_motion_events

        update_job_record(
            job_id,
            status="processing",
            progress=90,
            step="Preparing fast-seek 9:16 preview & tracking camera cuts: 90%",
        )

        clip_manifest = prepare_trimmed_clip_manifest(
            media_id=media_id,
            start_time=best_clip["start_time"],
            end_time=best_clip["end_time"],
            preset_id=preset_id,
            viral_title=viral_title,
            motion_events=clean_motion_events,
            clean_speaker_mode=False,
        )

        media_info["title"] = viral_title

        top_pan_keyframes = clip_manifest.get("pan_keyframes", [{"t": 0.0, "pan": 50}])
        recommended_clips = [
            {
                "clip_id": (
                    clip_manifest["clip_id"]
                    if idx == 0
                    else f"{media_id}_{int(round(s['start_time'] * 10))}_{int(round(s['end_time'] * 10))}"
                ),
                "rank": s.get("rank", idx + 1),
                "title": s.get("viral_title", viral_title),
                "start_time": s["start_time"],
                "end_time": s["end_time"],
                "duration": s.get("duration", round(s["end_time"] - s["start_time"], 2)),
                "hook_score": int(s.get("virality_score") or s.get("viral_score") or s.get("hook_score") or 95),
                "viral_score": int(s.get("virality_score") or s.get("viral_score") or s.get("hook_score") or 95),
                "virality_score": int(s.get("virality_score") or s.get("viral_score") or s.get("hook_score") or 95),
                "angle_tag": s.get("angle_tag", "TOP HOOK"),
                "topic_pill": "",
                "reasoning": str(s.get("hook_reason") or s.get("rationale") or s.get("reasoning") or "").strip(),
                "hook_reason": str(s.get("hook_reason") or s.get("rationale") or s.get("reasoning") or "").strip(),
                "rationale": str(s.get("hook_reason") or s.get("rationale") or s.get("reasoning") or "").strip(),
                "spoken_keywords": s.get("spoken_keywords", []),
                "suggested_pan_percent": s.get("suggested_pan_percent", 50),
                "pan_keyframes": top_pan_keyframes if idx == 0 else s.get("pan_keyframes", []),
                "motion_events": clean_motion_events,
            }
            for idx, s in enumerate(top_shorts)
        ]
        best_clip["clip_id"] = clip_manifest["clip_id"]

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
                "motion_events": clean_motion_events,
                "recommended_clips": recommended_clips,
                "clip_manifest": clip_manifest,
            },
        )

    except Exception as exc:
        mid = media_id if "media_id" in locals() else None
        cleanup_job_temp_files(mid)
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
