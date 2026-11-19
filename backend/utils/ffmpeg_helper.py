import os
import json
import logging
import subprocess
import wave
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger("viral_studio.ffmpeg")


def probe_media(file_path: Path) -> Dict[str, Any]:
    """Inspect video/audio file and return duration, resolution, fps, and audio presence."""
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration,size:stream=width,height,r_frame_rate,codec_type",
        "-of",
        "json",
        str(file_path),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
    data = json.loads(res.stdout)

    duration = float(data.get("format", {}).get("duration", 0.0))
    streams = data.get("streams", [])
    video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

    width = video_stream.get("width") if video_stream else None
    height = video_stream.get("height") if video_stream else None

    fps = 30.0
    if video_stream and "r_frame_rate" in video_stream:
        try:
            parts = str(video_stream["r_frame_rate"]).split("/")
            if len(parts) == 2 and float(parts[1]) != 0:
                fps = float(parts[0]) / float(parts[1])
            elif len(parts) == 1:
                fps = float(parts[0])
        except Exception:
            fps = 30.0

    return {
        "duration": duration,
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "has_audio": audio_stream is not None,
        "is_vertical": (height > width) if (width and height) else False,
    }


def extract_audio_16k(video_path: Path, output_wav_path: Path) -> Path:
    """Atomically extract a 16kHz mono PCM WAV audio track optimized for Faster-Whisper."""
    info = probe_media(video_path)
    if not info.get("has_audio"):
        logger.warning(
            f"Video at {video_path} has no audio stream. Generating silent 16kHz mono PCM WAV."
        )
        duration = max(float(info.get("duration", 0.0) or 0.0), 1.0)
        num_frames = int(duration * 16000)
        tmp_wav = output_wav_path.with_suffix(".tmp.wav")
        try:
            with wave.open(str(tmp_wav), "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(16000)
                chunk_frames = 16000
                silence_chunk = b"\x00" * (chunk_frames * 2)
                remaining = num_frames
                while remaining > 0:
                    write_size = min(remaining, chunk_frames)
                    if write_size == chunk_frames:
                        wf.writeframes(silence_chunk)
                    else:
                        wf.writeframes(b"\x00" * (write_size * 2))
                    remaining -= write_size
            os.replace(str(tmp_wav), str(output_wav_path))
            return output_wav_path
        finally:
            if tmp_wav.exists():
                try:
                    tmp_wav.unlink()
                except OSError:
                    pass

    tmp_wav = output_wav_path.with_suffix(".tmp.wav")
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        str(tmp_wav),
    ]
    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=120)
        os.replace(str(tmp_wav), str(output_wav_path))
        return output_wav_path
    except subprocess.CalledProcessError as exc:
        logger.error(f"FFmpeg audio extraction failed: {exc.stderr}")
        raise
    finally:
        if tmp_wav.exists():
            try:
                tmp_wav.unlink()
            except OSError:
                pass


def trim_video_clip(
    input_path: Path, output_path: Path, start_sec: float, end_sec: float
) -> Path:
    """
    Frame-accurate, browser-safe MP4 trim (< 1.0s even at 45:00 in long podcasts):
    - Uses two-stage hybrid seek (-ss before -i for fast keyframe jump, fine -ss after -i).
    - Forces yuv420p + faststart so Chromium <Video> NEVER stalls or renders a black screen.
    - Writes to a temp file and atomically replaces output_path.
    """
    safe_start = max(0.0, float(start_sec))
    duration = max(0.5, float(end_sec) - safe_start)

    pre_seek = max(0.0, safe_start - 3.0)
    fine_seek = max(0.0, safe_start - pre_seek)

    has_audio = True
    try:
        info = probe_media(input_path)
        has_audio = bool(info.get("has_audio", True))
    except Exception:
        has_audio = True

    tmp_mp4 = output_path.with_name(f"{output_path.stem}.tmp{output_path.suffix}")

    cmd = ["ffmpeg", "-y"]
    if pre_seek > 0.01:
        cmd.extend(["-ss", f"{pre_seek:.3f}"])
    cmd.extend(["-i", str(input_path)])
    if fine_seek > 0.01:
        cmd.extend(["-ss", f"{fine_seek:.3f}"])

    cmd.extend([
        "-t",
        f"{duration:.3f}",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
    ])

    if has_audio:
        cmd.extend([
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-af",
            "aresample=async=1:first_pts=0",
        ])
    else:
        cmd.append("-an")

    cmd.extend([
        "-movflags",
        "+faststart",
        str(tmp_mp4),
    ])

    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=120)
        if not tmp_mp4.exists() or tmp_mp4.stat().st_size < 4096:
            raise RuntimeError(f"FFmpeg produced an empty/corrupt clip at {tmp_mp4}")
        os.replace(str(tmp_mp4), str(output_path))
        return output_path
    finally:
        if tmp_mp4.exists():
            try:
                tmp_mp4.unlink()
            except OSError:
                pass


def optimize_faststart_mp4(input_path: Path, output_path: Path) -> Path:
    """
    Ensures the MP4 has the moov atom at the front (+faststart) for instant playback
    on Instagram Reels, TikTok, YouTube Shorts, and web browsers.
    Uses lossless stream copy (-c copy) for maximum speed.
    """
    tmp_path = output_path.with_name(f"{output_path.stem}.fs_tmp{output_path.suffix}")
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        str(tmp_path),
    ]
    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=60)
        if tmp_path.exists() and tmp_path.stat().st_size > 1024:
            os.replace(str(tmp_path), str(output_path))
            return output_path
    except Exception as exc:
        logger.warning(f"Faststart optimization failed, using original file: {exc}")
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass
    if input_path != output_path and input_path.exists():
        os.replace(str(input_path), str(output_path))
    return output_path


def generate_clip_thumbnail(video_path: Path, output_jpg_path: Path, timestamp_sec: float = 1.0) -> Optional[Path]:
    """
    Extracts a crisp poster frame thumbnail from the exported short.
    """
    tmp_jpg = output_jpg_path.with_name(f"{output_jpg_path.stem}.tmp.jpg")
    safe_time = max(0.2, float(timestamp_sec))
    cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        f"{safe_time:.2f}",
        "-i",
        str(video_path),
        "-vframes",
        "1",
        "-q:v",
        "2",
        str(tmp_jpg),
    ]
    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
        if tmp_jpg.exists() and tmp_jpg.stat().st_size > 512:
            os.replace(str(tmp_jpg), str(output_jpg_path))
            return output_jpg_path
    except Exception as exc:
        logger.warning(f"Thumbnail generation failed: {exc}")
    finally:
        if tmp_jpg.exists():
            try:
                tmp_jpg.unlink()
            except OSError:
                pass
    return None
