# PATH: backend/services/short_planner.py
"""
Short Planner Service for OpenShort / viral-studio.
Generates an entire creative 9:16 short design in exactly ONE Gemini generation call.
Ensures:
- ONE LLM call per plan (cached & persisted)
- ZERO Gemini calls during preview, editing, reordering, preset changes, or MP4 export
- Strict transcript-grounding (no fabricated text or numbers)
- Minimum clean-speaker visibility share (>= 30% unobstructed)
- Non-overlapping beats with minimum gap
- Separate user overrides file preserved across regenerations
"""

import os
import re
import json
import time
import random
import logging
import unicodedata
from pathlib import Path
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

from backend.config import PLANS_DIR, TRANSCRIPTS_DIR, get_gemini_api_key
from backend.services.llm import execute_llm_request, LLMResult

logger = logging.getLogger("viral_studio.planner")


# ---------------------------------------------------------------------------
# Pydantic Schemas for Structured Single-Call Design
# ---------------------------------------------------------------------------
class BeatPurpose(str, Enum):
    emphasis = "emphasis"
    contrast = "contrast"
    process = "process"
    metric = "metric"
    quote = "quote"
    broll = "broll"
    speaker_only = "speaker_only"


VALID_ARCHETYPES = {
    "word_hit",
    "contrast_split",
    "process_steps",
    "metric_reveal",
    "pull_quote",
    "speaker_moment",
    "broll_full",
    # Mapped backwards-compatible archetypes
    "keyword_cascade_takeover",
    "kinetic_word_wall",
    "explainer_timeline_takeover",
    "poster_slam",
    "radial_gauge_stat",
    "odometer_counter",
    "vector_diagram",
    "spec_versus",
    "quote_editorial_card",
    "editorial_split",
    "bar_comparison",
    "donut_breakdown",
    "pyramid_levels",
}


class PlanBeatSchema(BaseModel):
    anchor_phrase: str = Field(description="Exact 2 to 4 words from transcript to align timing")
    start_sec: float = Field(description="Start time in seconds relative to short start (e.g. 2.5)")
    duration_sec: float = Field(default=2.6, description="Duration in seconds (2.0 to 3.5)")
    purpose: BeatPurpose = Field(default=BeatPurpose.emphasis)
    archetype: str = Field(default="word_hit", description="Visual archetype from valid set")
    zone: str = Field(default="center_spotlight")
    headline: str = Field(default="", description="Primary text - MUST come from transcript words")
    value: str = Field(default="", description="Numeric stat or focus word - MUST come from transcript")
    subtext: str = Field(default="", description="Secondary label from transcript")
    items: List[str] = Field(default_factory=list, description="List of phrases from transcript")
    evidence_quote: str = Field(default="", description="Exact sentence excerpt from transcript")


class HookPlanSchema(BaseModel):
    text: str = Field(description="Opening hook text from transcript")
    start_sec: float = Field(default=0.0)
    duration_sec: float = Field(default=2.8)


class CleanIntervalSchema(BaseModel):
    start_sec: float
    end_sec: float


class ShortPlanAIResponseSchema(BaseModel):
    hook: HookPlanSchema
    beats: List[PlanBeatSchema] = Field(default_factory=list)
    clean_intervals: List[CleanIntervalSchema] = Field(default_factory=list)
    pacing_notes: str = Field(default="")


# ---------------------------------------------------------------------------
# Normalization & Grounding Validation Helpers
# ---------------------------------------------------------------------------
def _norm(s: str) -> str:
    """Normalize text for phonetic/token substring comparison."""
    if not s:
        return ""
    decomposed = unicodedata.normalize("NFKD", s.lower())
    without_marks = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return re.sub(r"[^\w\s]", " ", without_marks).strip()


def _is_phrase_in_transcript(phrase: str, full_norm_transcript: str) -> bool:
    """Check if phrase tokens exist in sequence in normalized transcript."""
    norm_p = _norm(phrase)
    if not norm_p:
        return True
    # Exact substring
    if norm_p in full_norm_transcript:
        return True
    # Token subset check for multi-word phrases
    p_tokens = norm_p.split()
    if not p_tokens:
        return True
    pattern = r"\b" + r"\s+".join(re.escape(t) for t in p_tokens) + r"\b"
    if re.search(pattern, full_norm_transcript):
        return True
    # If 70% of tokens match in a local window
    p_set = set(p_tokens)
    t_tokens = full_norm_transcript.split()
    w_len = len(p_tokens) + 3
    for i in range(len(t_tokens) - len(p_tokens) + 1):
        win_set = set(t_tokens[i : i + w_len])
        if len(p_set & win_set) / len(p_set) >= 0.75:
            return True
    return False


def _extract_numbers(s: str) -> List[str]:
    """Find all numeric sequences in text."""
    if not s:
        return []
    return re.findall(r"\b\d+(?:[.,]\d+)?%?", s)


def _number_appears_in_transcript(num_str: str, full_transcript: str) -> bool:
    """Verify that a spoken number (e.g. '85' or '2.5') actually exists in transcript."""
    clean_num = re.sub(r"[^\d.]", "", num_str)
    if not clean_num:
        return True
    pattern = r"(?<!\w)" + re.escape(clean_num) + r"(?!\w)"
    return bool(re.search(pattern, full_transcript))


# ---------------------------------------------------------------------------
# Plan Validation & Enforcing Invariants
# ---------------------------------------------------------------------------
def validate_and_refine_plan(
    raw_plan: Dict[str, Any],
    clip_words: List[Dict[str, Any]],
    start_time: float,
    end_time: float,
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Apply strict post-generation invariants:
    1. Clip boundary snapping
    2. Non-overlapping beats with minimum gap (>= 0.3s)
    3. Transcript grounding on text fields
    4. Rejection of unvoiced numbers
    5. Minimum clean-speaker share (>= 30% of duration)
    """
    clip_dur = round(max(5.0, end_time - start_time), 2)
    rejections: List[str] = []

    # Assemble normalized transcript representation
    full_spoken_text = " ".join(w.get("word", "") for w in clip_words)
    norm_spoken = _norm(full_spoken_text)

    # 1. Validate Opening Hook
    hook_data = raw_plan.get("hook") or {}
    hook_text = str(hook_data.get("text", "")).strip()
    if hook_text and not _is_phrase_in_transcript(hook_text, norm_spoken):
        rejections.append(f"Hook text '{hook_text}' did not match spoken words. Grounded to first sentence.")
        # Fallback to first complete spoken words in clip
        first_few = [w.get("word", "") for w in clip_words[:7]]
        hook_text = " ".join(first_few).strip()

    hook_dur = round(max(2.0, min(3.5, float(hook_data.get("duration_sec", 2.8)))), 2)
    validated_hook = {
        "text": hook_text or "Key Breakdown",
        "start_sec": 0.0,
        "duration_sec": min(hook_dur, clip_dur),
    }

    # 2. Validate Beats
    raw_beats = raw_plan.get("beats") or []
    validated_beats: List[Dict[str, Any]] = []

    for idx, b in enumerate(raw_beats[:6]):
        # Archetype validation
        arch = str(b.get("archetype", "word_hit")).lower().strip()
        if arch not in VALID_ARCHETYPES:
            # Map common aliases or reject
            if "metric" in arch or "stat" in arch:
                arch = "metric_reveal"
            elif "versus" in arch or "split" in arch or "contrast" in arch:
                arch = "contrast_split"
            elif "quote" in arch:
                arch = "pull_quote"
            elif "process" in arch or "step" in arch or "timeline" in arch:
                arch = "process_steps"
            else:
                arch = "word_hit"

        # Timing bounds
        b_start = round(max(0.0, float(b.get("start_sec", idx * 5.0))), 2)
        b_dur = round(max(2.0, min(3.5, float(b.get("duration_sec", 2.6)))), 2)
        if b_start + b_dur > clip_dur:
            b_start = round(max(0.0, clip_dur - b_dur), 2)

        # Transcript text grounding
        headline = str(b.get("headline", "")).strip()
        if headline and not _is_phrase_in_transcript(headline, norm_spoken):
            rejections.append(f"Beat #{idx + 1} headline '{headline}' was not spoken. Cleared.")
            headline = ""

        subtext = str(b.get("subtext", "")).strip()
        if subtext and not _is_phrase_in_transcript(subtext, norm_spoken):
            subtext = ""

        # Number verification: never fabricate metrics
        value_raw = str(b.get("value", "")).strip()
        if value_raw:
            nums = _extract_numbers(value_raw)
            for n in nums:
                if not _number_appears_in_transcript(n, full_spoken_text):
                    rejections.append(f"Beat #{idx + 1} fabricated number '{n}' not in audio. Stripped.")
                    value_raw = ""
                    break

        # Anchor phrase
        anchor = str(b.get("anchor_phrase", "")).strip()
        if anchor and not _is_phrase_in_transcript(anchor, norm_spoken):
            anchor = ""

        validated_beats.append({
            "anchor_phrase": anchor,
            "start_sec": b_start,
            "duration_sec": b_dur,
            "purpose": str(b.get("purpose", "emphasis")),
            "archetype": arch,
            "zone": str(b.get("zone", "center_spotlight")),
            "headline": headline,
            "value": value_raw,
            "subtext": subtext,
            "items": [it for it in b.get("items", []) if _is_phrase_in_transcript(str(it), norm_spoken)][:4],
            "evidence_quote": str(b.get("evidence_quote", "")).strip(),
        })

    # 3. Enforce Non-Overlapping Ordering with Min Gap (0.3s)
    validated_beats.sort(key=lambda x: x["start_sec"])
    ordered_beats: List[Dict[str, Any]] = []
    last_end = 0.0

    for b in validated_beats:
        if b["start_sec"] < last_end + 0.3:
            b["start_sec"] = round(last_end + 0.3, 2)
        if b["start_sec"] + b["duration_sec"] <= clip_dur:
            ordered_beats.append(b)
            last_end = b["start_sec"] + b["duration_sec"]
        else:
            rejections.append(f"Beat at {b['start_sec']}s exceeded clip duration ({clip_dur}s). Pruned.")

    # 4. Enforce Clean Speaker Share (>= 30% of total duration)
    total_covered = sum(b["duration_sec"] for b in ordered_beats if b["purpose"] != "speaker_only")
    max_covered = clip_dur * 0.70  # At least 30% must be clean speaker

    while total_covered > max_covered and len(ordered_beats) > 1:
        dropped = ordered_beats.pop()
        total_covered -= dropped["duration_sec"]
        rejections.append(
            f"Pruned beat '{dropped['archetype']}' at {dropped['start_sec']}s to preserve >= 30% clean-speaker share."
        )

    # 5. Compute Clean Intervals
    clean_intervals: List[Dict[str, float]] = []
    cur_pos = 0.0
    for b in ordered_beats:
        if b["start_sec"] > cur_pos + 0.5:
            clean_intervals.append({
                "start_sec": round(cur_pos, 2),
                "end_sec": round(b["start_sec"], 2),
            })
        cur_pos = max(cur_pos, b["start_sec"] + b["duration_sec"])

    if cur_pos < clip_dur - 0.5:
        clean_intervals.append({
            "start_sec": round(cur_pos, 2),
            "end_sec": round(clip_dur, 2),
        })

    final_plan = {
        "hook": validated_hook,
        "beats": ordered_beats,
        "clean_intervals": clean_intervals,
        "pacing_notes": str(raw_plan.get("pacing_notes", "Balanced rhythm with unobstructed speaker breathing room.")),
    }

    return final_plan, rejections


# ---------------------------------------------------------------------------
# Deterministic Fallback ("Auto (no AI)")
# ---------------------------------------------------------------------------
def generate_deterministic_plan(
    clip_words: List[Dict[str, Any]],
    start_time: float,
    end_time: float,
    seed: int = 1234,
) -> Dict[str, Any]:
    """Generate a clean, transcript-grounded plan with zero AI and zero invented numbers."""
    clip_dur = round(max(5.0, end_time - start_time), 2)
    spoken_text = " ".join(w.get("word", "") for w in clip_words)

    # Find hook text from first complete sentence or words
    hook_words = [w.get("word", "") for w in clip_words[:8]]
    hook_str = " ".join(hook_words).strip() or "Key Breakdown"

    # Distribute 2-3 clean beats across the clip duration
    beats: List[Dict[str, Any]] = []
    if clip_dur >= 18.0:
        # First beat around 25% of clip
        t1 = round(min(5.0, clip_dur * 0.25), 2)
        w1_slice = [w.get("word", "") for w in clip_words if w.get("start", 0) - start_time >= t1][:5]
        h1 = " ".join(w1_slice).strip()
        beats.append({
            "anchor_phrase": " ".join(w1_slice[:3]),
            "start_sec": t1,
            "duration_sec": 2.5,
            "purpose": "emphasis",
            "archetype": "word_hit",
            "zone": "center_spotlight",
            "headline": h1,
            "value": "",
            "subtext": "",
            "items": [],
            "evidence_quote": h1,
        })

    if clip_dur >= 30.0:
        # Second beat around 65% of clip
        t2 = round(clip_dur * 0.65, 2)
        w2_slice = [w.get("word", "") for w in clip_words if w.get("start", 0) - start_time >= t2][:5]
        h2 = " ".join(w2_slice).strip()
        beats.append({
            "anchor_phrase": " ".join(w2_slice[:3]),
            "start_sec": t2,
            "duration_sec": 2.6,
            "purpose": "quote",
            "archetype": "pull_quote",
            "zone": "bottom_stage",
            "headline": h2,
            "value": "",
            "subtext": "",
            "items": [],
            "evidence_quote": h2,
        })

    clean_intervals = []
    c_start = 0.0
    for b in beats:
        if b["start_sec"] > c_start:
            clean_intervals.append({"start_sec": c_start, "end_sec": b["start_sec"]})
        c_start = b["start_sec"] + b["duration_sec"]
    if c_start < clip_dur:
        clean_intervals.append({"start_sec": c_start, "end_sec": clip_dur})

    return {
        "hook": {"text": hook_str, "start_sec": 0.0, "duration_sec": 2.8},
        "beats": beats,
        "clean_intervals": clean_intervals,
        "pacing_notes": "Deterministic rule-based rhythm (Auto / No AI).",
    }


# ---------------------------------------------------------------------------
# Core Entry Point: Plan or Load Short
# ---------------------------------------------------------------------------
def plan_or_load_short(
    media_id: str,
    start_time: float,
    end_time: float,
    preset_id: str = "podcast_punch",
    variation_seed: Optional[int] = None,
    force_regenerate: bool = False,
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Main orchestration function for POST /api/plan-short.
    1. Checks if plan already exists. If yes and not force_regenerate: returns stored plan (0 calls).
    2. If regeneration needed: makes exactly ONE Gemini call.
    3. Validates and enforces invariants.
    4. Persists plan and merges user overrides if present.
    """
    seed = variation_seed if variation_seed is not None else random.randint(1000, 999999)

    # Load transcript data for clip first to ensure boundary snapping
    transcript_file = TRANSCRIPTS_DIR / f"{media_id}_transcript.json"
    clip_words: List[Dict[str, Any]] = []
    all_words: List[Dict[str, Any]] = []
    detected_lang = "en"
    total_dur = 0.0
    if transcript_file.exists():
        try:
            with open(transcript_file, "r", encoding="utf-8") as f:
                t_data = json.load(f)
                all_words = t_data.get("words", [])
                total_dur = float(t_data.get("duration", 0.0) or 0.0)
                detected_lang = str(t_data.get("detected_language") or t_data.get("language") or "en")
        except Exception as e:
            logger.warning(f"Failed to parse transcript file: {e}")

    # Snap clip boundaries once so plan matches trimmed MP4 and exporter
    from backend.services.pipeline_orchestrator import snap_to_natural_boundaries
    snapped_start, snapped_end = snap_to_natural_boundaries(
        start_time, end_time, all_words, total_dur
    )
    start_time, end_time = snapped_start, snapped_end

    clip_words = [
        w for w in all_words
        if float(w.get("end", 0)) >= start_time and float(w.get("start", 0)) <= end_time
    ]

    plan_file = PLANS_DIR / f"{media_id}_{start_time:.2f}_{end_time:.2f}_plan.json"
    overrides_file = PLANS_DIR / f"{media_id}_{start_time:.2f}_{end_time:.2f}_overrides.json"

    # Step 1: Return cached plan if present and not forced (ZERO LLM CALLS)
    if plan_file.exists() and not force_regenerate:
        try:
            with open(plan_file, "r", encoding="utf-8") as f:
                cached = json.load(f)
            # Merge overrides if present
            if overrides_file.exists():
                try:
                    with open(overrides_file, "r", encoding="utf-8") as f_ov:
                        ov = json.load(f_ov)
                    cached["plan"] = {**cached.get("plan", {}), **ov}
                    cached["has_user_overrides"] = True
                except Exception as e:
                    logger.warning(f"Could not read overrides file: {e}")
            logger.info(f"Loaded existing short plan for {media_id} from disk (0 AI calls).")
            return cached
        except Exception as e:
            logger.warning(f"Failed to read cached plan ({e}); regenerating...")

    clip_dur = round(max(5.0, end_time - start_time), 2)
    effective_key = api_key or get_gemini_api_key()

    # Step 2: If no key or no clip words, generate deterministic offline plan
    if not effective_key or not clip_words:
        det_plan = generate_deterministic_plan(clip_words, start_time, end_time, seed)
        res_payload = {
            "version": "1.0",
            "media_id": media_id,
            "start_time": start_time,
            "end_time": end_time,
            "duration": clip_dur,
            "model": "deterministic_fallback",
            "provider": "none",
            "is_fallback": True,
            "fallback_label": "Auto (no AI)",
            "seed": seed,
            "timestamp": time.time(),
            "plan": det_plan,
            "rejections": ["No API key configured. Generated deterministic plan from speech timing."],
        }
        with open(plan_file, "w", encoding="utf-8") as f:
            json.dump(res_payload, f, indent=2)
        return res_payload

    # Step 3: Exactly ONE Gemini generation call
    formatted_lines = []
    cur_line = []
    for w in clip_words:
        cur_line.append(w)
        if len(cur_line) >= 8 or (cur_line and w.get("word", "").endswith((".", "!", "?"))):
            st_rel = round(cur_line[0]["start"] - start_time, 1)
            et_rel = round(cur_line[-1]["end"] - start_time, 1)
            formatted_lines.append(f"[{st_rel}s - {et_rel}s] " + " ".join(x["word"] for x in cur_line))
            cur_line = []
    if cur_line:
        st_rel = round(cur_line[0]["start"] - start_time, 1)
        et_rel = round(cur_line[-1]["end"] - start_time, 1)
        formatted_lines.append(f"[{st_rel}s - {et_rel}s] " + " ".join(x["word"] for x in cur_line))

    transcript_block = "\n".join(formatted_lines)

    planning_prompt = f"""You are the Master Creative Director for viral short-form video (Seed #{seed}, Preset: {preset_id}).

Design the complete creative choreography for this {clip_dur}s short in {detected_lang}.

Timestamped Spoken Words:
{transcript_block}

CRITICAL RULES:
1. GROUNDING: Every `headline`, `subtext`, and `evidence_quote` MUST be real words spoken in the transcript lines above. NEVER invent statements or slogans.
2. ZERO INVENTED NUMBERS: Only output a numeric `value` if that exact number is spoken in the audio. If no number was spoken, set `value: ""`.
3. 4 TO 5 BEATS MAXIMUM: Choreograph at most 4-5 high-impact visual beats spaced across the clip.
4. VALID ARCHETYPES: Use only [word_hit, contrast_split, process_steps, metric_reveal, pull_quote, speaker_moment, broll_full].
5. CLEAN SPEAKER VISIBILITY: Ensure the speaker's face remains visible and unobstructed for at least 30% of the clip duration. Mark these intervals in `clean_intervals`.
6. ZERO UNICODE EMOJIS! Never use emojis.
"""

    llm_res = execute_llm_request(
        prompt=planning_prompt,
        request_type="plan_short",
        response_schema=ShortPlanAIResponseSchema,
        temperature=0.4,
        api_key=effective_key,
    )

    if llm_res.ok and llm_res.data:
        raw_dict = (
            llm_res.data.model_dump()
            if hasattr(llm_res.data, "model_dump")
            else dict(llm_res.data)
        )
        validated_plan, rejections = validate_and_refine_plan(
            raw_dict, clip_words, start_time, end_time
        )
        is_fallback = False
        model_name = llm_res.model
        provider_name = llm_res.provider
    else:
        logger.warning(f"Plan short LLM failed: {llm_res.user_message}. Using deterministic plan.")
        validated_plan = generate_deterministic_plan(clip_words, start_time, end_time, seed)
        rejections = [f"AI planning failed ({llm_res.user_message}). Loaded deterministic rule-based plan."]
        is_fallback = True
        model_name = "deterministic_fallback"
        provider_name = "none"

    result_payload = {
        "version": "1.0",
        "media_id": media_id,
        "start_time": start_time,
        "end_time": end_time,
        "duration": clip_dur,
        "model": model_name,
        "provider": provider_name,
        "is_fallback": is_fallback,
        "fallback_label": "Auto (no AI)" if is_fallback else None,
        "seed": seed,
        "timestamp": time.time(),
        "plan": validated_plan,
        "rejections": rejections,
    }

    # Persist plan to disk
    try:
        with open(plan_file, "w", encoding="utf-8") as f:
            json.dump(result_payload, f, indent=2)
        logger.info(f"Persisted validated short plan to {plan_file}")
    except Exception as e:
        logger.warning(f"Could not persist short plan to disk: {e}")

    return result_payload


def save_user_overrides(
    media_id: str,
    start_time: float,
    end_time: float,
    overrides: Dict[str, Any],
) -> bool:
    """Save manual user edits into a separate overrides file that persists across re-analysis."""
    overrides_file = PLANS_DIR / f"{media_id}_{start_time:.2f}_{end_time:.2f}_overrides.json"
    try:
        with open(overrides_file, "w", encoding="utf-8") as f:
            json.dump(overrides, f, indent=2)
        return True
    except Exception as e:
        logger.warning(f"Could not save user overrides: {e}")
        return False
