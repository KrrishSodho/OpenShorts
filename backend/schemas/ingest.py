from typing import Optional
from pydantic import BaseModel


class IngestRequest(BaseModel):
    url: Optional[str] = None
    local_path: Optional[str] = None
    custom_script: Optional[str] = None
    use_sample: bool = False
    model_size: str = "base"
    preset_id: Optional[str] = None
    api_key: Optional[str] = None
    variation_seed: Optional[int] = None


class YouTubeRequest(BaseModel):
    url: str
