let activeAudioInstance: HTMLAudioElement | null = null;

export function stopSfxAudioPreview(): void {
  if (activeAudioInstance) {
    try {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    } catch {
      // Ignore pause failure
    }
    activeAudioInstance = null;
  }
}

export function playSfxAudioPreview(sfxType: string, volume = 0.5): void {
  if (!sfxType || sfxType === 'none' || sfxType === 'silent') return;

  stopSfxAudioPreview();

  const audio = new Audio(`/storage/sfx/${sfxType}.wav`);
  audio.volume = Math.max(0, Math.min(1, volume));
  activeAudioInstance = audio;

  audio.play().catch((err) => {
    // Browsers may block autoplay if not user-initiated
    console.debug(`[SFX Preview] Failed playing ${sfxType}.wav:`, err);
  });
}
