import os
import re
import json
import time
import uuid
import queue
import signal
import threading
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable, Tuple
from backend.utils.ffmpeg_helper import optimize_faststart_mp4, generate_clip_thumbnail

logger = logging.getLogger("viral_studio.exporter")

ACTIVE_RENDER_PROCS: Dict[str, subprocess.Popen] = {}
PROCS_LOCK = threading.Lock()
STALL_TIMEOUT_SEC = 90
MAX_RENDER_TIMEOUT_SEC = 360


class RenderCancelledError(Exception):
    pass


def _safe_unlink(path: Optional[Path]) -> None:
    if path and path.exists():
        try:
            path.unlink()
        except OSError:
            pass


def prune_stale_render_artifacts(output_renders_dir: Path, max_age_sec: int = 1800) -> None:
    if not output_renders_dir.exists():
        return
    now = time.time()
    for pattern in ("*.tmp.mp4", "*_render_props.json"):
        for f in output_renders_dir.glob(pattern):
            try:
                if (now - f.stat().st_mtime) > max_age_sec:
                    f.unlink()
            except OSError:
                pass


def _kill_process_tree(proc: subprocess.Popen) -> None:
    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            try:
                pgid = os.getpgid(proc.pid)
                os.killpg(pgid, signal.SIGKILL)
            except Exception:
                proc.kill()
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


def cancel_active_render_process(render_id: str) -> bool:
    with PROCS_LOCK:
        proc = ACTIVE_RENDER_PROCS.get(render_id)
    if proc and proc.poll() is None:
        _kill_process_tree(proc)
        return True
    return False


def render_burned_in_short_mp4(
    frontend_dir: Path,
    output_renders_dir: Path,
    clip_id: str,
    input_props: Dict[str, Any],
    fps: int = 30,
    progress_callback: Optional[Callable[[int, str, int], None]] = None,
    render_id: Optional[str] = None,
    cancel_check: Optional[Callable[[], bool]] = None,
) -> Tuple[Path, Optional[Path], int]:
    output_renders_dir.mkdir(parents=True, exist_ok=True)
    prune_stale_render_artifacts(output_renders_dir)

    safe_rid = re.sub(r"[^A-Za-z0-9]", "", str(render_id or uuid.uuid4().hex[:8]))[:8]
    props_file = output_renders_dir / f"{clip_id}_{safe_rid}_render_props.json"
    tmp_mp4_path = output_renders_dir / f"{clip_id}_{safe_rid}_final_burned.tmp.mp4"
    final_mp4_path = output_renders_dir / f"{clip_id}_final_burned.mp4"
    thumb_path = output_renders_dir / f"{clip_id}_thumb.jpg"

    duration_sec = max(1.0, float(input_props.get("duration", 40.0)))
    input_props["duration"] = duration_sec
    input_props["fps"] = fps

    with open(props_file, "w", encoding="utf-8") as f:
        json.dump(input_props, f, indent=2)

    script_path = frontend_dir / "render_short.mjs"
    if not script_path.exists():
        raise FileNotFoundError(f"Remotion renderer script not found at {script_path}")

    cmd = [
        "node",
        str(script_path.resolve()),
        str(props_file.resolve()),
        str(tmp_mp4_path.resolve()),
    ]
    logger.info(f"Running Remotion Chromium Renderer: {' '.join(cmd)}")
    start_ts = time.time()

    popen_kwargs: Dict[str, Any] = {
        "cwd": str(frontend_dir.resolve()),
        "stdout": subprocess.PIPE,
        "stderr": subprocess.STDOUT,
        "text": True,
        "encoding": "utf-8",
        "errors": "replace",
    }
    if os.name != "nt":
        popen_kwargs["start_new_session"] = True

    proc = subprocess.Popen(cmd, **popen_kwargs)

    if render_id:
        with PROCS_LOCK:
            ACTIVE_RENDER_PROCS[render_id] = proc

    lines_q: queue.Queue = queue.Queue()

    def _stdout_reader():
        try:
            if proc.stdout:
                for line in iter(proc.stdout.readline, ""):
                    lines_q.put(line)
        except Exception:
            pass
        finally:
            lines_q.put(None)

    reader_thread = threading.Thread(target=_stdout_reader, daemon=True)
    reader_thread.start()

    log_tail: List[str] = []
    last_output_ts = time.time()

    try:
        while True:
            if cancel_check and cancel_check():
                _kill_process_tree(proc)
                raise RenderCancelledError("Export cancelled by user.")

            elapsed_total = time.time() - start_ts
            if elapsed_total > MAX_RENDER_TIMEOUT_SEC:
                _kill_process_tree(proc)
                raise RuntimeError(f"Remotion Chromium render timed out after {MAX_RENDER_TIMEOUT_SEC} seconds.")

            try:
                raw_line = lines_q.get(timeout=0.5)
            except queue.Empty:
                if proc.poll() is not None:
                    break
                if time.time() - last_output_ts > STALL_TIMEOUT_SEC:
                    _kill_process_tree(proc)
                    raise RuntimeError(
                        f"Remotion Chromium renderer stalled (no stdout activity for {STALL_TIMEOUT_SEC}s)."
                    )
                continue

            if raw_line is None:
                # End of stdout stream
                break

            last_output_ts = time.time()
            line = raw_line.strip()
            if not line:
                continue
            log_tail.append(line)
            if len(log_tail) > 40:
                log_tail.pop(0)

            if line.startswith("PROGRESS:"):
                parts = line.split(":", 2)
                if len(parts) >= 3 and parts[1].isdigit():
                    pct = int(parts[1])
                    msg = parts[2]
                    elapsed = max(0.5, time.time() - start_ts)
                    ratio = max(0.05, pct / 100.0)
                    eta = max(1, int((elapsed / ratio) - elapsed))
                    if progress_callback:
                        progress_callback(pct, msg, eta)
            else:
                logger.info(f"[Remotion] {line}")

        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            _kill_process_tree(proc)
    except RenderCancelledError:
        _safe_unlink(tmp_mp4_path)
        _safe_unlink(props_file)
        raise
    except subprocess.TimeoutExpired:
        _kill_process_tree(proc)
        _safe_unlink(tmp_mp4_path)
        _safe_unlink(props_file)
        raise RuntimeError("Remotion Chromium render timed out after 360 seconds.")
    finally:
        if render_id:
            with PROCS_LOCK:
                ACTIVE_RENDER_PROCS.pop(render_id, None)

    if cancel_check and cancel_check():
        _safe_unlink(tmp_mp4_path)
        _safe_unlink(props_file)
        raise RenderCancelledError("Export cancelled by user.")

    if proc.returncode != 0 or not tmp_mp4_path.exists() or tmp_mp4_path.stat().st_size < 10000:
        _safe_unlink(tmp_mp4_path)
        _safe_unlink(props_file)
        if final_mp4_path.exists() and final_mp4_path.stat().st_size == 0:
            _safe_unlink(final_mp4_path)
        err_summary = "\n".join(log_tail[-12:])
        raise RuntimeError(
            f"Remotion Chromium export failed (exit {proc.returncode}):\n{err_summary}"
        )

    try:
        # Apply faststart optimization for social-ready instant streaming
        optimize_faststart_mp4(tmp_mp4_path, final_mp4_path)

        # Extract high-definition cover thumbnail
        thumb_file: Optional[Path] = None
        try:
            thumb_time = min(1.0, max(0.2, duration_sec / 2.0))
            thumb_file = generate_clip_thumbnail(final_mp4_path, thumb_path, timestamp_sec=thumb_time)
        except Exception as exc:
            logger.warning(f"Failed to generate thumbnail: {exc}")
    finally:
        # Guaranteed cleanup of intermediate render artifacts
        _safe_unlink(tmp_mp4_path)
        _safe_unlink(props_file)

    file_size = final_mp4_path.stat().st_size if final_mp4_path.exists() else 0

    if progress_callback:
        progress_callback(100, "Remotion MP4 Export Ready!", 0)
    return final_mp4_path, thumb_file, file_size