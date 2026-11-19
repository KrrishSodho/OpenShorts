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
            total_span = max(0.2, s_end - s_start)
            # Commercial proportional timing: character length + punctuation pause weight
            weights = []
            for w in words:
                clean_len = max(1, len(re.sub(r'[^\w]', '', w)))
                trailing_pause = 0.0
                if w.endswith(('.', '!', '?')):
                    trailing_pause = 2.0
                elif w.endswith((',', ';', ':')):
                    trailing_pause = 1.0
                weights.append(clean_len + trailing_pause)
            
            total_weight = sum(weights) or float(len(words))
            current_cursor = s_start
            
            for w_i, (w, weight) in enumerate(zip(words, weights)):
                w_dur = total_span * (weight / total_weight)
                w_start = round(current_cursor, 2)
                # Ensure the last word extends up to s_end
                if w_i == len(words) - 1:
                    w_end = round(max(w_start + 0.05, s_end), 2)
                else:
                    w_end = round(max(w_start + 0.05, current_cursor + w_dur), 2)
                
                w_obj = {
                    "word": w.strip(),
                    "start": w_start,
                    "end": w_end,
                    "confidence": 1.0
                }
                seg_words.append(w_obj)
                all_words.append(w_obj)
                current_cursor += w_dur
                
        all_segments_dict.append({
            "id": idx + 1,
            "start": round(s_start, 2),
            "end": round(s_end, 2),
            "text": s_text,
            "words": seg_words
        })

    max_dur = all_segments_dict[-1]["end"] if all_segments_dict else 40.0
    sample_text = " ".join(s["text"] for s in all_segments_dict[:15]).lower()
    lang_hint = "en"
    if any(w in sample_text for w in (" cette ", " avec ", " pour ", " dans ", " vous ", " nous ")):
        lang_hint = "fr"
    elif any(w in sample_text for w in (" este ", " esta ", " para ", " como ", " por ", " que ")):
        lang_hint = "es"
    elif any(w in sample_text for w in (" nicht ", " dieser ", " diese ", " wird ", " haben ")):
        lang_hint = "de"
    elif re.search(r"[\u0600-\u06FF]", sample_text):
        lang_hint = "ur"
    elif re.search(r"[\u0900-\u097F]", sample_text):
        lang_hint = "hi"
    elif re.search(r"[\u4E00-\u9FFF]", sample_text):
        lang_hint = "zh"
    elif re.search(r"[\u0400-\u04FF]", sample_text):
        lang_hint = "ru"

    result = {
        "media_id": media_id,
        "language": lang_hint,
        "detected_language": lang_hint,
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
        """Transcribe audio track and return full text + word timestamps (with on-disk cache check)."""
        output_file = TRANSCRIPTS_DIR / f"{media_id}_transcript.json"
        if output_file.exists() and output_file.stat().st_size > 100:
            try:
                with open(output_file, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                if cached.get("words") and len(cached["words"]) > 0:
                    logger.info(
                        f"Reusing cached transcript for {media_id} ({len(cached['words'])} words). Skipping Whisper STT."
                    )
                    cached["transcript_json_path"] = str(output_file)
                    return cached
            except Exception as e:
                logger.warning(f"Failed reading cached transcript for {media_id}: {e}")

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
            vad_parameters=dict(min_silence_duration_ms=500),
            condition_on_previous_text=False,
            compression_ratio_threshold=2.4,
            no_speech_threshold=0.6,
            temperature=[0.0, 0.2]
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
