import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface Props {
  startFrame?: number;
  label?: string;
  targetValue?: number;
}

export const AnimatedChart: React.FC<Props> = ({
  startFrame = 45,
  label = "RETENTION ACCELERATION",
  targetValue = 98.4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);
  if (frame < startFrame) return null;

  const scale = spring({
    frame: relFrame,
    fps,
    config: { damping: 10, stiffness: 180 },
  });

  const value = interpolate(relFrame, [0, 30], [0, targetValue], {
    extrapolateRight: 'clamp',
  });

  const barHeight = interpolate(relFrame, [0, 30], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <div 
      className="absolute top-[28%] left-8 right-8 bg-[#0F172A]/95 border-2 border-cyan-500/40 p-6 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-none z-25 flex items-center justify-between"
      style={{ transform: `scale(${scale})` }}
    >
      <div>
        <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
          {label}
        </div>
        <div className="text-5xl font-black font-headline text-white mt-1">
          +{value.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Top 1% viral distribution spike
        </div>
      </div>

      <div className="w-24 h-24 flex items-end justify-center bg-slate-800/60 rounded-xl p-2 border border-slate-700">
        <div 
          className="w-12 bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-lg transition-all"
          style={{ height: `${barHeight}%` }}
        />
      </div>
    </div>
  );
};
