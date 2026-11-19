export function formatSecondsToTimecode(sec: number, fps = 30): string {
  const total = Math.max(0, Number(sec) || 0);
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  const f = Math.floor((total % 1) * fps);

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  const ff = String(f).padStart(2, '0');

  return `${mm}:${ss}:${ff}`;
}

export function formatDurationLabel(sec: number): string {
  const total = Math.max(0, Number(sec) || 0);
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${total.toFixed(1)}s`;
}
