import React from 'react';
import { PresetConfig } from '../../types';

interface Props {
  preset: PresetConfig;
  title: string;
}

export const SwissEditorialOverlay: React.FC<Props> = ({ preset, title }) => {
  if (!preset.id.includes('opus')) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-20 flex flex-col justify-between p-8">
      {/* Top Swiss Banner */}
      <div className="flex flex-col gap-2">
        <div className="bg-[#E63946] text-white font-headline text-3xl font-black px-6 py-3 uppercase tracking-wider inline-block shadow-lg self-start">
          {title}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-700 bg-white/90 px-4 py-1.5 border border-slate-300 self-start shadow-sm">
          <span>FIG. 01 // INTERVIEW</span>
          <span>•</span>
          <span>1080x1920 60FPS</span>
        </div>
      </div>

      {/* Hairline Borders and Corner Marks */}
      <div className="absolute top-28 left-8 right-8 border-t-2 border-slate-400/40" />
      <div className="absolute bottom-28 left-8 right-8 border-b-2 border-slate-400/40" />

      {/* Bottom Technical Tag */}
      <div className="flex justify-between items-end text-xs font-mono font-bold text-slate-500">
        <div className="bg-white/80 px-3 py-1 border border-slate-300">
          SWISS_GRID_SYSTEM // V5.5
        </div>
        <div className="bg-white/80 px-3 py-1 border border-slate-300">
          PROCESSED_BY_AI
        </div>
      </div>
    </div>
  );
};
