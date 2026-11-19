import React from 'react';
import { interpolate } from 'remotion';
import { CaptionRenderProps, resolveHighlightTokens } from './types';

export const KaraokePill: React.FC<CaptionRenderProps> = ({
  activePhrase,
  activeWordIndex,
  currentTime,
  cfg,
  themeAccent,
  fontSizePx,
  formatWord,
}) => {
  const pWords = activePhrase.words;
  const colorTokens = resolveHighlightTokens(cfg.customHighlightColor || cfg.highlightColor || themeAccent, 'yellow');
  const pillBg = cfg.bgColor || 'rgba(2, 6, 23, 0.90)';
  const spokenText = cfg.textColor || '#FFFFFF';
  const phraseProgress = interpolate(
    currentTime,
    [activePhrase.start, Math.max(activePhrase.start + 0.1, activePhrase.end)],
    [0, 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div className="w-full px-8 flex flex-col items-center justify-center pointer-events-none z-40">
      <div
        style={{ backgroundColor: pillBg }}
        className="backdrop-blur-md border border-white/20 rounded-2xl px-8 py-4 shadow-2xl flex flex-col items-center gap-3 max-w-[95%]"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {pWords.map((w, idx) => {
            const isActive = idx === activeWordIndex;
            const isSpoken = idx <= activeWordIndex;
            return (
              <span
                key={`${w.word}_${idx}`}
                className="leading-tight inline-block select-none mx-1"
                style={{
                  fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
                  fontWeight: 900,
                  letterSpacing: '0.03em',
                  fontSize: `${fontSizePx + 4}px`,
                  color: isActive ? colorTokens.hex : isSpoken ? spokenText : '#94A3B8',
                  textShadow: isActive ? `0 0 16px ${colorTokens.glowHex}` : 'none',
                }}
              >
                {formatWord(w.word)}
              </span>
            );
          })}
        </div>
        <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${phraseProgress.toFixed(1)}%`,
              backgroundColor: colorTokens.hex,
              boxShadow: `0 0 12px ${colorTokens.glowHex}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
