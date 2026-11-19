from typing import Optional, Dict, Any
from pydantic import BaseModel


class RenderExportRequest(BaseModel):
    clip_id: str
    input_props: Dict[str, Any]
    fps: Optional[int] = 30
