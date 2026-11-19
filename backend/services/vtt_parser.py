import re
import sys
import html
import json
import subprocess
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from backend.config import TRANSCRIPTS_DIR

logger = logging.getLogger("viral_studio.vtt")

TIMECODE_RE = re.compile(
    r"(?P<start>\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(?P<end>\d{2}:\d{2}:\d{2}\.\d{3})"
)
INLINE_WORD_RE = re.compile(r"<(\d{2}:\d{2}:\d{2}\.\d{3})><c>\s*([^<]+?)\s*</c>")
HTML_TAG_RE = re.compile(r"<[^>]+>")

NOISE_TOKENS = {
    "[music]",
    "[musique]",
    "[applause]",
    "[applaudissements]",
    "[ __ ]",
    "[laughter]",
    "[rires]",
    ">>",
    "--",
}


def _clean_token(text: str) -> str:
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
        sys.executable,
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

        orig_tracks = [f for f in vtt_files if "-orig" in f.name]
        if orig_tracks:
            chosen = orig_tracks[0]
            logger.info(f"Selected original audio VTT track: {chosen.name}")
            return chosen

        vtt_files.sort(
            key=lambda p: (
                0 if not (".en." in p.name and "-orig" not in p.name) else 1,
                p.stat().st_size * -1,
            )
        )
        logger.info(f"Selected best available VTT track: {vtt_files[0].name}")
        return vtt_files[0]
    except Exception as e:
        logger.warning(f"Fast VTT extraction skipped/failed, will fallback to Whisper: {e}")
        return None


def parse_youtube_vtt_to_words(vtt_path: Path, media_id: str) -> Dict[str, Any]:
    """
    Converts YouTube VTT into Remotion's TranscriptData schema with zero duplication
    and persists the transcript JSON to TRANSCRIPTS_DIR.
    """
    raw_text = vtt_path.read_text(encoding="utf-8", errors="replace")
    blocks = re.split(r"\n\s*\n", raw_text)

    words: List[Dict[str, Any]] = []
    segments: List[Dict[str, Any]] = []
    last_word_start = -1.0

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

    detected_lang = "auto"
    m_lang = re.search(r"\.([a-z]{2})(?:-[a-zA-Z]+)?(?:\.vtt)?$", vtt_path.name)
    if m_lang:
        detected_lang = m_lang.group(1).lower()

    duration = words[-1]["end"] if words else 0.0
    result = {
        "media_id": media_id,
        "language": detected_lang,
        "detected_language": detected_lang,
        "duration": duration,
        "text": " ".join(w["word"] for w in words),
        "words": words,
        "segments": segments,
        "source": "youtube_vtt_zero_latency",
    }

    output_file = TRANSCRIPTS_DIR / f"{media_id}_transcript.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    return result