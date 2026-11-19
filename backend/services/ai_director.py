import os
import re
import ast
import json
import random
import logging
import threading
import unicodedata
from pathlib import Path
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple, Literal, get_args
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types

from backend.services.broll_fetcher import fetch_broll_clip
from backend.services.llm import (
    execute_llm_request,
    get_last_ai_trace,
    LAST_AI_TRACE,
    _TRACE_LOCK as TRACE_LOCK,
)

logger = logging.getLogger("viral_studio.director")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env", override=True)
load_dotenv(PROJECT_ROOT / "backend" / ".env", override=True)

ValidMotionType = Literal[
    "keyword_cascade_takeover",
    "explainer_timeline_takeover",
    "kinetic_word_wall",
    "poster_slam",
    "radial_gauge_stat",
    "odometer_counter",
    "vector_diagram",
    "spec_versus",
    "quote_editorial_card",
    "editorial_split",
    "broll_full",
    "carousel_cards",
    "bar_comparison",
    "donut_breakdown",
    "pyramid_levels",
    "custom_ai_scene",
]

ValidZone = Literal[
    "full_takeover",
    "top_stage",
    "bottom_stage",
    "center_spotlight",
    "floating_overlay",
]

ValidTransition = Literal[
    "spring_slam",
    "curtain_wipe",
    "slide_left",
    "glitch_flash",
    "type_reveal",
]

ValidSfx = Literal[
    "whoosh",
    "pop",
    "click",
    "chime",
    "riser",
    "blip",
    "shutter",
    "sub_hit",
    "none",
]


class MotionEventStructured(BaseModel):
    anchor_phrase: str = Field(description="Exact 2 to 4 spoken words from transcript to anchor beat start")
    duration_sec: float = Field(default=2.5, description="Duration in seconds (typically 2.0 to 3.2)")
    type: ValidMotionType = Field(description="Exact motion graphics archetype")
    zone: ValidZone = Field(description="Screen placement zone")
    transition: ValidTransition = Field(default="spring_slam", description="Entry animation transition")
    sfx_type: ValidSfx = Field(default="whoosh", description="Audio sound effect")
    label: Optional[str] = Field(default="", description="Category section tag in transcript language, or empty")
    text: Optional[str] = Field(default="", description="Headline text for the archetype")
    subtext: Optional[str] = Field(default="", description="Optional subtext or supporting insight for editorial/gauge/quote/card archetypes")
    value: Optional[str] = Field(default="", description="Metric value or primary focus word")
    keywords: Optional[List[str]] = Field(default=None, description="Only for keyword_cascade or kinetic_word_wall: 3-5 escalating phrases")
    items: Optional[List[str]] = Field(default=None, description="Only for explainer_timeline: 3-5 process step items")
    left_item: Optional[str] = Field(default="", description="Only for spec_versus: left column concept")
    right_item: Optional[str] = Field(default="", description="Only for spec_versus: right column concept")
    broll_query: Optional[str] = Field(default="", description="Only for broll_full: search query for stock footage")
    bw_filter: Optional[bool] = Field(default=False, description="True for poster_slam black-and-white background")


class WordIndexRangeSchema(BaseModel):
    start_idx: int = Field(description="0-based start word index in clip")
    end_idx: int = Field(description="0-based end word index in clip (inclusive)")


class StoryStructureSchema(BaseModel):
    hook_line: WordIndexRangeSchema = Field(description="Word index range for the opening hook line")
    setup: WordIndexRangeSchema = Field(description="Word index range for the premise and context")
    turn: WordIndexRangeSchema = Field(description="Word index range for the twist, turning point, or contradiction")
    payoff: WordIndexRangeSchema = Field(description="Word index range for the punchline, resolution, or conclusion")
    explanation: str = Field(description="1-2 sentences on how hook, turn, and payoff connect into a viral narrative")


class MomentRoleEnum(str, Enum):
    hook = "hook"
    setup = "setup"
    turn = "turn"
    payoff = "payoff"
    emphasis = "emphasis"


class MomentTreatmentEnum(str, Enum):
    emphasis = "emphasis"
    contrast = "contrast"
    list = "list"
    number = "number"
    quote = "quote"


class StoryMomentSchema(BaseModel):
    start_word_idx: int = Field(description="Start word index from numbered transcript")
    end_word_idx: int = Field(description="End word index from numbered transcript (inclusive)")
    secondary_ranges: List[WordIndexRangeSchema] = Field(
        default_factory=list,
        description="Required for 'contrast' (1 additional range) or 'list' (1 to 3 additional ranges)"
    )
    role: MomentRoleEnum = Field(description="Narrative role: hook | setup | turn | payoff | emphasis")
    treatment: MomentTreatmentEnum = Field(description="Visual treatment: emphasis | contrast | list | number | quote")
    reason: str = Field(description="One sentence on why this moment deserves a visual")


class CleanIntervalSecSchema(BaseModel):
    start_sec: float = Field(description="Start time in seconds relative to clip start")
    end_sec: float = Field(description="End time in seconds relative to clip start")


class StoryMotionPlanResponseSchema(BaseModel):
    story: StoryStructureSchema
    moments: List[StoryMomentSchema] = Field(
        default_factory=list,
        description="0 to 5 on-screen moments decided strictly by content need"
    )
    clean_intervals: List[CleanIntervalSecSchema] = Field(
        default_factory=list,
        description="Unobstructed intervals where speaker face is visible"
    )


class RemixMotionResponseSchema(BaseModel):
    motion_events: List[MotionEventStructured]


class ShortStructured(BaseModel):
    start_line: int
    end_line: int
    viral_title: str
    virality_score: int
    hook_reason: str
    angle_tag: Optional[str] = "TOP HOOK"
    spoken_keywords: Optional[List[str]] = None


class DirectorSuiteResponseSchema(BaseModel):
    niche: str
    detected_language: str
    shorts: List[ShortStructured]

VALID_SFX = set(get_args(ValidSfx))
SFX_ALIASES = {
    "tick": "click",
    "tap": "click",
    "snap": "shutter",
    "swoosh": "whoosh",
    "slide": "whoosh",
    "boom": "sub_hit",
    "drop": "sub_hit",
    "hit": "sub_hit",
    "ding": "chime",
    "bell": "chime",
    "rise": "riser",
    "swoop": "riser",
    "beep": "blip",
    "bloop": "blip",
    "silent": "none",
    "off": "none",
    "muted": "none",
}

VALID_ZONES = {"top_stage", "center_spotlight", "bottom_stage", "floating_overlay", "full_takeover"}
VALID_TRANSITIONS = ["spring_slam", "curtain_wipe", "slide_left", "glitch_flash", "type_reveal"]

STYLE_DIRECTIVES = [
    "DOCUMENTARY EXPLAINER: Favor `explainer_timeline_takeover`, `keyword_cascade_takeover`, and `radial_gauge_stat` across full_takeover and bottom_stage zones.",
    "KINETIC BRUTALIST: Favor `kinetic_word_wall`, `poster_slam` (yellow marker circle), and `spec_versus` across center_spotlight and full_takeover zones.",
    "SWISS EDITORIAL: Favor `quote_editorial_card`, `vector_diagram`, `editorial_split`, and `odometer_counter` across top_stage and bottom_stage zones.",
    "HIGH-CONTRAST MIX: Alternate boldly between `full_takeover` keyword cascades, `top_stage` diagrams, `bottom_stage` timelines, and `center_spotlight` yellow-circle callouts.",
]


def _safe_parse_json(raw_text: Optional[str]) -> Optional[Dict[str, Any]]:
    if not raw_text or not raw_text.strip():
        return None
    text = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE).strip()
    
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        snippet = text[first_brace : last_brace + 1]
        try:
            parsed = json.loads(snippet)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

    try:
        parsed = ast.literal_eval(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    logger.warning("Failed to safely parse AI JSON response, falling back.")
    return None


def _normalize_sfx(raw: Any) -> str:
    s = str(raw or "whoosh").strip().lower()
    if s in VALID_SFX:
        return s
    return SFX_ALIASES.get(s, "whoosh")


def _default_zone_for_type(ev_type: str) -> str:
    if ev_type in ("keyword_cascade_takeover", "explainer_timeline_takeover", "kinetic_word_wall", "broll_full"):
        return "full_takeover"
    if ev_type in ("poster_slam", "myth_twist", "editorial_split", "carousel_cards"):
        return "center_spotlight"
    if ev_type in (
        "odometer_counter",
        "stat_counter",
        "vector_diagram",
        "spec_versus",
        "versus_card",
        "radial_gauge_stat",
        "broll_split",
        "power_meter_gauge",
        "showcase_carousel",
        "bar_comparison",
        "donut_breakdown",
        "pyramid_levels",
        "custom_ai_scene",
    ):
        return "top_stage"
    if ev_type == "quote_editorial_card":
        return "bottom_stage"
    return "floating_overlay"


def _extract_label_and_sub(val: Any) -> Tuple[str, str]:
    if val is None:
        return "", ""
    if isinstance(val, dict):
        lbl = str(val.get("label") or val.get("text") or val.get("title") or val.get("name") or "").strip()
        sub = str(val.get("sub") or val.get("subtext") or val.get("detail") or "").strip()
        return lbl, sub
    s = str(val).strip()
    if s.startswith("{") and s.endswith("}"):
        try:
            parsed = ast.literal_eval(s)
            if isinstance(parsed, dict):
                lbl = str(parsed.get("label") or parsed.get("text") or parsed.get("title") or "").strip()
                sub = str(parsed.get("sub") or parsed.get("subtext") or parsed.get("detail") or "").strip()
                return lbl, sub
        except Exception:
            pass
    return s, ""


def build_transcript_lines(
    words: List[Dict[str, Any]], max_gap: float = 0.85, max_chars: int = 88
) -> List[Dict[str, Any]]:
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


def _norm_tok(s: str) -> str:
    decomposed = unicodedata.normalize("NFKD", s.lower())
    without_marks = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return re.sub(r"[^\w]", "", without_marks, flags=re.UNICODE)


def align_phrase_to_clip_time(
    phrase: str,
    clip_words: List[Dict[str, Any]],
    fallback_sec: float,
    clip_start: float,
    extra_tokens: Optional[List[str]] = None,
) -> float:
    if not clip_words:
        return fallback_sec

    norm_words = [_norm_tok(w.get("word", "")) for w in clip_words]
    target_tokens = [_norm_tok(t) for t in phrase.split() if _norm_tok(t)] if phrase else []

    if target_tokens:
        n_target = len(target_tokens)
        for i in range(len(norm_words) - n_target + 1):
            if norm_words[i : i + n_target] == target_tokens:
                word_t = float(clip_words[i]["start"]) - clip_start
                return round(max(0.0, word_t - 0.06), 2)

        best_score = 0.0
        best_idx = -1
        target_set = set(target_tokens)
        win = max(n_target, n_target + 2)
        for i in range(len(norm_words)):
            window_tokens = set(norm_words[i : i + win])
            overlap = len(target_set & window_tokens) / len(target_set)
            if overlap > best_score:
                best_score = overlap
                best_idx = i

        if best_score >= 0.6 and best_idx >= 0:
            word_t = float(clip_words[best_idx]["start"]) - clip_start
            return round(max(0.0, word_t - 0.06), 2)

    if extra_tokens:
        clean_extras = [_norm_tok(t) for t in extra_tokens if len(_norm_tok(t)) >= 4]
        if clean_extras:
            best_dist = float("inf")
            best_t = None
            for idx, nw in enumerate(norm_words):
                if nw in clean_extras:
                    word_t = float(clip_words[idx]["start"]) - clip_start
                    dist = abs(word_t - fallback_sec)
                    if dist < best_dist and dist <= 4.0:
                        best_dist = dist
                        best_t = word_t
            if best_t is not None:
                return round(max(0.0, best_t - 0.06), 2)

    return fallback_sec


def _normalize_motion_events(
    raw_events: List[Dict[str, Any]],
    clip_words: List[Dict[str, Any]],
    clip_start: float,
    clip_dur: float,
    viral_title: str,
    rng: random.Random,
) -> List[Dict[str, Any]]:
    events = []
    last_end_time = -1.5

    for ev_idx, ev in enumerate(raw_events):
        anchor = str(ev.get("anchor_phrase") or ev.get("trigger_phrase") or "").strip()
        fallback_t = 0.0 if ev_idx == 0 else float(ev.get("time_sec", ev_idx * 5.5))
        if fallback_t > clip_dur and clip_start <= fallback_t <= clip_start + clip_dur:
            fallback_t -= clip_start

        candidate_extras = []
        if ev.get("value"):
            candidate_extras.extend(str(ev["value"]).split())
        if ev.get("text"):
            candidate_extras.extend(str(ev["text"]).split())
        if ev.get("keywords") and isinstance(ev["keywords"], list):
            candidate_extras.extend([str(k) for k in ev["keywords"]])

        aligned_t = (
            0.0
            if ev_idx == 0 and not anchor
            else align_phrase_to_clip_time(
                anchor, clip_words, fallback_t, clip_start, extra_tokens=candidate_extras
            )
        )
        aligned_t = round(max(0.0, min(aligned_t, max(0.0, clip_dur - 2.0))), 2)
        dur_s = round(max(1.8, min(3.8, float(ev.get("duration_sec", 2.6)))), 2)

        if ev_idx > 0 and aligned_t < last_end_time + 1.4:
            aligned_t = round(last_end_time + 1.4, 2)
        if aligned_t >= clip_dur - 1.4:
            continue

        ev_type = str(ev.get("type", "editorial_split")).strip()
        if ev_type in VALID_ZONES:
            ev_type = "poster_slam" if ev_type == "center_spotlight" else "editorial_split"
        elif ev_type == "ui_checklist":
            ev_type = "spec_versus"
        elif ev_type == "power_meter_gauge":
            ev_type = "radial_gauge_stat"
        elif ev_type == "showcase_carousel":
            ev_type = "explainer_timeline_takeover"

        broll_q = str(ev.get("broll_query") or "").strip()
        broll_url: Optional[str] = None

        if broll_q and ev_type in ("broll_full", "broll_split"):
            broll_url = fetch_broll_clip(broll_q, duration_sec=max(5.0, dur_s + 1.5))
            if not broll_url:
                if ev.get("keywords"):
                    ev_type = "keyword_cascade_takeover"
                elif ev.get("vector_nodes"):
                    ev_type = "vector_diagram"
                elif ev.get("left_item") and ev.get("right_item"):
                    ev_type = "spec_versus"
                else:
                    ev_type = "poster_slam"

        if ev_type == "clean_speaker":
            continue

        raw_zone = str(ev.get("zone") or "").strip().lower()
        zone = raw_zone if raw_zone in VALID_ZONES else _default_zone_for_type(ev_type)

        raw_trans = str(ev.get("transition") or "").strip().lower()
        transition = raw_trans if raw_trans in VALID_TRANSITIONS else rng.choice(VALID_TRANSITIONS)

        left_lbl, left_sub = _extract_label_and_sub(ev.get("left_item"))
        right_lbl, right_sub = _extract_label_and_sub(ev.get("right_item"))

        raw_items = ev.get("items")
        clean_items: Optional[List[str]] = None
        if isinstance(raw_items, list) and raw_items:
            clean_items = []
            for it in raw_items:
                it_lbl, it_sub = _extract_label_and_sub(it)
                val_str = it_sub or it_lbl
                if val_str:
                    clean_items.append(val_str.upper())
        elif left_sub or right_sub:
            clean_items = [
                (left_sub or left_lbl).upper(),
                (right_sub or right_lbl).upper(),
            ]

        raw_kws = ev.get("keywords")
        clean_kws: List[str] = []
        if isinstance(raw_kws, list):
            for k in raw_kws:
                k_lbl, _ = _extract_label_and_sub(k)
                if k_lbl:
                    clean_kws.append(k_lbl.upper())

        text_str, _ = _extract_label_and_sub(ev.get("text"))
        sub_str, _ = _extract_label_and_sub(ev.get("subtext"))
        lbl_str, _ = _extract_label_and_sub(ev.get("label"))
        val_str, _ = _extract_label_and_sub(ev.get("value"))

        last_end_time = aligned_t + dur_s

        events.append(
            {
                "time_sec": aligned_t,
                "duration_sec": dur_s,
                "type": ev_type,
                "zone": zone,
                "transition": transition,
                "trigger_phrase": anchor,
                "text": text_str,
                "subtext": sub_str,
                "label": lbl_str.upper(),
                "value": val_str.upper(),
                "left_item": left_lbl.upper(),
                "right_item": right_lbl.upper(),
                "left_ratio": ev.get("left_ratio"),
                "right_ratio": ev.get("right_ratio"),
                "items": clean_items,
                "keywords": clean_kws or None,
                "chart_values": ev.get("chart_values"),
                "vector_nodes": ev.get("vector_nodes"),
                "vector_links": ev.get("vector_links"),
                "layout_ratio": ev.get("layout_ratio"),
                "broll_query": broll_q or None,
                "broll_url": broll_url,
                "sfx_type": _normalize_sfx(ev.get("sfx_type")),
                "bw_filter": bool(ev.get("bw_filter", ev_type == "poster_slam")),
                "zoom": bool(ev.get("zoom", False)),
            }
        )

    # Ensure no beat collides with the opening hook (0.0s - 2.8s) and preserve spacing between beats
    events.sort(key=lambda x: x["time_sec"])
    cur_min_t = 3.0 if (len(events) > 0 and clip_dur >= 6.0) else 0.0
    spaced_events: List[Dict[str, Any]] = []
    for ev in events:
        if ev["time_sec"] < cur_min_t:
            ev["time_sec"] = round(cur_min_t, 2)
        dur = float(ev.get("duration_sec", 2.5))
        if ev["time_sec"] + dur > clip_dur:
            remaining = clip_dur - ev["time_sec"]
            if remaining >= 1.8:
                ev["duration_sec"] = round(remaining, 2)
                spaced_events.append(ev)
                cur_min_t = ev["time_sec"] + ev["duration_sec"] + 1.0
            break
        spaced_events.append(ev)
        cur_min_t = ev["time_sec"] + dur + 1.0

    return spaced_events


def _attach_procedural_scene_to_event(ev: Dict[str, Any], idx: int) -> None:
    """Ensure every motion event has a fully-valid declarative ProceduralScene (v2.0)."""
    ev_type = ev.get("type", "editorial_split")
    time_sec = float(ev.get("time_sec", 0.0))
    duration_sec = float(ev.get("duration_sec", 2.4))
    text = str(ev.get("text") or ev.get("headline") or ev.get("value") or "").strip()

    p_intent = "focal_statement"
    p_nodes: List[Dict[str, Any]] = []
    p_connectors: List[Dict[str, Any]] = []

    if ev_type in ("contrast_split", "spec_versus", "versus_card"):
        p_intent = "comparison"
        left_txt = str(ev.get("left_item") or text or "BEFORE").strip()
        right_txt = str(ev.get("right_item") or ev.get("subtext") or "AFTER").strip()
        p_nodes.append({"id": f"node_{idx}_left", "role": "primary", "text": left_txt})
        p_nodes.append({"id": f"node_{idx}_right", "role": "counterpart", "text": right_txt})
        p_connectors.append({
            "from_id": f"node_{idx}_left",
            "to_id": f"node_{idx}_right",
            "type": "vs_divider",
            "label": "VS",
        })
    elif ev_type in ("process_steps", "explainer_timeline_takeover"):
        p_intent = "sequence"
        items = ev.get("items") or [text]
        for s_i, item_txt in enumerate(items[:5]):
            p_nodes.append({
                "id": f"node_{idx}_step_{s_i}",
                "role": "primary" if s_i == 0 else "secondary",
                "text": str(item_txt).strip(),
            })
            if s_i > 0:
                p_connectors.append({
                    "from_id": f"node_{idx}_step_{s_i - 1}",
                    "to_id": f"node_{idx}_step_{s_i}",
                    "type": "arrow",
                })
    elif ev_type in ("metric_reveal", "radial_gauge_stat") or ev.get("value"):
        val_str = str(ev.get("value") or "").strip()
        if any(c.isdigit() for c in val_str):
            p_intent = "stat_callout"
            p_nodes.append({
                "id": f"node_{idx}_metric",
                "role": "primary",
                "text": text or "VERIFIED METRIC",
                "metric": {"value": val_str, "display_text": val_str},
            })
        else:
            p_intent = "focal_statement"
            p_nodes.append({"id": f"node_{idx}_focal", "role": "primary", "text": text or val_str})
    elif ev_type in ("pull_quote", "quote_editorial_card"):
        p_intent = "verbatim_quote"
        p_nodes.append({"id": f"node_{idx}_quote", "role": "primary", "text": text.strip('"\'')})
    else:
        p_intent = "focal_statement"
        p_nodes.append({"id": f"node_{idx}_focal", "role": "primary", "text": text or "KEY POINT"})
        sub = str(ev.get("subtext") or "").strip()
        if sub:
            p_nodes.append({"id": f"node_{idx}_sub", "role": "secondary", "text": sub})

    ev["procedural_scene"] = {
        "version": "2.0",
        "scene_id": f"moment_{idx}_{int(time_sec * 10)}",
        "time_sec": time_sec,
        "duration_sec": duration_sec,
        "narrative_role": "emphasis",
        "purpose": "Spoken highlight",
        "visual_intent": p_intent,
        "word_range": [0, 0],
        "nodes": p_nodes,
        "connectors": p_connectors,
        "spatial_zone": "safe_center",
        "backdrop_style": "minimal_blur",
    }


def _make_window_short(
    rank: int,
    start_sec: float,
    end_sec: float,
    words: List[Dict[str, Any]],
    rng: random.Random,
    niche_hint: str = "Insight",
) -> Dict[str, Any]:
    clip_dur = round(max(5.0, end_sec - start_sec), 2)
    slice_words = [
        w for w in words if float(w.get("end", 0)) >= start_sec and float(w.get("start", 0)) <= end_sec
    ]

    stopwords = {
        "that", "this", "with", "from", "have", "they", "will", "what", "there", "about",
        "would", "could", "should", "their", "which", "where", "when", "then", "them", "these",
        "those", "been", "being", "were", "your", "ours", "just", "more", "some", "like", "know",
        "really", "very", "much", "dans", "avec", "pour", "cette", "mais", "vous", "nous", "leur",
        "comme", "faire", "plus", "tout", "tous", "bien", "aussi", "donc", "alors", "parce",
        "definitely", "discovered", "thing", "things", "going", "think",
    }
    used_words = set()

    def get_window_data(w_start: float, w_end: float, max_kws: int = 2) -> Tuple[str, List[str], Optional[str]]:
        """Extract natural spoken phrase, non-repeating keywords, and any genuine percentage/numeric stat."""
        local_words = [
            w for w in slice_words
            if float(w.get("end", 0)) >= (start_sec + w_start - 0.5)
            and float(w.get("start", 0)) <= (start_sec + w_end + 1.2)
        ]
        raw_text = " ".join([w.get("word", "").strip() for w in local_words if w.get("word")]).strip()

        # Check for genuine percentage in spoken words (NEVER invent fake stats or convert bare numbers)
        pct_match = re.search(r"(?<!\w)(\d{1,3}(?:[.,]\d+)?)\s*(?:%|(?:percent|per\s*cent|pour\s*cent)\b)", raw_text, re.IGNORECASE)
        found_pct = None
        if pct_match:
            found_pct = f"{pct_match.group(1)}%"
        else:
            slice_text = " ".join([w.get("word", "").strip() for w in slice_words if w.get("word")])
            slice_pct = re.search(r"(?<!\w)(\d{1,3}(?:[.,]\d+)?)\s*(?:%|(?:percent|per\s*cent|pour\s*cent)\b)", slice_text, re.IGNORECASE)
            if slice_pct:
                found_pct = f"{slice_pct.group(1)}%"

        # Build natural spoken multi-word phrase (3 to 6 words)
        clean_tokens = [w.get("word", "").strip() for w in local_words if w.get("word")]
        phrase = " ".join(clean_tokens[:5]).strip()
        if len(phrase) < 6:
            phrase = " ".join([w.get("word", "").strip() for w in slice_words[:5] if w.get("word")]).strip()

        # Extract keywords
        kws: List[str] = []
        for w in local_words:
            raw = re.sub(r"[^\w]", "", w.get("word", ""), flags=re.UNICODE).lower()
            if len(raw) >= 4 and raw not in stopwords and raw not in used_words and raw not in kws:
                kws.append(raw)
                used_words.add(raw)
                if len(kws) >= max_kws:
                    break

        if len(kws) < max_kws:
            for w in slice_words:
                raw = re.sub(r"[^\w]", "", w.get("word", ""), flags=re.UNICODE).lower()
                if len(raw) >= 4 and raw not in stopwords and raw not in used_words and raw not in kws:
                    kws.append(raw)
                    used_words.add(raw)
                    if len(kws) >= max_kws:
                        break

        clean_backup = ["Insight", "Strategy", "Focus", "Action", "Scale", "Impact", "Method", "Result"]
        for b in clean_backup:
            if len(kws) >= max_kws:
                break
            b_low = b.lower()
            if b_low not in used_words and b_low not in kws:
                kws.append(b_low)
                used_words.add(b_low)

        return phrase, kws, found_pct

    # Natural title strictly derived from spoken transcript words
    spoken_lead = " ".join([w.get("word", "").strip() for w in slice_words[:6] if w.get("word")]).strip()
    title = spoken_lead if len(spoken_lead) >= 8 else niche_hint

    angles = ["TOP HOOK", "DEBATE", "EMOTIONAL", "CONTRARIAN", "INSIGHT"]
    scores = [98, 95, 92, 89, 86]

    events: List[Dict[str, Any]] = []

    # BEAT 1: NEVER place in 0.0s - 2.8s when opening hook is active!
    t_beat1 = round(max(3.0, min(clip_dur * 0.12, clip_dur - 4.5)), 1)
    if t_beat1 + 2.2 < clip_dur:
        b1_phrase, b1_kws, _ = get_window_data(t_beat1, t_beat1 + 2.4, max_kws=2)
        kw1 = b1_kws[0].title() if b1_kws else niche_hint
        events.append({
            "time_sec": t_beat1,
            "duration_sec": 2.4,
            "type": "editorial_split",
            "zone": "center_spotlight",
            "transition": "spring_slam",
            "trigger_phrase": kw1.lower(),
            "text": b1_phrase or kw1.upper(),
            "subtext": "",
            "label": "",
            "value": kw1.upper(),
            "sfx_type": "whoosh",
            "bw_filter": False,
            "zoom": False,
        })

    # BEAT 2: Only use radial_gauge_stat if a REAL % was spoken; otherwise use kinetic_word_wall / poster_slam
    t_beat2 = round(max(t_beat1 + 3.4, min(clip_dur * 0.40, clip_dur - 5.5)), 1)
    if t_beat2 + 2.2 < clip_dur:
        b2_phrase, b2_kws, b2_pct = get_window_data(t_beat2, t_beat2 + 2.6, max_kws=3)
        kw2 = b2_kws[0].title() if b2_kws else "Insight"
        if b2_pct:
            events.append({
                "time_sec": t_beat2,
                "duration_sec": 2.4,
                "type": "radial_gauge_stat",
                "zone": "top_stage",
                "transition": "spring_slam",
                "trigger_phrase": kw2.lower(),
                "text": b2_phrase or kw2.upper(),
                "subtext": "",
                "label": "",
                "value": b2_pct,
                "sfx_type": "pop",
                "bw_filter": False,
                "zoom": False,
            })
        else:
            events.append({
                "time_sec": t_beat2,
                "duration_sec": 2.4,
                "type": "kinetic_word_wall",
                "zone": "center_spotlight",
                "transition": "spring_slam",
                "trigger_phrase": kw2.lower(),
                "text": b2_phrase or kw2.upper(),
                "keywords": [k.upper() for k in b2_kws[:3]],
                "subtext": "",
                "label": "",
                "value": kw2.upper(),
                "sfx_type": "pop",
                "bw_filter": False,
                "zoom": False,
            })

    # BEAT 3: Explainer timeline takeover with spoken phrases
    t_beat3 = round(max(t_beat2 + 3.4, min(clip_dur * 0.68, clip_dur - 4.0)), 1)
    if t_beat3 + 2.2 < clip_dur:
        b3_phrase, b3_kws, _ = get_window_data(t_beat3, t_beat3 + 3.0, max_kws=3)
        kw3 = b3_kws[0].title() if b3_kws else "Scale"
        cascade_items = [k.upper() for k in b3_kws] if len(b3_kws) >= 2 else [kw3.upper(), "SYSTEM", "METRIC"]
        events.append({
            "time_sec": t_beat3,
            "duration_sec": 2.8,
            "type": "explainer_timeline_takeover",
            "zone": "full_takeover",
            "transition": "slide_left",
            "trigger_phrase": kw3.lower(),
            "text": b3_phrase or kw3.upper(),
            "subtext": "",
            "label": "",
            "value": kw3.upper(),
            "items": cascade_items,
            "sfx_type": "click",
            "bw_filter": False,
            "zoom": False,
        })

    # BEAT 4: Clean poster slam (NEVER nonsensical spec_versus pairs like THREE VS MONTHS)
    t_beat4 = round(max(t_beat3 + 3.4, min(clip_dur * 0.88, clip_dur - 2.2)), 1)
    if t_beat4 + 2.0 <= clip_dur:
        b4_phrase, b4_kws, _ = get_window_data(t_beat4, t_beat4 + 2.4, max_kws=2)
        kw4 = b4_kws[0].title() if b4_kws else "Impact"
        events.append({
            "time_sec": t_beat4,
            "duration_sec": 2.2,
            "type": "poster_slam",
            "zone": "center_spotlight",
            "transition": "curtain_wipe",
            "trigger_phrase": kw4.lower(),
            "text": b4_phrase or kw4.upper(),
            "subtext": "",
            "label": "",
            "value": kw4.upper(),
            "sfx_type": "sub_hit",
            "bw_filter": True,
            "zoom": False,
        })

    all_kws = list(used_words)
    v_score = scores[(rank - 1) % len(scores)]
    v_reason = f"Key spoken segment focusing on {', '.join(all_kws[:3]) or niche_hint.lower()}."
    return {
        "rank": rank,
        "hook_score": v_score,
        "viral_score": v_score,
        "virality_score": v_score,
        "hook_reason": v_reason,
        "rationale": v_reason,
        "reasoning": v_reason,
        "angle_tag": angles[(rank - 1) % len(angles)],
        "topic_pill": "",
        "viral_title": title,
        "start_time": round(start_sec, 2),
        "end_time": round(end_sec, 2),
        "duration": clip_dur,
        "spoken_keywords": all_kws or [niche_hint.lower()],
        "suggested_pan_percent": 50,
        "motion_events": events,
    }


def _compile_deterministic_fallback(
    lines: List[Dict[str, Any]], words: List[Dict[str, Any]], total_duration: float, seed: int, with_motion_events: bool = False
) -> Dict[str, Any]:
    rng = random.Random(seed)
    if total_duration <= 60.0:
        num_clips = 1
    elif total_duration <= 120.0:
        num_clips = 3
    else:
        num_clips = 5

    target_len = min(total_duration, 44.0)
    if num_clips > 1:
        step = max(0.0, (total_duration - target_len) / (num_clips - 1))
    else:
        step = 0.0

    shorts = []
    for i in range(num_clips):
        st = round(i * step, 2) if i > 0 else 0.0
        st = max(0.0, min(st, max(0.0, total_duration - 5.0)))
        et = round(min(total_duration, st + target_len), 2)
        if et - st < 4.0 and total_duration >= 5.0:
            st = 0.0
            et = round(total_duration, 2)
        s_obj = _make_window_short(i + 1, st, et, words, rng)
        if not with_motion_events:
            s_obj["motion_events"] = []
        shorts.append(s_obj)

    return {
        "niche": "Podcast",
        "episode_summary": "Top ranked spoken segments across the episode.",
        "shorts": shorts,
    }


def _call_gemini_models(
    effective_key: str,
    prompt: str,
    temperature: float = 0.68,
    response_schema: Optional[Any] = None,
    preferred_model: Optional[str] = None,
) -> Optional[str]:
    """Execute AI Director prompt via unified LLM layer."""
    res = execute_llm_request(
        prompt=prompt,
        request_type="director",
        temperature=temperature,
        response_schema=response_schema,
        preferred_model=preferred_model,
        api_key=effective_key,
    )
    if res.ok and res.raw_text:
        return res.raw_text
    return None


def generate_ranked_viral_suite(
    transcript_data: Dict[str, Any],
    api_key: str = "",
    variation_seed: Optional[int] = None,
) -> Dict[str, Any]:
    seed = variation_seed if variation_seed is not None else random.randint(1000, 999999)
    rng = random.Random(seed)
    style_directive = STYLE_DIRECTIVES[seed % len(STYLE_DIRECTIVES)]

    effective_key = (
        api_key or os.getenv("GEMINI_API_KEY", "")
    ).strip().strip('"').strip("'")

    words = transcript_data.get("words", [])
    total_duration = float(transcript_data.get("duration", 60.0))
    detected_lang = str(
        transcript_data.get("detected_language") or transcript_data.get("language") or "same as transcript"
    ).strip()

    lines = build_transcript_lines(words)
    if not lines:
        segments = transcript_data.get("segments", [])
        lines = [
            {"line": idx + 1, "start": s["start"], "end": s["end"], "text": s["text"]}
            for idx, s in enumerate(segments)
        ]

    if not effective_key:
        return _compile_deterministic_fallback(lines, words, total_duration, seed)

    formatted_transcript = "\n".join(
        f"{item['line']}| [{item['start']:.1f}s - {item['end']:.1f}s] {item['text']}"
        for item in lines[:3000]
    )

    is_long_video = total_duration > 120.0
    required_count = 5 if total_duration > 240.0 else (3 if is_long_video else 1)

    prompt = f"""
You are an Elite Social Media Producer and Viral Video Director.
Focus: Identify high-retention candidate shorts with strong narrative hooks, clear setups, and rewarding payoffs.

Analyze this timestamped transcript (Language: {detected_lang}, Total Duration: {total_duration:.1f}s, Lines: {len(lines)}):

{formatted_transcript}

Identify the TOP {required_count} most compelling, high-retention candidate shorts from this video (each 30s to 50s duration).
Select distinct moments with high curiosity, emotional revelation, dramatic tension, surprising statements, or practical value.

Return a JSON object with this EXACT structure:
{{
  "niche": "Detected 2-word content niche",
  "detected_language": "{detected_lang}",
  "shorts": [
    {{
      "start_line": 1,
      "end_line": 12,
      "viral_title": "4-to-6 Word High-CTR Punchy Hook Title in {detected_lang}",
      "virality_score": 98,
      "hook_reason": "1-sentence explanation of why this segment hooks viewers",
      "angle_tag": "TOP HOOK",
      "spoken_keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
    }}
  ]
}}

CRITICAL REQUIREMENTS:
1. NON-OVERLAPPING: Every short must be distinct across different parts of the video (30s to 50s duration each).
2. REAL SPOKEN BOUNDARIES: start_line and end_line must point to clean sentence/thought beginnings and ends from the transcript lines above.
3. LANGUAGE LOCK: viral_title, hook_reason, and angle_tag MUST be in {detected_lang}. NEVER use English boilerplate words like 'SUPERPOWERS', 'CAPACITY', 'PIPELINE', 'SPEC', 'PLAN', 'BUILD', 'TEST', 'STATUS', or 'MOMENT #'.
4. ZERO MOTION GRAPHICS: Do NOT output motion graphics, transitions, or visual effects at this stage. Keep discovery ultra-fast.
"""

    raw_text = _call_gemini_models(
        effective_key,
        prompt,
        temperature=0.65,
        response_schema=DirectorSuiteResponseSchema,
        preferred_model="gemini-3.5-flash-lite",
    )
    suite = _safe_parse_json(raw_text) if raw_text else None
    if not suite or not isinstance(suite, dict) or not suite.get("shorts"):
        return _compile_deterministic_fallback(lines, words, total_duration, seed)

    line_map = {item["line"]: item for item in lines}
    normalized_shorts: List[Dict[str, Any]] = []
    used_ranges: List[Tuple[float, float]] = []

    for idx, short in enumerate(suite.get("shorts", [])[:5]):
        s_line = int(short.get("start_line", 1))
        e_line = int(short.get("end_line", min(len(lines), s_line + 12)))

        start_item = line_map.get(s_line) or lines[0]
        end_item = line_map.get(e_line) or lines[min(len(lines) - 1, s_line + 12)]

        st = float(start_item["start"])
        et = float(end_item["end"])

        if total_duration <= 60.0:
            st = 0.0
            et = total_duration
        else:
            dur = et - st
            if dur < 28.0:
                et = min(total_duration, st + 42.0)
            elif dur > 55.0:
                et = min(total_duration, st + 46.0)

        overlaps = any(
            max(0.0, min(et, u_et) - max(st, u_st)) > 12.0 for u_st, u_et in used_ranges
        )
        if overlaps and len(normalized_shorts) > 0:
            continue

        used_ranges.append((st, et))
        clip_dur = round(max(5.0, et - st), 2)
        clip_words = [
            w for w in words if float(w.get("end", 0)) >= st and float(w.get("start", 0)) <= et
        ]

        viral_title = str(short.get("viral_title") or "Key Breakdown").strip()
        score = int(short.get("virality_score") or short.get("viral_score") or short.get("hook_score") or 95)
        reason = str(short.get("hook_reason") or short.get("rationale") or short.get("reasoning") or "").strip()
        short["virality_score"] = score
        short["viral_score"] = score
        short["hook_score"] = score
        short["hook_reason"] = reason
        short["rationale"] = reason
        short["reasoning"] = reason
        short["rank"] = len(normalized_shorts) + 1
        short["start_time"] = round(st, 2)
        short["end_time"] = round(et, 2)
        short["duration"] = clip_dur
        short["topic_pill"] = ""
        short["suggested_pan_percent"] = 50
        short["motion_events"] = []
        normalized_shorts.append(short)

    if total_duration > 180.0 and len(normalized_shorts) < required_count:
        niche_name = str(suite.get("niche") or "Insight")
        zone_count = required_count
        zone_len = total_duration / zone_count
        for z_idx in range(zone_count):
            if len(normalized_shorts) >= required_count:
                break
            cand_st = round(z_idx * zone_len + 10.0, 2)
            cand_et = round(min(total_duration, cand_st + 44.0), 2)
            if cand_et - cand_st < 25.0:
                continue
            overlaps = any(
                max(0.0, min(cand_et, u_et) - max(cand_st, u_st)) > 8.0
                for u_st, u_et in used_ranges
            )
            if not overlaps:
                used_ranges.append((cand_st, cand_et))
                s_pad = _make_window_short(
                    len(normalized_shorts) + 1, cand_st, cand_et, words, rng, niche_hint=niche_name
                )
                s_pad["motion_events"] = []
                normalized_shorts.append(s_pad)

    suite["shorts"] = normalized_shorts
    return suite


NUMBER_WORDS_SET = {
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
    "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
    "hundred", "thousand", "million", "billion", "first", "second", "third", "percent", "percentage",
    # French number words
    "un", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
    "vingt", "trente", "quarante", "cinquante", "soixante", "cent", "mille", "pourcent"
}


def remix_clip_motion_events(
    transcript_data: Dict[str, Any],
    start_time: float,
    end_time: float,
    viral_title: str,
    api_key: str = "",
    variation_seed: Optional[int] = None,
    media_id: Optional[str] = None,
    return_details: bool = False,
) -> Any:
    """
    Choreograph on-screen motion moments using a Story-First, numbered-word-index approach.
    - Sends transcript as numbered words with timestamps (index, word, start, end).
    - Asks for story first: hook_line, setup, turn, payoff (each as word-index ranges).
    - Asks for 0 to 5 on-screen moments decided strictly by content need.
    - All text and timing are built by the backend from word indices (model writes NO custom text/tags/labels).
    - Enforces number validation, contrast ranges, list ranges, non-overlap, and hook window clearance.
    """
    seed = variation_seed if variation_seed is not None else random.randint(1000, 999999)
    rng = random.Random(seed)
    effective_key = (api_key or os.getenv("GEMINI_API_KEY", "")).strip().strip('"').strip("'")
    mid = (media_id or transcript_data.get("media_id") or "default").strip()

    words = transcript_data.get("words", [])
    if not words and "segments" in transcript_data:
        for s in transcript_data.get("segments", []):
            words.extend(s.get("words", []))
    clip_words = [
        w for w in words if float(w.get("end", 0)) >= start_time and float(w.get("start", 0)) <= end_time
    ]
    clip_dur = round(max(5.0, end_time - start_time), 2)
    detected_lang = str(
        transcript_data.get("detected_language") or transcript_data.get("language") or "same as transcript"
    ).strip()

    if not effective_key or not clip_words:
        fallback_res = _make_window_short(1, start_time, end_time, words, rng)["motion_events"]
        if return_details:
            return {
                "motion_events": fallback_res,
                "story": None,
                "clean_intervals": [],
                "dropped_moments": ["No API key or clip words available; returned rule-based fallback."],
            }
        return fallback_res

    # 1. Format clip transcript as numbered words with timestamps
    numbered_words_list = []
    for idx, w in enumerate(clip_words):
        w_text = w.get("word", "").strip()
        w_st = round(max(0.0, float(w.get("start", 0.0)) - start_time), 2)
        w_et = round(max(w_st, float(w.get("end", 0.0)) - start_time), 2)
        numbered_words_list.append(f"[{idx}] {w_text} ({w_st:.2f}s - {w_et:.2f}s)")
    numbered_words_str = "\n".join(numbered_words_list)

    # 2. Prompt: Story-First with numbered word indices
    prompt = f"""You are an elite short-form video creative director and story analyst.
Analyze this short's spoken transcript ({clip_dur}s, language: {detected_lang}) with Opening Hook: "{viral_title}".

Numbered Spoken Words (Index, Word, Start Time - End Time):
{numbered_words_str}

YOUR TASK (Story-First Choreography):
1. STORY STRUCTURE (Word Index Ranges):
   Identify the core narrative beats using exact word index ranges [start_idx, end_idx]:
   - `hook_line`: The scroll-stopping opening question, problem, or bold statement.
   - `setup`: Context or premise establishing what is happening.
   - `turn`: The pivotal turning point, plot twist, unexpected mistake, or contradiction.
   - `payoff`: The punchline, consequence, resolution, or final takeaway.
   - `explanation`: 1-2 sentences on how hook, turn, and payoff connect into a cohesive viral story.

2. ON-SCREEN MOMENTS (0 to 5 moments maximum):
   Let the content decide the count: output ONLY moments where on-screen graphics significantly elevate retention or clarity (0 to 5 moments). If a short only needs 2 moments, output 2. Do not force unnecessary visuals.
   For each moment provide:
   - `start_word_idx`, `end_word_idx`: Exact word index range from the numbered words above.
   - `secondary_ranges`:
     * For 'contrast': exactly 1 additional range [start_idx, end_idx] for the contrasting item.
     * For 'list': 1 to 3 additional ranges [start_idx, end_idx] for remaining items in sequence.
   - `role`: hook | setup | turn | payoff | emphasis
   - `treatment`:
     * 'emphasis': high-impact power word or phrase (rendered as kinetic word hit).
     * 'contrast': comparing two items (MUST provide secondary_ranges with the second item).
     * 'list': 2 to 4 sequential steps (MUST provide secondary_ranges with remaining steps).
     * 'number': explicit numeric stat or measurement (VALID ONLY IF the word range contains a spoken number).
     * 'quote': striking verbatim spoken realization (rendered as editorial pull quote).
   - `reason`: One sentence on why this moment deserves a visual.

3. CLEAN SPEAKER INTERVALS:
   Mark intervals where the speaker's face remains completely unobstructed by graphics (minimum 30% of clip duration total).

CRITICAL INVARIANTS:
1. NO INVENTED LABELS OR HEADLINES: Do NOT write custom labels, tags, or headlines. The backend constructs all on-screen text directly from the word indices you specify.
2. 'number' treatment is ONLY allowed if the word range actually contains a spoken digit or number word.
3. No moments during the opening hook window (0.0s to 2.8s) which is reserved for the hook title.
4. No overlapping word ranges.
5. Zero emojis.
"""

    stage2_model = os.getenv("SELECTED_GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
    llm_res = execute_llm_request(
        prompt=prompt,
        request_type="plan_short",
        response_schema=StoryMotionPlanResponseSchema,
        temperature=0.3,
        preferred_model=stage2_model,
        api_key=effective_key,
        media_id=mid,
        purpose="Story & Motion Planning",
    )

    if not llm_res.ok or not llm_res.data:
        logger.warning(f"Story-first motion remix failed: {llm_res.user_message}. Using fallback.")
        fallback_events = _make_window_short(1, start_time, end_time, words, rng)["motion_events"]
        if return_details:
            return {
                "motion_events": fallback_events,
                "story": None,
                "clean_intervals": [],
                "dropped_moments": [f"AI planning failed ({llm_res.user_message}). Rule-based fallback used."],
            }
        return fallback_events

    data_obj = llm_res.data
    raw_dict = data_obj.model_dump() if hasattr(data_obj, "model_dump") else dict(data_obj)

    # 3. Extract and Ground Story Arc
    story_raw = raw_dict.get("story", {})
    def _extract_phrase(r_dict: Any) -> str:
        if not isinstance(r_dict, dict):
            return ""
        s = max(0, int(r_dict.get("start_idx", 0)))
        e = min(len(clip_words) - 1, int(r_dict.get("end_idx", s)))
        if s <= e < len(clip_words):
            return " ".join(clip_words[i]["word"] for i in range(s, e + 1)).strip()
        return ""

    story_narrative = {
        "hook_line": _extract_phrase(story_raw.get("hook_line")),
        "setup": _extract_phrase(story_raw.get("setup")),
        "turn": _extract_phrase(story_raw.get("turn")),
        "payoff": _extract_phrase(story_raw.get("payoff")),
        "explanation": story_raw.get("explanation", ""),
        "ranges": {
            "hook_line": [story_raw.get("hook_line", {}).get("start_idx", 0), story_raw.get("hook_line", {}).get("end_idx", 0)],
            "setup": [story_raw.get("setup", {}).get("start_idx", 0), story_raw.get("setup", {}).get("end_idx", 0)],
            "turn": [story_raw.get("turn", {}).get("start_idx", 0), story_raw.get("turn", {}).get("end_idx", 0)],
            "payoff": [story_raw.get("payoff", {}).get("start_idx", 0), story_raw.get("payoff", {}).get("end_idx", 0)],
        },
    }

    # 4. Construct Display Text and Timing from Word Indices
    raw_moments = raw_dict.get("moments") or []
    valid_moments: List[Dict[str, Any]] = []
    dropped_moments: List[str] = []

    for idx, m in enumerate(raw_moments[:5]):
        s_idx = int(m.get("start_word_idx", 0))
        e_idx = int(m.get("end_word_idx", s_idx))

        # Invariant 1: Word indices in bounds
        if s_idx < 0 or e_idx >= len(clip_words) or s_idx > e_idx:
            dropped_moments.append(
                f"Moment #{idx + 1} dropped: indices [{s_idx}, {e_idx}] out of bounds (0 to {len(clip_words) - 1})."
            )
            continue

        w_slice = clip_words[s_idx : e_idx + 1]
        m_start_sec = round(max(0.0, float(w_slice[0]["start"]) - start_time), 2)
        m_end_sec = round(max(m_start_sec + 0.4, float(w_slice[-1]["end"]) - start_time), 2)
        m_dur = round(max(1.8, min(3.8, m_end_sec - m_start_sec + 0.3)), 2)

        # Invariant 2: Moments not inside opening hook window (0.0s - 2.8s)
        if m_start_sec < 2.5:
            if m_end_sec > 3.2:
                m_start_sec = 2.8
                m_dur = round(max(1.8, m_end_sec - 2.8), 2)
            else:
                dropped_moments.append(
                    f"Moment #{idx + 1} ('{' '.join(w['word'] for w in w_slice)}') dropped: falls inside opening hook window ({m_start_sec}s < 2.8s)."
                )
                continue

        raw_treatment = m.get("treatment", "emphasis")
        treatment = getattr(raw_treatment, "value", str(raw_treatment)).lower().strip()
        if "." in treatment:
            treatment = treatment.split(".")[-1]
        spoken_primary = " ".join(w["word"] for w in w_slice).strip()
        anchor_phrase = " ".join(w["word"] for w in w_slice[: min(4, len(w_slice))]).strip()

        event_payload: Dict[str, Any] = {
            "time_sec": m_start_sec,
            "duration_sec": m_dur,
            "trigger_phrase": anchor_phrase,
            "role": m.get("role", "emphasis"),
            "reason": m.get("reason", ""),
            "zone": "center_spotlight",
        }

        # Treatment Invariant 3: Number treatment must contain a voiced number
        if treatment == "number":
            found_num = None
            for w in w_slice:
                raw_token = re.sub(r"[^\w.%]", "", w.get("word", "")).lower()
                if re.search(r"\d+", raw_token):
                    found_num = raw_token
                    break
                if raw_token in NUMBER_WORDS_SET:
                    found_num = raw_token
                    break

            if not found_num:
                dropped_moments.append(
                    f"Moment #{idx + 1} 'number' treatment rejected: '{spoken_primary}' contains no voiced number. Converted to emphasis."
                )
                treatment = "emphasis"
            else:
                event_payload["type"] = "metric_reveal"
                event_payload["value"] = found_num
                event_payload["headline"] = spoken_primary
                event_payload["subtext"] = ""

        # Treatment Invariant 4: Contrast needs two word ranges
        if treatment == "contrast":
            sec_ranges = m.get("secondary_ranges") or []
            contrast_words = []
            if sec_ranges:
                sec = sec_ranges[0]
                sec_s = int(sec.get("start_idx", -1)) if isinstance(sec, dict) else -1
                sec_e = int(sec.get("end_idx", -1)) if isinstance(sec, dict) else -1
                if 0 <= sec_s <= sec_e < len(clip_words):
                    contrast_words = clip_words[sec_s : sec_e + 1]

            if contrast_words:
                spoken_sec = " ".join(w["word"] for w in contrast_words).strip()
                event_payload["type"] = "contrast_split"
                event_payload["left_item"] = spoken_primary
                event_payload["right_item"] = spoken_sec
                event_payload["headline"] = ""
            else:
                dropped_moments.append(
                    f"Moment #{idx + 1} 'contrast' missing valid second range. Converted to emphasis."
                )
                treatment = "emphasis"

        # Treatment Invariant 5: List needs 2 to 4 ranges
        if treatment == "list":
            sec_ranges = m.get("secondary_ranges") or []
            items = [spoken_primary]
            for sec in sec_ranges[:3]:
                sec_s = int(sec.get("start_idx", -1)) if isinstance(sec, dict) else -1
                sec_e = int(sec.get("end_idx", -1)) if isinstance(sec, dict) else -1
                if 0 <= sec_s <= sec_e < len(clip_words):
                    item_text = " ".join(clip_words[i]["word"] for i in range(sec_s, sec_e + 1)).strip()
                    if item_text:
                        items.append(item_text)

            if len(items) >= 2:
                event_payload["type"] = "process_steps"
                event_payload["items"] = items
                event_payload["headline"] = ""
            else:
                dropped_moments.append(
                    f"Moment #{idx + 1} 'list' has < 2 valid ranges. Converted to emphasis."
                )
                treatment = "emphasis"

        if treatment == "quote":
            event_payload["type"] = "pull_quote"
            event_payload["headline"] = f'"{spoken_primary}"'
            event_payload["subtext"] = "VERBATIM QUOTE"
            event_payload["zone"] = "bottom_stage"

        if treatment == "emphasis":
            clean_tokens = [w.get("word", "").upper().strip(",.!?") for w in w_slice if w.get("word", "").strip(",.!?")]
            if len(clean_tokens) >= 3:
                event_payload["type"] = "keyword_cascade_takeover"
                event_payload["label"] = "KEY CONCEPT"
                event_payload["keywords"] = clean_tokens[:4]
                event_payload["items"] = clean_tokens[:4]
                event_payload["text"] = spoken_primary
                event_payload["headline"] = spoken_primary
                event_payload["focus_word"] = clean_tokens[-1]
                event_payload["zone"] = "full_takeover"
            else:
                event_payload["type"] = "word_hit"
                event_payload["text"] = spoken_primary.upper()
                event_payload["headline"] = spoken_primary
                event_payload["focus_word"] = spoken_primary.upper()
                event_payload["zone"] = "center_spotlight"

        valid_moments.append(event_payload)

    # 5. Non-overlapping validation and inter-beat clearance
    valid_moments.sort(key=lambda x: x["time_sec"])
    non_overlapping: List[Dict[str, Any]] = []

    for vm in valid_moments:
        if not non_overlapping:
            non_overlapping.append(vm)
            continue
        prev = non_overlapping[-1]
        prev_end = prev["time_sec"] + prev["duration_sec"]
        if vm["time_sec"] < prev_end + 0.3:
            # Check if duration can be clamped cleanly
            if vm["time_sec"] >= prev["time_sec"] + 1.8:
                prev["duration_sec"] = round(max(1.8, vm["time_sec"] - prev["time_sec"] - 0.3), 2)
                non_overlapping.append(vm)
            else:
                dropped_moments.append(
                    f"Moment at {vm['time_sec']}s dropped: overlaps previous moment ({prev['time_sec']}s - {prev_end:.2f}s)."
                )
        else:
            non_overlapping.append(vm)

    # 6. Clean intervals extraction
    clean_ints: List[Dict[str, float]] = []
    for ci in raw_dict.get("clean_intervals", []):
        c_st = round(max(0.0, float(ci.get("start_sec", 0.0))), 2)
        c_et = round(min(clip_dur, float(ci.get("end_sec", clip_dur))), 2)
        if c_et > c_st:
            clean_ints.append({"start_sec": c_st, "end_sec": c_et})

    if return_details:
        return {
            "motion_events": non_overlapping,
            "story": story_narrative,
            "clean_intervals": clean_ints,
            "dropped_moments": dropped_moments,
            "model": llm_res.model,
            "tokens": llm_res.tokens,
        }

    return non_overlapping