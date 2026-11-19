import os
import re
import json
import uuid
import time
import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Callable
import yt_dlp

from backend.config import DOWNLOADS_DIR, TRANSCRIPTS_DIR
from backend.core.jobs import persist_media_meta
from backend.utils.ffmpeg_helper import extract_audio_16k, probe_media

logger = logging.getLogger(__name__)


def normalize_youtube_url(url: str) -> str:
    """
    Cleans tracking query parameters (?si=..., &feature=..., etc.)
    and normalizes youtu.be, shorts, and watch URLs into a canonical format.
    """
    url = url.strip()
    match = re.search(
        r'(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})',
        url,
    )
    if match:
        video_id = match.group(1)
        return f"https://www.youtube.com/watch?v={video_id}"
    return url


class MediaDownloader:
    """Handles downloading YouTube media or staging uploaded/local video files."""

    @staticmethod
    def _sanitize_filename(name: str) -> str:
        clean = re.sub(r'[\\/*?:"<>|]', "", name)
        return clean.replace(" ", "_")[:60]

    @classmethod
    def process_local_file(cls, input_file_path: Path) -> Dict[str, Any]:
        """
        Process a local video file on disk.
        Reuses existing audio/metadata if previously processed, avoiding redundant 16k extractions.
        """
        resolved_path = Path(input_file_path).resolve()
        if not resolved_path.exists():
            raise FileNotFoundError(f"Local video file not found at: {resolved_path}")

        # Check if this exact file was already registered and has valid audio
        for meta_file in TRANSCRIPTS_DIR.glob("*_meta.json"):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                if Path(meta.get("video_path", "")).resolve() == resolved_path:
                    cached_id = meta.get("id")
                    audio_p = Path(meta.get("audio_path", ""))
                    if cached_id and audio_p.exists() and audio_p.stat().st_size > 1000:
                        logger.info(
                            f"Reusing existing media metadata for {resolved_path.name} (media_id: {cached_id})"
                        )
                        return meta
            except Exception:
                pass

        # Deterministic file_id based on filename and size
        file_stat = resolved_path.stat()
        hash_input = f"{resolved_path.name}_{file_stat.st_size}".encode("utf-8")
        file_hash = hashlib.md5(hash_input).hexdigest()[:8]
        file_id = f"local_{file_hash}"
        stem = cls._sanitize_filename(resolved_path.stem)
        target_audio = DOWNLOADS_DIR / f"{file_id}_{stem}_16k.wav"

        if not target_audio.exists() or target_audio.stat().st_size < 1000:
            logger.info(f"Extracting 16kHz mono audio directly from local source: {resolved_path}")
            extract_audio_16k(resolved_path, target_audio)
        else:
            logger.info(f"Reusing existing 16kHz audio for {resolved_path.name}: {target_audio}")

        probe = probe_media(resolved_path)

        media_info = {
            "id": file_id,
            "title": resolved_path.stem,
            "video_path": str(resolved_path),
            "audio_path": str(target_audio),
            "duration": probe["duration"],
            "width": probe["width"],
            "height": probe["height"],
            "fps": probe["fps"],
            "is_vertical": probe["is_vertical"],
        }
        persist_media_meta(media_info)
        return media_info

    @classmethod
    def download_youtube_url(
        cls,
        raw_url: str,
        progress_callback: Optional[Callable[[int, str], None]] = None,
    ) -> Dict[str, Any]:
        """
        Download YouTube video with live progress reporting and automatic format optimization.
        Strips tracking tags and selects balanced 720p/1080p stream for fast download.
        """
        clean_url = normalize_youtube_url(raw_url)
        file_id = f"yt_{uuid.uuid4().hex[:8]}"
        template = str(DOWNLOADS_DIR / f"{file_id}_%(title).50s.%(ext)s")

        last_update_time = [0.0]

        def ytdl_hook(d):
            if not progress_callback:
                return
            status = d.get("status")
            if status == "downloading":
                now = time.time()
                if now - last_update_time[0] < 1.0:
                    return
                last_update_time[0] = now

                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded = d.get("downloaded_bytes", 0)
                speed = d.get("speed") or 0
                eta = d.get("eta") or 0

                down_mb = downloaded / (1024 * 1024)
                total_mb = total / (1024 * 1024) if total else 0
                pct = (downloaded / total * 100) if total else 0

                speed_str = (
                    f"{speed / (1024 * 1024):.1f} MB/s" if speed else "calculating..."
                )
                eta_str = f"{int(eta // 60)}m {int(eta % 60)}s" if eta else "..."

                step_msg = (
                    f"Downloading: {down_mb:.1f}MB / {total_mb:.1f}MB ({pct:.0f}%) "
                    f"at {speed_str} (ETA {eta_str})"
                )
                # Map 0-100% download progress to 10%-42% overall pipeline progress
                ui_pct = min(42, max(10, 10 + int(pct * 0.32)))
                progress_callback(ui_pct, step_msg)

            elif status == "finished":
                progress_callback(43, "Download complete. Extracting 16kHz audio track: 43%")

        # Prefer 720p/1080p MP4 with AAC audio for rapid processing and high-quality 9:16 vertical crop
        ydl_opts = {
            "format": "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/bestvideo[height<=1080]+bestaudio/best",
            "outtmpl": template,
            "quiet": True,
            "no_warnings": True,
            "merge_output_format": "mp4",
            "progress_hooks": [ytdl_hook],
        }

        if progress_callback:
            progress_callback(10, f"Connecting to YouTube ({clean_url})...")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(clean_url, download=True)
            video_title = info.get("title", "Unknown Title")
            downloaded_video = Path(ydl.prepare_filename(info))

            if not downloaded_video.exists():
                mp4_candidate = downloaded_video.with_suffix(".mp4")
                if mp4_candidate.exists():
                    downloaded_video = mp4_candidate

        if not downloaded_video.exists():
            raise FileNotFoundError(f"Downloaded video not found at {downloaded_video}")

        target_audio = downloaded_video.with_name(f"{downloaded_video.stem}_16k.wav")

        if progress_callback:
            progress_callback(44, "Extracting high-precision 16kHz audio track...")

        extract_audio_16k(downloaded_video, target_audio)
        probe = probe_media(downloaded_video)

        return {
            "id": file_id,
            "title": video_title,
            "video_path": str(downloaded_video),
            "audio_path": str(target_audio),
            "duration": probe["duration"],
            "width": probe["width"],
            "height": probe["height"],
            "fps": probe["fps"],
            "is_vertical": probe["is_vertical"],
        }
