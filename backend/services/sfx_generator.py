import logging
import math
from pathlib import Path
from typing import Dict
import wave
import numpy as np

from backend.config import STORAGE_DIR

logger = logging.getLogger("viral_studio.sfx")

SFX_DIR = STORAGE_DIR / "sfx"
SFX_DIR.mkdir(parents=True, exist_ok=True)
SFX_VERSION_MARKER = SFX_DIR / ".sfx_v50"


def _write_wav_mono(path: Path, samples: np.ndarray, sample_rate: int = 44100) -> None:
    # Peak normalize to -3 dBFS (0.7079)
    peak = float(np.max(np.abs(samples)))
    if peak > 1e-6:
        normalized = (samples / peak) * 0.708
    else:
        normalized = samples
    clamped = np.clip(normalized, -0.99, 0.99)
    int_samples = (clamped * 32767).astype(np.int16)

    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(int_samples.tobytes())


def _generate_whoosh(path: Path, duration: float = 0.45, sr: int = 44100) -> None:
    """Warm velvet low-passed air sweep (zero harsh static)."""
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)
    rng = np.random.RandomState(42)
    noise = rng.uniform(-1.0, 1.0, n)

    # 2-pole lowpass filter with dynamic frequency sweep (200Hz -> 1800Hz -> 300Hz)
    fc = 200.0 + 1600.0 * np.sin(np.pi * (t / duration)) ** 1.8
    alpha = np.clip(2.0 * np.pi * fc / sr, 0.01, 0.45)

    lp1 = np.zeros(n)
    lp2 = np.zeros(n)
    v1 = 0.0
    v2 = 0.0
    for i in range(n):
        v1 += alpha[i] * (noise[i] - v1)
        v2 += alpha[i] * (v1 - v2)
        lp2[i] = v2

    env = np.sin(np.pi * (t / duration)) ** 2.2
    samples = lp2 * env
    _write_wav_mono(path, samples, sr)


def _generate_pop(path: Path, duration: float = 0.16, sr: int = 44100) -> None:
    """Warm wooden marimba bubble pop with pitch drop 450Hz->180Hz."""
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)
    freq = 180.0 + 270.0 * np.exp(-t * 24.0)
    phase = 2.0 * np.pi * np.cumsum(freq) / sr
    env = np.exp(-t * 22.0) * np.clip(t / 0.003, 0.0, 1.0)
    samples = np.sin(phase) * env
    _write_wav_mono(path, samples, sr)


def _generate_click(path: Path, duration: float = 0.08, sr: int = 44100) -> None:
    """Dual mechanical transient at t=0 and t=12ms."""
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)

    env1 = np.exp(-t * 90.0) * np.clip(t / 0.001, 0.0, 1.0)
    t2 = np.maximum(0.0, t - 0.012)
    env2 = np.exp(-t2 * 110.0) * (t >= 0.012)

    tone1 = np.sin(2.0 * np.pi * 1200.0 * t) * 0.7 + np.sin(2.0 * np.pi * 2400.0 * t) * 0.3
    tone2 = np.sin(2.0 * np.pi * 950.0 * t) * 0.6 + np.sin(2.0 * np.pi * 1900.0 * t) * 0.4
    samples = tone1 * env1 + 0.65 * tone2 * env2
    _write_wav_mono(path, samples, sr)


def _generate_chime(path: Path, duration: float = 0.50, sr: int = 44100) -> None:
    """Multi-partial bell harmonic chime (fundamental + 3rd + 5th + octave)."""
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)
    attack = np.clip(t / 0.006, 0.0, 1.0)

    f0 = 587.33  # D5
    p1 = np.sin(2.0 * np.pi * f0 * t) * np.exp(-t * 6.5) * 0.50
    p2 = np.sin(2.0 * np.pi * (f0 * 1.5) * t) * np.exp(-t * 8.0) * 0.30
    p3 = np.sin(2.0 * np.pi * (f0 * 2.0) * t) * np.exp(-t * 9.5) * 0.15
    p4 = np.sin(2.0 * np.pi * (f0 * 3.0) * t) * np.exp(-t * 12.0) * 0.05

    samples = (p1 + p2 + p3 + p4) * attack
    _write_wav_mono(path, samples, sr)


def _generate_riser(path: Path, duration: float = 0.60, sr: int = 44100) -> None:
    """Multi-oscillator pitch swell + bandpass noise with smooth crescendo."""
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)
    prog = t / duration

    # 180Hz -> 620Hz swell
    freq = 180.0 + 440.0 * (prog ** 2.2)
    phase = 2.0 * np.pi * np.cumsum(freq) / sr
    env = (prog ** 1.9) * np.clip((1.0 - prog) * 16.0, 0.0, 1.0)

    rng = np.random.RandomState(77)
    noise = rng.uniform(-0.25, 0.25, n)
    lp = np.zeros(n)
    v = 0.0
    for i in range(n):
        v += 0.08 * (noise[i] - v)
        lp[i] = v

    samples = (np.sin(phase) * 0.7 + lp * 0.3) * env
    _write_wav_mono(path, samples, sr)


def _generate_blip(path: Path, duration: float = 0.15, sr: int = 44100) -> None:
    """Crisp two-tone Apple UI blip (587Hz -> 880Hz)."""
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)
    tone1 = np.sin(2.0 * np.pi * 587.33 * t) * np.exp(-t * 28.0) * (t < 0.055)
    t2 = np.maximum(0.0, t - 0.05)
    tone2 = np.sin(2.0 * np.pi * 880.0 * t) * np.exp(-t2 * 24.0) * (t >= 0.05)
    samples = tone1 + 1.1 * tone2
    _write_wav_mono(path, samples, sr)


def _generate_shutter(path: Path, duration: float = 0.12, sr: int = 44100) -> None:
    """Dual-transient mechanical camera shutter (t=0 and t=35ms)."""
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)

    rng = np.random.RandomState(99)
    noise = rng.uniform(-0.6, 0.6, n)

    env1 = np.exp(-t * 85.0) * np.clip(t / 0.002, 0.0, 1.0)
    t2 = np.maximum(0.0, t - 0.035)
    env2 = np.exp(-t2 * 95.0) * (t >= 0.035)

    click1 = (np.sin(2.0 * np.pi * 1250.0 * t) * 0.5 + noise * 0.5) * env1
    click2 = (np.sin(2.0 * np.pi * 1050.0 * t) * 0.4 + noise * 0.6) * env2
    samples = click1 + 0.8 * click2
    _write_wav_mono(path, samples, sr)


def _generate_sub_hit(path: Path, duration: float = 0.55, sr: int = 44100) -> None:
    """808 pitch-drop 120Hz->48Hz with click transient."""
    n = int(duration * sr)
    t = np.linspace(0, duration, n, endpoint=False)
    freq = 48.0 + 72.0 * np.exp(-t * 10.0)
    phase = 2.0 * np.pi * np.cumsum(freq) / sr
    env = np.exp(-t * 5.2) * np.clip(t / 0.004, 0.0, 1.0)

    # Transient click at start
    transient = np.sin(2.0 * np.pi * 800.0 * t) * np.exp(-t * 120.0) * 0.25
    samples = np.sin(phase) * env + transient
    _write_wav_mono(path, samples, sr)


def ensure_sfx_assets() -> Dict[str, str]:
    SFX_DIR.mkdir(parents=True, exist_ok=True)
    force_regen = not SFX_VERSION_MARKER.exists()

    specs = {
        "whoosh": _generate_whoosh,
        "pop": _generate_pop,
        "click": _generate_click,
        "chime": _generate_chime,
        "riser": _generate_riser,
        "blip": _generate_blip,
        "shutter": _generate_shutter,
        "sub_hit": _generate_sub_hit,
    }
    urls: Dict[str, str] = {}
    for name, fn in specs.items():
        target = SFX_DIR / f"{name}.wav"
        if force_regen or not target.exists() or target.stat().st_size < 100:
            try:
                fn(target)
                logger.info(f"Generated v5.0 SFX: {target.name}")
            except Exception as e:
                logger.warning(f"Failed generating SFX {name}: {e}")
        if target.exists():
            urls[name] = f"/storage/sfx/{target.name}"

    if force_regen:
        try:
            SFX_VERSION_MARKER.write_text("v5.0", encoding="utf-8")
        except Exception:
            pass
    return urls
