import React from 'react';
import { CaptionRenderProps, resolveHighlightTokens } from './types';

export const MinimalShadow: React.FC<CaptionRenderProps> = ({
  activePhrase,
  activeWordIndex,
  cfg,
  themeAccent,
  fontSizePx,
  formatWord,
}) => {
  const pWords = activePhrase.words;
  const splitIdx = pWords.length >= 4 ? Math.ceil(pWords.length / 2) : pWords.length;
  const rows = [pWords.slice(0, splitIdx), pWords.slice(splitIdx)].filter((r) => r.length > 0);
  const colorTokens = resolveHighlightTokens(cfg.customHighlightColor || cfg.highlightColor || themeAccent, 'yellow');
  const inactiveText = cfg.textColor || '#FFFFFF';

  return (
    <div className="w-full px-8 flex flex-col items-center justify-center gap-2 pointer-events-none z-40">
      {rows.map((row, rIdx) => {
        const baseIdx = rIdx === 0 ? 0 : splitIdx;
        return (
          <div key={rIdx} className="inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {row.map((w, idx) => {
              const globalIdx = baseIdx + idx;
              const isActive = globalIdx === activeWordIndex;
              const isSpoken = globalIdx <= activeWordIndex;
              return (
                <span
                  key={`${w.word}_${globalIdx}`}
                  className="leading-tight inline-block select-none mx-1"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    fontSize: `${fontSizePx + 4}px`,
                    color: isActive ? colorTokens.hex : inactiveText,
                    opacity: isSpoken ? 1 : 0.65,
                    textShadow: isActive
                      ? `0 0 18px ${colorTokens.glowHex}, 0 2px 6px rgba(0,0,0,1)`
                      : '0 3px 18px rgba(0,0,0,0.98), 0 2px 4px rgba(0,0,0,1)',
                  }}
                >
                  {formatWord(w.word)}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
