import { useEffect } from 'react';
import { ClipEditState } from '../types';

interface UseStudioHotkeysProps {
  undo: () => void;
  redo: () => void;
  handleTogglePlay: () => void;
  handleSeekRelative: (sec: number) => void;
  handleRestartAndPlay?: () => void;
  updateActiveClipTrim: (start: number, end: number) => void;
  activeClip: ClipEditState | null;
  currentPlaySec: number;
  clipDuration: number;
  fps: number;
  toggleShortcutsModal?: () => void;
}

export function useStudioHotkeys({
  undo,
  redo,
  handleTogglePlay,
  handleSeekRelative,
  handleRestartAndPlay,
  updateActiveClipTrim,
  activeClip,
  currentPlaySec,
  clipDuration,
  fps,
  toggleShortcutsModal,
}: UseStudioHotkeysProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / fps;
        handleSeekRelative(Math.max(0, currentPlaySec - step));
        return;
      }

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / fps;
        handleSeekRelative(Math.min(clipDuration, currentPlaySec + step));
        return;
      }

      if (e.code === 'KeyI' && activeClip) {
        e.preventDefault();
        const activeTrimEnd = activeClip.trimEnd ?? clipDuration;
        updateActiveClipTrim(Math.min(currentPlaySec, activeTrimEnd - 0.5), activeTrimEnd);
        return;
      }

      if (e.code === 'KeyO' && activeClip) {
        e.preventDefault();
        const activeTrimStart = activeClip.trimStart ?? 0;
        updateActiveClipTrim(activeTrimStart, Math.max(currentPlaySec, activeTrimStart + 0.5));
        return;
      }

      if (e.code === 'Home' && handleRestartAndPlay) {
        e.preventDefault();
        handleRestartAndPlay();
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        toggleShortcutsModal?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    handleTogglePlay,
    handleSeekRelative,
    handleRestartAndPlay,
    updateActiveClipTrim,
    activeClip,
    currentPlaySec,
    clipDuration,
    fps,
    toggleShortcutsModal,
  ]);
}
