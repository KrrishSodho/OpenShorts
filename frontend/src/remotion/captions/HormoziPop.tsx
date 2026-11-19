import React from 'react';
import { spring } from 'remotion';
import { CaptionRenderProps, resolveHighlightTokens } from './types';

export const HormoziPop: React.FC<CaptionRenderProps> = ({
  activePhrase,
  activeWordIndex,
  currentTime,
  fps,
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
    <div className="w-full px-8 flex flex-col items-center justify-center gap-2.5 pointer-events-none z-40">
      {rows.map((row, rIdx) => {
        const baseIdx = rIdx === 0 ? 0 : splitIdx;
        return (
          <div key={rIdx} className="inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {row.map((w, idx) => {
              const globalIdx = baseIdx + idx;
              const isActive = globalIdx === activeWordIndex;
              const framesIn = Math.max(0, Math.round((currentTime - w.start) * fps));
              const pop = isActive
                ? spring({
                    frame: framesIn,
                    fps,
                    config: { damping: 12, stiffness: 280, mass: 0.45 },
                  })
                : 0;
              const scale = 1 + 0.14 * pop;
              return (
                <span
                  key={`${w.word}_${globalIdx}`}
                  className="inline-block select-none mx-1"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    lineHeight: 1.15,
                    fontSize: `${fontSizePx + 8}px`,
                    transform: `scale(${scale.toFixed(3)})`,
                    color: isActive ? colorTokens.hex : inactiveText,
                    textShadow: isActive
                      ? `0 4px 0 #000000, -3px -3px 0 #000000, 3px -3px 0 #000000, -3px 3px 0 #000000, 3px 3px 0 #000000, 0 0 24px ${colorTokens.glowHex}`
                      : '0 4px 0 #000000, -3px -3px 0 #000000, 3px -3px 0 #000000, -3px 3px 0 #000000, 3px 3px 0 #000000, 0 10px 24px rgba(0,0,0,0.9)',
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
