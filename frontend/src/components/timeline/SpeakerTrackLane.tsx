import React from 'react';
import { PanKeyframe } from '../../types';

interface SpeakerTrackLaneProps {
  panKeyframes: PanKeyframe[];
  safeDuration: number;
}

export const SpeakerTrackLane: React.FC<SpeakerTrackLaneProps> = ({
  panKeyframes,
  safeDuration,
}) => {
  return (
    <div className="absolute top-1 inset-x-0 h-3 flex pointer-events-none">
      {panKeyframes.map((kf, idx) => {
        const nextT = panKeyframes[idx + 1]?.t ?? safeDuration;
        const leftPct = (kf.t / safeDuration) * 100;
        const widthPct = Math.max(1, ((nextT - kf.t) / safeDuration) * 100);
        return (
          <div
            key={`shot_${idx}`}
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            className="absolute h-full bg-indigo-500/30 border-r border-indigo-400/50 px-1 flex items-center overflow-hidden"
          >
            <span className="text-[7.5px] font-mono font-bold text-indigo-200 truncate">
              S{idx + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
};
