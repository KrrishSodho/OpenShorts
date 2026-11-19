import React from 'react';
import { useCurrentFrame } from 'remotion';
import { PresetConfig } from '../../types';

interface Props {
  preset: PresetConfig;
}

export const BackgroundMatrix: React.FC<Props> = ({ preset }) => {
  const frame = useCurrentFrame();
  const bg = preset?.background || {};

  if (bg.type === 'halftone_matrix') {
    // Fable 5.2 Style: Pulsing retro halftone dots
    const pulse = Math.sin(frame / 20) * 0.15 + 0.85;
    return (
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: bg.baseColor || bg.primaryColor || '#0A0A0A',
          backgroundImage: `radial-gradient(${bg.dotColor || bg.secondaryColor || '#222222'} 2px, transparent 2px)`,
          backgroundSize: '24px 24px',
          opacity: pulse,
        }}
      />
    );
  }

  if (bg.type === 'paper_grid') {
    // Opus 5.5 Style: Clean Swiss editorial paper with subtle technical hairline grid
    return (
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{
          backgroundColor: bg.baseColor || bg.primaryColor || '#F5F2EB',
          backgroundImage: `
            linear-gradient(to right, ${bg.gridLineColor || bg.secondaryColor || '#E0DDD5'} 1px, transparent 1px),
            linear-gradient(to bottom, ${bg.gridLineColor || bg.secondaryColor || '#E0DDD5'} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        {/* Subtle technical crosshairs at corners */}
        <div className="absolute top-8 left-8 text-xs font-mono text-slate-400 select-none">
          + 00.284 // EDITORIAL GRID
        </div>
        <div className="absolute top-8 right-8 text-xs font-mono text-slate-400 select-none">
          SEC. 9:16 +
        </div>
      </div>
    );
  }

  // Vox Blueprint Style
  return (
    <div 
      className="absolute inset-0 w-full h-full"
      style={{
        backgroundColor: bg.baseColor || bg.primaryColor || '#080F1E',
        backgroundImage: `
          linear-gradient(to right, #152238 1px, transparent 1px),
          linear-gradient(to bottom, #152238 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    />
  );
};
