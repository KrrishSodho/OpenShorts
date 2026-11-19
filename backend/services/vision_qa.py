import os
import re
import cv2
import json
import logging
from pathlib import Path
from typing import List, Dict, Any
from google import genai
from google.genai import types

from backend.services.llm import execute_llm_request

logger = logging.getLogger("viral_studio.vision_qa")


def verify_and_refine_pan_with_vision(
    video_path: Path,
    pan_keyframes: List[Dict[str, Any]],
    api_key: str = "",
) -> List[Dict[str, Any]]:
    """
    SeeCut / ReelKit-style Gemini Vision QA Guardrail:
    Draws the planned 9:16 crop window onto sampled frames of each shot, asks Gemini Vision
    if the active speaker's face is cleanly framed inside the box, and auto-corrects pan% if needed.
    """
    effective_key = (api_key or os.getenv("GEMINI_API_KEY", "")).strip()
    if not effective_key or not video_path.exists() or not pan_keyframes:
        return pan_keyframes

    cap = cv2.VideoCapture(str(video_path))
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if w <= h or total_frames <= 0:
        cap.release()
        return pan_keyframes

    crop_w = int(h * (9.0 / 16.0))
    shot_parts = []
    target_kfs = pan_keyframes[:5]

    for idx, kf in enumerate(target_kfs):
        t_sec = float(kf.get("t", 0.0)) + 0.45
        f_idx = min(total_frames - 1, max(0, int(t_sec * fps)))
        cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
        ret, frame = cap.read()
        if not ret:
            continue

        pan_pct = float(kf.get("pan", 50))
        crop_x = int((w - crop_w) * (pan_pct / 100.0))

        # Draw yellow 9:16 crop boundary box onto a downscaled reference frame
        annotated = frame.copy()
        cv2.rectangle(annotated, (crop_x, 4), (crop_x + crop_w, h - 4), (0, 230, 255), 8)
        cv2.putText(
            annotated,
            f"SHOT #{idx} (pan={int(pan_pct)}%)",
            (30, 60),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.4,
            (0, 230, 255),
            4,
        )

        small = cv2.resize(annotated, (640, 360))
        ok, buf = cv2.imencode(".jpg", small, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        if ok:
            shot_parts.append(
                types.Part.from_bytes(data=buf.tobytes(), mime_type="image/jpeg")
            )

    cap.release()

    if not shot_parts:
        return pan_keyframes

    prompt = (
        "Inspect these annotated 16:9 podcast frames. Each frame shows a YELLOW 9:16 vertical crop box.\n"
        "For each SHOT #i, check if the main speaker's face is cleanly centered inside the YELLOW box.\n"
        "If the speaker's face is cut off or outside the box, estimate the corrected horizontal pan percentage "
        "(0 = far left edge, 50 = dead center, 100 = far right edge) needed to center their face.\n"
        "Return JSON only: {\"corrections\": [{\"shot_index\": 0, \"ok\": true, \"new_pan\": 50}]}"
    )

    try:
        res = execute_llm_request(
            prompt=prompt,
            request_type="small_check",
            multimodal_parts=shot_parts,
            temperature=0.1,
            api_key=effective_key,
        )
        if res.ok and res.raw_text:
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", res.raw_text.strip())
            qa_data = json.loads(cleaned)
            updated = [dict(k) for k in pan_keyframes]
            for corr in qa_data.get("corrections", []):
                s_idx = int(corr.get("shot_index", -1))
                is_ok = bool(corr.get("ok", True))
                new_pan = corr.get("new_pan")
                if not is_ok and 0 <= s_idx < len(updated) and new_pan is not None:
                    clamped = int(max(5, min(95, float(new_pan))))
                    logger.info(
                        f"Vision QA adjusted Shot #{s_idx} pan: {updated[s_idx]['pan']}% -> {clamped}%"
                    )
                    updated[s_idx]["pan"] = clamped
            return updated
    except Exception as e:
        logger.debug(f"Vision QA skipped ({e}), keeping OpenCV tracking.")

    return pan_keyframes