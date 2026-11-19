import os
import re
import json
import hashlib
import logging
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path
from typing import Optional

from backend.config import STORAGE_DIR

logger = logging.getLogger("viral_studio.broll")

BROLL_DIR = STORAGE_DIR / "broll"
BROLL_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    )
}


def _slugify(query: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9]+", "-", query.lower()).strip("-")
    h = hashlib.md5(query.encode("utf-8")).hexdigest()[:6]
    return f"{clean[:32]}_{h}"


def _search_pexels_video(query: str, api_key: str) -> Optional[str]:
    try:
        q = urllib.parse.quote(query)
        url = f"https://api.pexels.com/videos/search?query={q}&orientation=portrait&per_page=3"
        req = urllib.request.Request(
            url, headers={**HEADERS, "Authorization": api_key}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        for vid in data.get("videos", []):
            files = sorted(
                vid.get("video_files", []),
                key=lambda f: abs((f.get("height") or 0) - 1280),
            )
            for vf in files:
                link = vf.get("link")
                if link and vf.get("file_type") == "video/mp4":
                    return link
    except Exception as e:
        logger.debug(f"Pexels search failed for '{query}': {e}")
    return None


def _search_mixkit_video(query: str) -> Optional[str]:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", query.lower()).strip("-")
    if not slug:
        return None

    first_word = slug.split("-")[0]
    candidate_pages = [
        f"https://mixkit.co/free-stock-video/{slug}/",
        f"https://mixkit.co/free-stock-video/discover/{slug}/",
        f"https://mixkit.co/free-stock-video/{first_word}/",
        f"https://mixkit.co/free-stock-video/discover/{first_word}/",
    ]

    for page_url in candidate_pages:
        try:
            req = urllib.request.Request(page_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=7) as resp:
                html = resp.read().decode("utf-8", errors="ignore")

            patterns = [
                r"https://assets\.mixkit\.co/videos/[0-9]+/[0-9]+-720\.mp4",
                r"https://assets\.mixkit\.co/videos/preview/[^\"'\s<>]+\.mp4",
                r"https://assets\.mixkit\.co/active_storage/[^\"'\s<>]+\.mp4",
            ]
            for pat in patterns:
                matches = re.findall(pat, html)
                if matches:
                    return matches[0]
        except Exception as e:
            logger.debug(f"Mixkit lookup skipped for {page_url}: {e}")

    return None


def _generate_procedural_fallback_broll(target_path: Path, duration_sec: float = 6.0) -> bool:
    try:
        trim_dur = max(5.0, float(duration_sec))
        cmd = [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c=0x080D1A:s=720x1280:d={trim_dur:.2f}:r=30",
            "-vf",
            "noise=alls=12:allf=t+u,format=yuv420p",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "24",
            "-movflags",
            "+faststart",
            str(target_path),
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=25)
        return res.returncode == 0 and target_path.exists() and target_path.stat().st_size > 5000
    except Exception as e:
        logger.warning(f"Procedural B-roll fallback generation failed: {e}")
        return False


def fetch_broll_clip(query: str, duration_sec: float = 5.0) -> Optional[str]:
    if not query or not query.strip():
        return None

    BROLL_DIR.mkdir(parents=True, exist_ok=True)
    slug = _slugify(query.strip())
    final_path = BROLL_DIR / f"{slug}.mp4"

    if final_path.exists() and final_path.stat().st_size > 15000:
        return f"/storage/broll/{final_path.name}"

    pexels_key = os.getenv("PEXELS_API_KEY", "").strip()
    remote_url = _search_pexels_video(query, pexels_key) if pexels_key else None
    if not remote_url:
        remote_url = _search_mixkit_video(query)

    if not remote_url:
        logger.info(f"No remote B-roll found for '{query}', synthesizing procedural cutaway...")
        if _generate_procedural_fallback_broll(final_path, duration_sec):
            return f"/storage/broll/{final_path.name}"
        return None

    raw_tmp = BROLL_DIR / f"{slug}_raw.mp4"
    out_tmp = BROLL_DIR / f"{slug}.tmp.mp4"
    try:
        logger.info(f"Downloading B-roll for '{query}': {remote_url}")
        req = urllib.request.Request(remote_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=14) as resp:
            raw_bytes = resp.read()
        raw_tmp.write_bytes(raw_bytes)

        trim_dur = max(5.5, float(duration_sec) + 1.5)
        cmd = [
            "ffmpeg",
            "-y",
            "-stream_loop",
            "-1",
            "-i",
            str(raw_tmp),
            "-t",
            f"{trim_dur:.2f}",
            "-an",
            "-vf",
            "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "23",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(out_tmp),
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)

        if out_tmp.exists() and out_tmp.stat().st_size > 10000:
            os.replace(str(out_tmp), str(final_path))
            return f"/storage/broll/{final_path.name}"
    except Exception as e:
        logger.warning(f"Failed preparing remote B-roll for '{query}': {e}, falling back to procedural cutaway...")
        if _generate_procedural_fallback_broll(final_path, duration_sec):
            return f"/storage/broll/{final_path.name}"
    finally:
        for p in (raw_tmp, out_tmp):
            if p.exists():
                try:
                    p.unlink()
                except OSError:
                    pass

    return None