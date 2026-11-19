import React from 'react';
import { MotionEvent } from '../../types';

interface BeatPillTrackProps {
  motionEvents: MotionEvent[];
  safeIdx: number;
  onSelectBeat: (idx: number) => void;
}

export const BeatPillTrack: React.FC<BeatPillTrackProps> = ({
  motionEvents,
  safeIdx,
  onSelectBeat,
}) => {
  return (
    <div className="flex flex-wrap gap-1.5 shrink-0">
      {motionEvents.map((ev, idx) => {
        const isSelected = idx === safeIdx;
        const zoneName = (ev.zone || 'center')
          .replace('_stage', '')
          .replace('_spotlight', '')
          .replace('_takeover', '')
          .replace('_overlay', '');
        return (
          <button
            key={`${ev.time_sec}_${idx}`}
            type="button"
            onClick={() => onSelectBeat(idx)}
            className={`px-3 py-2 rounded-xl border text-left shrink-0 flex flex-col gap-0.5 transition-all min-w-[110px] select-none focus:outline-none focus:ring-1 focus:ring-cyan-400/50 ${
              isSelected
                ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md'
                : 'bg-studio-dark border-studio-border text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
              <span className="text-cyan-400 font-bold">{ev.time_sec.toFixed(1)}s</span>
              <span className="uppercase px-1.5 bg-slate-800 rounded text-[9px]">
                {zoneName}
              </span>
            </div>
            <span className="text-[11px] font-bold truncate max-w-[125px]">
              {ev.value || ev.text || ev.type.replace(/_/g, ' ')}
            </span>
          </button>
        );
      })}
    </div>
  );
};
