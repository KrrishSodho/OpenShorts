import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
  staggerDelay,
} from '../motionKit';

export const KeywordCascade: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const isFullTakeover = scene.zone === 'full_takeover';
  const kws = (scene.keywords.length > 0 ? scene.keywords : scene.checklistItems).slice(0, 5);

  const isLight = theme.mode === 'editorial';
  const activeAccent = scene.accentColor || theme.accentPrimary || '#00F5FF';
  const scaleFactor = resolveScaleFactor(scene.textSize);
  const headlineColor = resolveGraphicTextColor(scene, theme, isLight);

  const {
    enterSpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
  } = computeMotionEnvelope(sceneFrame, sceneTotalFrames, fps);

  const isCompact = kws.length >= 4;

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className={`w-full h-full px-10 flex flex-col justify-center pointer-events-none select-none ${
        isCompact ? 'gap-3' : 'gap-4.5'
      } ${isFullTakeover ? 'pb-32 pt-14' : 'py-6'}`}
    >
      {/* Category Tag Header Bar */}
      <div
        style={{
          borderColor: isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.16)',
          transform: `scale(${scaleFactor})`,
        }}
        className="flex items-center justify-between border-b pb-2.5"
      >
        <div className="flex items-center gap-2">
          <div
            style={{ backgroundColor: activeAccent }}
            className="w-2.5 h-2.5 rounded-full"
          />
          <span
            style={{
              color: isLight ? '#0F172A' : '#F8FAFC',
              fontSize: `${Math.round(20 * scaleFactor)}px`,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.22em',
            }}
            className="font-black uppercase"
          >
            {scene.tag || 'KEY CONCEPTS'}
          </span>
        </div>
        {scene.subtext && (
          <span
            style={{
              color: isLight ? '#64748B' : '#94A3B8',
              fontSize: `${Math.round(14 * scaleFactor)}px`,
              fontFamily: 'JetBrains Mono, monospace',
            }}
            className="font-bold uppercase"
          >
            {scene.subtext}
          </span>
        )}
      </div>

      {/* Stacked Keyword Cards with Staggered Entrance */}
      <div className={`flex flex-col ${isCompact ? 'gap-2.5' : 'gap-3.5'}`}>
        {kws.map((kw, idx) => {
          const itemSpring = spring({
            frame: staggerDelay(sceneFrame, idx, 4),
            fps,
            config: { damping: 14, stiffness: 185, mass: 0.72 },
          });

          const slideX = interpolate(itemSpring, [0, 1], [-90, 0]);
          const cleanKw = kw.replace(/[^a-zA-Z0-9']/g, '').toUpperCase();
          const cleanFocus = (scene.focusWord || '').replace(/[^a-zA-Z0-9']/g, '').toUpperCase();
          const isFocused = cleanFocus && cleanKw.includes(cleanFocus);
          const isHero = isFocused || idx === kws.length - 1;

          const cardStyle = getEditorialCardStyle(theme, activeAccent, isHero, scene.surfaceStyle, scene.bgColor);
          const isDarkRow = isHero || !isLight || String(cardStyle.backgroundColor || '').includes('10, 15') || scene.surfaceStyle === 'glass';
          const keywordTextColor = scene.textColor || (isDarkRow ? '#FFFFFF' : cardStyle.color);

          return (
            <div
              key={idx}
              style={{
                transform: `translateX(${slideX}px) scale(${itemSpring})`,
                opacity: itemSpring,
                ...cardStyle,
              }}
              className={`rounded-2xl flex items-center justify-between  ${
                isCompact ? 'px-6 py-3.5' : 'px-8 py-5'
              }`}
            >
              <div className="flex items-center gap-5">
                <span
                  style={{
                    color: isHero ? activeAccent : isDarkRow ? '#94A3B8' : '#64748B',
                    fontSize: `${Math.round((isCompact ? 22 : 26) * scaleFactor)}px`,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  className="font-black"
                >
                  0{idx + 1}
                </span>
                <span
                  style={{
                    color: keywordTextColor,
                    fontSize: `${Math.round((isCompact ? 36 : 46) * scaleFactor)}px`,
                    fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                  className="font-black uppercase tracking-tight"
                >
                  {kw}
                </span>
              </div>

              {/* Status Indicator Pip */}
              <div
                style={{
                  backgroundColor: isHero ? activeAccent : `${activeAccent}40`,
                  boxShadow: isHero ? `0 0 14px ${activeAccent}` : 'none',
                }}
                className="w-3.5 h-3.5 rounded-full shrink-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
