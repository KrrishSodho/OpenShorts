import React from 'react';
import { spring } from 'remotion';
import { CaptionRenderProps, resolveHighlightTokens } from './types';

export const PaperOrBoxCaptions: React.FC<CaptionRenderProps> = ({
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

  const isOpus = cfg.style === 'opus_paper';
  const isNeon = cfg.style === 'neon_cyan';

  const defaultColor = isNeon ? 'cyan' : isOpus ? 'crimson' : 'crimson';
  const colorTokens = resolveHighlightTokens(cfg.customHighlightColor || cfg.highlightColor || themeAccent, defaultColor);

  const activeBg = cfg.customHighlightColor || colorTokens.hex;
  const activeText = colorTokens.textHex;
  const inactiveText = cfg.textColor || (isOpus ? '#0F172A' : '#F8FAFC');
  const boxBg = cfg.bgColor || (isOpus ? 'rgba(246, 242, 233, 0.98)' : 'rgba(8, 12, 20, 0.94)');

  return (
    <div className="w-full px-8 flex flex-col items-center justify-center gap-3 pointer-events-none z-40">
      {rows.map((row, rIdx) => {
        const baseIdx = rIdx === 0 ? 0 : splitIdx;
        return (
          <div
            key={rIdx}
            className="inline-flex max-w-[95%] flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.85)] rounded-xl"
            style={{
              backgroundColor: boxBg,
              border: isOpus ? '1.5px solid rgba(15, 23, 42, 0.3)' : '1.5px solid rgba(255, 255, 255, 0.16)',
            }}
          >
            {row.map((w, idx) => {
              const globalIdx = baseIdx + idx;
              const isActive = globalIdx === activeWordIndex;
              const framesIn = Math.max(0, Math.round((currentTime - w.start) * fps));
              const pop = isActive
                ? spring({
                    frame: framesIn,
                    fps,
                    config: { damping: 13, stiffness: 280, mass: 0.45 },
                  })
                : 0;
              const scale = 1 + 0.08 * pop;

              return (
                <span
                  key={`${w.word}_${w.start}_${globalIdx}`}
                  className="inline-block select-none rounded-lg transition-all"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    fontSize: `${fontSizePx + 4}px`,
                    lineHeight: 1.15,
                    transform: `scale(${scale.toFixed(3)})`,
                    padding: isActive ? '6px 14px' : '4px 8px',
                    margin: '0 2px',
                    color: isActive ? activeText : inactiveText,
                    backgroundColor: isActive ? activeBg : isOpus ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                    boxShadow: isActive ? `0 0 18px ${colorTokens.glowHex}, 0 4px 10px rgba(0,0,0,0.5)` : 'none',
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
