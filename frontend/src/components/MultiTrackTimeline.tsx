import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { PanKeyframe, MotionEvent, TranscriptWord } from '../types';
import { useStudioStore } from '../store/useStudioStore';
import { Button, IconButton } from './ui';
import { SpeakerTrackLane } from './timeline/SpeakerTrackLane';
import { AudioTrackLane } from './timeline/AudioTrackLane';
import { MotionTrackLane } from './timeline/MotionTrackLane';

interface MultiTrackTimelineProps {
  durationSec: number;
  currentPlaySec: number;
  fps: number;
  isPlaying: boolean;
  panKeyframes: PanKeyframe[];
  motionEvents: MotionEvent[];
  words?: TranscriptWord[];
  trimStart?: number;
  trimEnd?: number;
  onTogglePlay: () => void;
  onSeekRelative: (sec: number) => void;
  onRestartAndPlay?: () => void;
  onTrimChange?: (trimStart: number, trimEnd: number) => void;
}

const TOTAL_WAVE_BARS = 64;

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
  durationSec,
  currentPlaySec,
  fps,
  isPlaying,
  panKeyframes,
  motionEvents,
  words = [],
  trimStart = 0,
  trimEnd,
  onTogglePlay,
  onSeekRelative,
  onRestartAndPlay,
  onTrimChange,
}) => {
  const { setSelectedBeatIdx } = useStudioStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const safeDuration = Math.max(1, Number(durationSec) || 30);
  const activeTrimEnd = Math.max(trimStart + 0.5, Math.min(safeDuration, trimEnd ?? safeDuration));
  const activeTrimStart = Math.max(0, Math.min(trimStart, activeTrimEnd - 0.5));

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [activeTrimDrag, setActiveTrimDrag] = useState<'in' | 'out' | null>(null);
  const [magneticSnapT, setMagneticSnapT] = useState<number | null>(null);

  const playheadPct = Math.min(100, Math.max(0, (currentPlaySec / safeDuration) * 100));
  const trimStartPct = Math.min(100, Math.max(0, (activeTrimStart / safeDuration) * 100));
  const trimEndPct = Math.min(100, Math.max(0, (activeTrimEnd / safeDuration) * 100));

  // Magnetic snap targets: camera shot cuts + motion event trigger times
  const snapTargets = useMemo(() => {
    const list: number[] = [0, safeDuration];
    panKeyframes.forEach((kf) => list.push(kf.t));
    motionEvents.forEach((ev) => list.push(Number(ev.time_sec || 0)));
    return Array.from(new Set(list)).sort((a, b) => a - b);
  }, [panKeyframes, motionEvents, safeDuration]);

  // Audio speech activity waveform bars
  const waveformBars = useMemo(() => {
    const bars: Array<{ pct: number; heightPct: number; isSpeech: boolean }> = [];
    const stepSec = safeDuration / TOTAL_WAVE_BARS;

    for (let i = 0; i < TOTAL_WAVE_BARS; i++) {
      const bStart = i * stepSec;
      const bEnd = (i + 1) * stepSec;
      const pct = (i / TOTAL_WAVE_BARS) * 100;
      const hasWord = words.some((w) => w.start < bEnd && w.end > bStart);
      const seed = Math.sin(i * 12.34) * 0.5 + 0.5;
      const heightPct = hasWord ? 55 + Math.round(seed * 40) : 18 + Math.round(seed * 8);
      bars.push({ pct, heightPct, isSpeech: hasWord });
    }
    return bars;
  }, [words, safeDuration]);

  // Calculate time from clientX with magnetic snapping
  const getTimeFromClientX = useCallback(
    (clientX: number): { time: number; snapped: boolean } => {
      if (!trackRef.current) return { time: 0, snapped: false };
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const rawT = ratio * safeDuration;

      const snapThreshold = 0.12;
      for (const target of snapTargets) {
        if (Math.abs(rawT - target) <= snapThreshold) {
          return { time: target, snapped: true };
        }
      }
      return { time: +rawT.toFixed(2), snapped: false };
    },
    [safeDuration, snapTargets]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTrimDrag) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    const { time, snapped } = getTimeFromClientX(e.clientX);
    setMagneticSnapT(snapped ? time : null);
    onSeekRelative(time);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTrimDrag === 'in' && onTrimChange) {
      const { time } = getTimeFromClientX(e.clientX);
      const clamped = Math.max(0, Math.min(time, activeTrimEnd - 0.5));
      onTrimChange(clamped, activeTrimEnd);
      return;
    }

    if (activeTrimDrag === 'out' && onTrimChange) {
      const { time } = getTimeFromClientX(e.clientX);
      const clamped = Math.max(activeTrimStart + 0.5, Math.min(safeDuration, time));
      onTrimChange(activeTrimStart, clamped);
      return;
    }

    if (isScrubbing) {
      const { time, snapped } = getTimeFromClientX(e.clientX);
      setMagneticSnapT(snapped ? time : null);
      onSeekRelative(time);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTrimDrag) setActiveTrimDrag(null);
    if (isScrubbing) {
      setIsScrubbing(false);
      setMagneticSnapT(null);
    }
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const isTrimmed = activeTrimStart > 0.05 || activeTrimEnd < safeDuration - 0.05;

  return (
    <div className="w-full flex flex-col gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shrink-0 shadow-lg">
      {/* Transport Controls Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton
            variant="ghost"
            size="xs"
            onClick={onRestartAndPlay ? onRestartAndPlay : () => { onSeekRelative(activeTrimStart); if (!isPlaying) onTogglePlay(); }}
            icon={<RotateCcw className="w-3.5 h-3.5 text-cyan-400" />}
            aria-label="Play from Start (0:00)"
            title="Play from Start (0:00)"
          />
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => onSeekRelative(Math.max(0, currentPlaySec - 5))}
            icon={<ChevronsLeft className="w-3.5 h-3.5" />}
            aria-label="Seek -5s"
            title="Seek -5s"
          />
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => onSeekRelative(activeTrimStart)}
            icon={<SkipBack className="w-3.5 h-3.5" />}
            aria-label="Jump to Start (0:00)"
            title="Jump to Start (0:00)"
          />
          <Button
            variant="primary"
            size="xs"
            onClick={onTogglePlay}
            leftIcon={
              isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )
            }
            className="px-3 font-bold"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => onSeekRelative(activeTrimEnd)}
            icon={<SkipForward className="w-3.5 h-3.5" />}
            aria-label="Jump to End"
            title="Jump to End"
          />
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => onSeekRelative(Math.min(safeDuration, currentPlaySec + 5))}
            icon={<ChevronsRight className="w-3.5 h-3.5" />}
            aria-label="Seek +5s"
            title="Seek +5s"
          />

          {isTrimmed && onTrimChange && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onTrimChange(0, safeDuration)}
              leftIcon={<RotateCcw className="w-3 h-3 text-cyan-400" />}
              className="text-[10px] font-mono text-cyan-400 ml-1.5"
              title="Reset In/Out Points"
            >
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isTrimmed && (
            <span className="text-[10px] font-mono text-slate-400">
              IN: <span className="text-cyan-300 font-bold">{activeTrimStart.toFixed(1)}s</span> | OUT:{' '}
              <span className="text-amber-300 font-bold">{activeTrimEnd.toFixed(1)}s</span>
            </span>
          )}
          <span className="text-[11px] font-mono text-slate-300">
            <strong className="text-cyan-400">{currentPlaySec.toFixed(2)}s</strong> /{' '}
            {safeDuration.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Multi-Track Scrubbing Area */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-14 bg-slate-950 rounded-lg border border-slate-800 cursor-ew-resize overflow-hidden select-none touch-none"
      >
        {/* Inactive Trimming Overlays */}
        {trimStartPct > 0 && (
          <div
            style={{ width: `${trimStartPct}%` }}
            className="absolute left-0 inset-y-0 bg-black/60 z-10 pointer-events-none border-r border-cyan-500/60"
          />
        )}
        {trimEndPct < 100 && (
          <div
            style={{ left: `${trimEndPct}%`, right: 0 }}
            className="absolute inset-y-0 bg-black/60 z-10 pointer-events-none border-l border-amber-500/60"
          />
        )}

        {/* Track 1: Camera Shot Cuts */}
        <SpeakerTrackLane panKeyframes={panKeyframes} safeDuration={safeDuration} />

        {/* Track 2: Speech Activity / Waveform Energy Bars */}
        <AudioTrackLane
          waveformBars={waveformBars}
          playheadPct={playheadPct}
          totalWaveBars={TOTAL_WAVE_BARS}
        />

        {/* Track 3: Motion Graphics Beats */}
        <MotionTrackLane
          motionEvents={motionEvents}
          safeDuration={safeDuration}
          onSelectBeat={(idx, timeSec) => {
            setSelectedBeatIdx(idx);
            onSeekRelative(timeSec + 0.1);
          }}
        />

        {/* Magnetic Snap Guideline */}
        {magneticSnapT !== null && (
          <div
            style={{ left: `${(magneticSnapT / safeDuration) * 100}%` }}
            className="absolute inset-y-0 w-0.5 bg-cyan-300 shadow-[0_0_10px_#67e8f9] pointer-events-none z-30"
          />
        )}

        {/* In Handle */}
        {onTrimChange && (
          <div
            style={{ left: `${trimStartPct}%` }}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              setActiveTrimDrag('in');
            }}
            title={`Trim Start: ${activeTrimStart.toFixed(1)}s (Press 'I')`}
            className="absolute inset-y-0 -ml-1.5 w-3 cursor-ew-resize flex items-center justify-center z-25 group"
          >
            <div className="w-1.5 h-full bg-cyan-400 rounded-l shadow-[0_0_8px_#22d3ee] flex items-center justify-center">
              <div className="w-0.5 h-4 bg-slate-950 rounded-full" />
            </div>
          </div>
        )}

        {/* Out Handle */}
        {onTrimChange && (
          <div
            style={{ left: `${trimEndPct}%` }}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              setActiveTrimDrag('out');
            }}
            title={`Trim End: ${activeTrimEnd.toFixed(1)}s (Press 'O')`}
            className="absolute inset-y-0 -ml-1.5 w-3 cursor-ew-resize flex items-center justify-center z-25 group"
          >
            <div className="w-1.5 h-full bg-amber-400 rounded-r shadow-[0_0_8px_#fbbf24] flex items-center justify-center">
              <div className="w-0.5 h-4 bg-slate-950 rounded-full" />
            </div>
          </div>
        )}

        {/* Live Playhead Needle */}
        <div
          style={{ left: `${playheadPct}%` }}
          className="absolute inset-y-0 -ml-[1px] w-[2px] bg-rose-500 shadow-[0_0_8px_#f43f5e] pointer-events-none z-20 flex flex-col justify-start items-center"
        >
          <div className="w-2.5 h-2.5 -mt-1 bg-rose-500 rounded-full shadow-[0_0_6px_#f43f5e]" />
        </div>
      </div>
    </div>
  );
};
