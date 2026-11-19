import React from 'react';
import { MotionEvent } from '../../types';

interface MotionTrackLaneProps {
  motionEvents: MotionEvent[];
  safeDuration: number;
  onSelectBeat: (idx: number, timeSec: number) => void;
}

export const MotionTrackLane: React.FC<MotionTrackLaneProps> = ({
  motionEvents,
  safeDuration,
  onSelectBeat,
}) => {
  return (
    <div className="absolute bottom-1 inset-x-0 h-3.5 flex pointer-events-auto z-20">
      {motionEvents.map((ev, idx) => {
        const leftPct = (Number(ev.time_sec || 0) / safeDuration) * 100;
        const dur = Number(ev.duration_sec || 2.4);
        const widthPct = Math.max(2.5, (dur / safeDuration) * 100);
        return (
          <div
            key={`mot_${idx}`}
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBeat(idx, Number(ev.time_sec || 0));
            }}
            title={`Beat #${idx + 1}: ${ev.value || ev.text || ev.type} (${Number(ev.time_sec || 0).toFixed(1)}s)`}
            className="absolute h-full rounded-sm bg-amber-400/90 hover:bg-amber-300 border border-amber-200/60 px-1 flex items-center overflow-hidden cursor-pointer shadow-sm hover:scale-105 transition-transform"
          >
            <span className="text-[8px] font-mono font-black text-slate-950 truncate pointer-events-none">
              {ev.value || ev.label || ev.type.slice(0, 6)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
