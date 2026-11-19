import React, { useRef, useEffect, useCallback } from 'react';
import { PlayerRef } from '@remotion/player';
import { stopSfxAudioPreview } from '../utils/audioPreview';
import { ClipEditState } from '../types';

interface UsePlayerSyncProps {
  playerRef: React.RefObject<PlayerRef | null>;
  activeClip: ClipEditState | null;
  activeClipId: string | null;
  fps: number;
  totalFrames: number;
  clipDuration: number;
  currentPlaySec: number;
  setCurrentPlaySec: (sec: number) => void;
  setIsPlaying: (playing: boolean) => void;
  isPreparingClip: boolean;
  isLoadModalOpen: boolean;
  pipelineState: string;
}

export function usePlayerSync({
  playerRef,
  activeClip,
  activeClipId,
  fps,
  totalFrames,
  clipDuration,
  currentPlaySec,
  setCurrentPlaySec,
  setIsPlaying,
  isPreparingClip,
  isLoadModalOpen,
  pipelineState,
}: UsePlayerSyncProps) {
  const lastUpdateSecRef = useRef<number>(0);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    lastUpdateSecRef.current = 0;

    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      const sec = e.detail.frame / fps;
      const trimEnd = activeClip?.trimEnd ?? clipDuration;
      const trimStart = activeClip?.trimStart ?? 0;
      if (trimEnd && sec >= trimEnd && trimEnd > trimStart + 0.5) {
        const startFrame = Math.floor(trimStart * fps);
        player.seekTo(startFrame);
        setCurrentPlaySec(trimStart);
        return;
      }
      // Throttle state update to at most once per 60ms (~16 updates/sec)
      // to prevent CPU starvation and decoder freezing
      if (Math.abs(sec - lastUpdateSecRef.current) >= 0.06 || sec === 0) {
        lastUpdateSecRef.current = sec;
        setCurrentPlaySec(sec);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      const startFrame = Math.floor((activeClip?.trimStart ?? 0) * fps);
      player.seekTo(startFrame);
      setCurrentPlaySec(activeClip?.trimStart ?? 0);
    };
    const onError = () => {
      setIsPlaying(false);
    };

    player.addEventListener('frameupdate', onFrameUpdate as any);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('ended', onEnded);
    player.addEventListener('error', onError as any);

    return () => {
      player.removeEventListener('frameupdate', onFrameUpdate as any);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('ended', onEnded);
      player.removeEventListener('error', onError as any);
    };
  }, [activeClipId, activeClip?.videoUrl, activeClip?.trimStart, activeClip?.trimEnd, clipDuration, fps, setCurrentPlaySec, setIsPlaying, playerRef]);

  // Guaranteed auto-pause & audio stop when modal opens or ingestion/preparation is active
  useEffect(() => {
    if (isPreparingClip || isLoadModalOpen || pipelineState === 'PROCESSING') {
      setIsPlaying(false);
      stopSfxAudioPreview();
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {
          // ignore
        }
      }
    }
  }, [isPreparingClip, isLoadModalOpen, pipelineState, setIsPlaying, playerRef]);

  // Guaranteed clean seek to start and audio reset whenever active clip switches
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const startSec = activeClip?.trimStart ?? 0;
    const startFrame = Math.floor(startSec * fps);
    try {
      player.pause();
      player.seekTo(startFrame);
      setCurrentPlaySec(startSec);
      setIsPlaying(false);
      stopSfxAudioPreview();
    } catch {
      // ignore
    }
  }, [activeClipId, activeClip?.videoUrl, activeClip?.trimStart, fps, setCurrentPlaySec, setIsPlaying, playerRef]);

  const handleSeekRelative = useCallback(
    (seconds: number) => {
      const clampedSec = Math.max(0, seconds);
      const targetFrame = Math.min(
        Math.max(0, totalFrames - 1),
        Math.ceil(clampedSec * fps - 1e-6)
      );
      if (playerRef.current) {
        playerRef.current.seekTo(targetFrame);
      }
      setCurrentPlaySec(targetFrame / fps);
    },
    [fps, totalFrames, setCurrentPlaySec, playerRef]
  );

  const handleTogglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const currentFrame = player.getCurrentFrame();
    const activeTrimEnd = activeClip?.trimEnd ?? clipDuration;
    const activeTrimStart = activeClip?.trimStart ?? 0;
    const maxPlaySec = Math.min(clipDuration, activeTrimEnd);

    // If playback reached or is near the end or trim boundary, loop back to trimStart
    if (currentPlaySec >= maxPlaySec - 0.1 || currentFrame >= totalFrames - 2) {
      const startFrame = Math.floor(activeTrimStart * fps);
      player.seekTo(startFrame);
      setCurrentPlaySec(activeTrimStart);
      player.play();
      setIsPlaying(true);
      return;
    }
    if (player.isPlaying()) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [totalFrames, clipDuration, currentPlaySec, activeClip?.trimStart, activeClip?.trimEnd, fps, setCurrentPlaySec, setIsPlaying, playerRef]);

  const handleRestartAndPlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const startSec = activeClip?.trimStart ?? 0;
    const startFrame = Math.floor(startSec * fps);
    player.seekTo(startFrame);
    setCurrentPlaySec(startSec);
    player.play();
    setIsPlaying(true);
  }, [playerRef, activeClip?.trimStart, fps, setCurrentPlaySec, setIsPlaying]);

  return {
    handleSeekRelative,
    handleTogglePlay,
    handleRestartAndPlay,
  };
}
