import json
import logging
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

from backend.config import GEMINI_API_KEY, DEFAULT_GEMINI_MODEL

logger = logging.getLogger(__name__)

HOOK_DETECTOR_PROMPT = """
You are a World-Class Viral Video Editor and Retention Specialist for YouTube Shorts, TikTok, and Instagram Reels.
Your task is to analyze the following video transcript with timestamps and select the absolute BEST viral short clip(s) (between 30 and 60 seconds).

Evaluation Criteria:
1. THE HOOK (First 3 seconds): Must start with an intriguing question, bold claim, controversy, or unexpected fact.
2. RETENTION MOMENTUM: High information density, zero awkward pauses, continuous curiosity.
3. SATISFYING PAYOFF: Clear conclusion, punchline, or golden lesson.

For each candidate clip, output:
- title: High CTR viral short title (max 50 chars)
- start_time: Exact start timestamp in seconds (float)
- end_time: Exact end timestamp in seconds (float, duration must be 30-60s)
- hook_sentence: The exact opening words
- viral_score: Rating from 1 to 100
- rationale: Why this segment will hold audience retention
- visual_keywords: 3 to 6 impactful words mentioned in this clip where on-screen 3D stickers, animated charts, or sketch circles should pop up (e.g., ["AI", "Claude", "Cost", "$2000"]).

Return ONLY valid JSON matching this structure:
{
  "clips": [
    {
      "title": "string",
      "start_time": 12.5,
      "end_time": 58.0,
      "duration": 45.5,
      "hook_sentence": "string",
      "viral_score": 95,
      "rationale": "string",
      "visual_keywords": ["word1", "word2"]
    }
  ]
}
"""

class ViralHookDetector:
    """Uses AI Director / Gemini long-context understanding to find viral clips in transcripts."""
    
    @classmethod
    def find_viral_clips(cls, transcript_data: Dict[str, Any], api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        effective_key = (api_key or GEMINI_API_KEY or "").strip()
        from backend.services.ai_director import generate_ranked_viral_suite
        try:
            suite = generate_ranked_viral_suite(transcript_data, api_key=effective_key)
            shorts = suite.get("shorts", [])
            clips = []
            for s in shorts:
                clips.append({
                    "title": s.get("viral_title", "Viral Clip"),
                    "start_time": s.get("start_time", 0.0),
                    "end_time": s.get("end_time", 45.0),
                    "duration": s.get("duration", 45.0),
                    "hook_sentence": s.get("hook_reason") or s.get("rationale") or s.get("viral_title", ""),
                    "viral_score": s.get("virality_score") or s.get("viral_score", 95),
                    "rationale": s.get("hook_reason") or s.get("rationale", ""),
                    "visual_keywords": s.get("spoken_keywords", ["Highlights"]),
                })
            if clips:
                return sorted(clips, key=lambda x: x.get("viral_score", 0), reverse=True)
        except Exception as e:
            logger.error(f"find_viral_clips via generate_ranked_viral_suite failed: {e}")

        # Safe fallback segment without IndexError
        duration = float(transcript_data.get("duration", 60.0))
        end_t = min(60.0, duration)
        segments = transcript_data.get("segments") or []
        first_txt = segments[0].get("text", "Watch this clip") if segments else "Watch this clip"
        return [{
            "title": "Selected Clip",
            "start_time": 0.0,
            "end_time": end_t,
            "duration": end_t,
            "hook_sentence": first_txt,
            "viral_score": 85,
            "rationale": "Fallback opening segment",
            "visual_keywords": ["Highlights"],
        }]
