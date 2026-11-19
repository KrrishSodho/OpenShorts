import React, { useState, useRef } from 'react';
import { Move, RotateCcw } from 'lucide-react';
import { MotionEvent } from '../types';

interface CanvasDragOverlayProps {
  activeBeat: MotionEvent | null;
  activeBeatIndex: number;
  currentPlaySec: number;
  isRendering: boolean;
  isPlaying?: boolean;
  isModalOpen?: boolean;
  onUpdateBeatPos: (beatIndex: number, pos: { custom_x?: number | null; custom_y?: number | null }) => void;
}

export const CanvasDragOverlay: React.FC<CanvasDragOverlayProps> = ({
  activeBeat,
  activeBeatIndex,
  currentPlaySec,
  isRendering,
  isPlaying = false,
  isModalOpen = false,
  onUpdateBeatPos,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically hide drag overlay if any modal is open in the DOM, rendering, or playback is active
  const isAnyModalOpen =
    isModalOpen ||
    (typeof document !== 'undefined' && Boolean(document.querySelector('[role="dialog"]')));

  if (!activeBeat || isRendering || isPlaying || isAnyModalOpen) return null;

  // Check if beat is currently visible at playhead (with small grace margin)
  const beatStart = Number(activeBeat.time_sec || 0);
  const beatDur = Number(activeBeat.duration_sec || 2.4);
  const isVisible = currentPlaySec >= beatStart - 0.2 && currentPlaySec <= beatStart + beatDur + 0.2;

  const posX = activeBeat.custom_x ?? 50;
  const posY = activeBeat.custom_y ?? 50;

  const isSnappedX = Math.abs(posX - 50) < 0.1;
  const isSnappedY = Math.abs(posY - 50) < 0.1;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    let rawX = ((e.clientX - rect.left) / rect.width) * 100;
    let rawY = ((e.clientY - rect.top) / rect.height) * 100;

    // Snap to 50% center within 2.5% tolerance
    if (Math.abs(rawX - 50) < 2.5) rawX = 50;
    if (Math.abs(rawY - 50) < 2.5) rawY = 50;

    const clampedX = Math.round(Math.max(10, Math.min(90, rawX)));
    const clampedY = Math.round(Math.max(12, Math.min(84, rawY)));

    onUpdateBeatPos(activeBeatIndex, { custom_x: clampedX, custom_y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`absolute inset-0 pointer-events-none select-none z-10 transition-opacity ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Center Snapping Guidelines */}
      {isDragging && (
        <>
          {/* Vertical center snap line (X=50%) */}
          <div
            className={`absolute top-0 bottom-0 left-1/2 w-[1px] -translate-x-1/2 transition-colors ${
              isSnappedX ? 'bg-cyan-400 shadow-[0_0_8px_#00F5FF]' : 'bg-slate-500/30 border-dashed'
            }`}
          />
          {/* Horizontal center snap line (Y=50%) */}
          <div
            className={`absolute left-0 right-0 top-1/2 h-[1px] -translate-y-1/2 transition-colors ${
              isSnappedY ? 'bg-cyan-400 shadow-[0_0_8px_#00F5FF]' : 'bg-slate-500/30 border-dashed'
            }`}
          />

          {/* Caption Safe Zone Limit (bottom 18%) */}
          <div className="absolute left-4 right-4 bottom-[18%] border-b border-rose-500/40 border-dashed flex justify-end">
            <span className="text-[9px] font-mono text-rose-400/80 px-1.5 py-0.5 bg-black/60 rounded">
              Caption Safe Zone
            </span>
          </div>
        </>
      )}

      {/* Interactive Draggable Anchor Handle (Visible only on canvas hover or active drag) */}
      {isVisible && (
        <div
          style={{
            left: `${posX}%`,
            top: `${posY}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing transition-opacity duration-150 ${
            isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onPointerDown={handlePointerDown}
        >
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xl backdrop-blur-md transition-all ${
              isDragging
                ? 'bg-cyan-500 text-slate-950 border-white ring-2 ring-cyan-400 scale-105'
                : 'bg-slate-900/90 text-cyan-400 border-cyan-400/60 hover:scale-105'
            }`}
          >
            <Move className="w-3 h-3" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">
              {isDragging ? `${posX}%, ${posY}%` : 'Drag Graphic'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
