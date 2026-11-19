from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class PrepareClipRequest(BaseModel):
    media_id: str
    start_time: float
    end_time: float
    preset_id: str
    custom_title: Optional[str] = None
    motion_events: Optional[List[Dict[str, Any]]] = None
    crop_focus: Optional[str] = "auto"
    pan_keyframes: Optional[List[Dict[str, Any]]] = None
    framing_layout: Optional[str] = "single"
    split_top_pan: Optional[int] = 22
    split_bottom_pan: Optional[int] = 78
    split_zoom: Optional[float] = 1.55
    trio_left_pan: Optional[int] = 20
    trio_right_pan: Optional[int] = 80
    clean_speaker_mode: Optional[bool] = False


class RemixMotionRequest(BaseModel):
    media_id: str
    start_time: float
    end_time: float
    viral_title: str
    variation_seed: Optional[int] = None
    api_key: Optional[str] = None


class AutoTrackPanRequest(BaseModel):
    media_id: str
    start_time: float
    end_time: float
