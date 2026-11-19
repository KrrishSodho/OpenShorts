import React from 'react';

interface WaveformBarItem {
  pct: number;
  heightPct: number;
  isSpeech: boolean;
}

interface AudioTrackLaneProps {
  waveformBars: WaveformBarItem[];
  playheadPct: number;
  totalWaveBars: number;
}

export const AudioTrackLane: React.FC<AudioTrackLaneProps> = ({
  waveformBars,
  playheadPct,
  totalWaveBars,
}) => {
  return (
    <div className="absolute top-5 inset-x-0 h-4 flex items-center px-1 pointer-events-none overflow-hidden">
      {waveformBars.map((b, idx) => {
        const isPlayed = b.pct <= playheadPct;
        return (
          <div
            key={`wave_${idx}`}
            style={{
              height: `${b.heightPct}%`,
              width: `${100 / totalWaveBars}%`,
            }}
            className={`flex-1 mx-[0.5px] rounded-t-sm transition-colors ${
              isPlayed
                ? b.isSpeech
                  ? 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]'
                  : 'bg-slate-600'
                : b.isSpeech
                ? 'bg-slate-700'
                : 'bg-slate-900'
            }`}
          />
        );
      })}
    </div>
  );
};
