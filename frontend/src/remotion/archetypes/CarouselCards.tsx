import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
} from '../motionKit';

export const CarouselCards: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#00F5FF';
  const isLight = theme.mode === 'editorial';
  const scaleMultiplier = resolveScaleFactor(scene.textSize);
  const headlineColor = resolveGraphicTextColor(scene, theme, isLight);

  const {
    enterSpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
  } = computeMotionEnvelope(sceneFrame, sceneTotalFrames, fps);

  // Derive 2 to 4 cards from items, keywords, or headline
  const rawCards =
    Array.isArray(scene.checklistItems) && scene.checklistItems.length > 0
      ? scene.checklistItems
      : Array.isArray(scene.keywords) && scene.keywords.length > 0
      ? scene.keywords
      : (scene.headline || 'CORE INSIGHT, KEY METRIC, ACTION PLAN').split(/,\s*/);

  const cards = (rawCards.length >= 2 ? rawCards : ['FIRST PRINCIPLE', 'GROWTH CATALYST', 'FINAL OUTCOME'])
    .slice(0, 4)
    .map((c) => String(c).trim().toUpperCase());

  const cardCount = cards.length;
  // Compute active card index across duration
  const progressRatio = Math.max(0, Math.min(0.999, sceneFrame / Math.max(1, sceneTotalFrames)));
  const targetIndex = Math.min(cardCount - 1, Math.floor(progressRatio * cardCount));

  // Spring slide between active indices
  const slideSpring = spring({
    frame: sceneFrame - (targetIndex * (sceneTotalFrames / cardCount)),
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.8 },
  });

  const cardStyle = getEditorialCardStyle(theme, activeAccent, 'default', scene.surfaceStyle, scene.bgColor);
  const headlineText = scene.headline && scene.headline.trim() !== '' ? scene.headline : null;

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-6 flex flex-col items-center justify-center relative pointer-events-none select-none"
    >
      {/* Category Pill Tag */}
      {scene.tag && (
        <div
          style={{
            borderColor: `${activeAccent}60`,
            backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)',
            transform: `scale(${scaleMultiplier})`,
          }}
          className="px-5 py-1.5 rounded-full border mb-3 flex items-center gap-2.5 shadow-lg backdrop-blur-md"
        >
          <div style={{ backgroundColor: activeAccent }} className="w-2.5 h-2.5 rounded-full" />
          <span
            style={{
              color: isLight ? '#0F172A' : '#F8FAFC',
              fontSize: '22px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em',
            }}
            className="font-bold uppercase"
          >
            {scene.tag}
          </span>
        </div>
      )}

      {/* Main Impact Headline */}
      {headlineText && (
        <div className="text-center max-w-[940px] mb-4">
          <h2
            style={{
              color: headlineColor,
              fontSize: `${Math.round(42 * scaleMultiplier)}px`,
              fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textShadow: isLight ? 'none' : '0 4px 20px rgba(0,0,0,0.85)',
            }}
            className="uppercase tracking-tight"
          >
            {headlineText}
          </h2>
        </div>
      )}

      {/* Horizontal Carousel Stage (Width 960px, clamped inside 1080px canvas) */}
      <div
        style={{
          width: '960px',
          height: '380px',
          transform: `scale(${scaleMultiplier})`,
        }}
        className="relative flex items-center justify-center overflow-visible"
      >
        {cards.map((cardLabel, idx) => {
          const offset = idx - targetIndex;
          // Smooth slide interpolation
          const activeShift = (1 - slideSpring) * (offset > 0 ? 1 : -1) * 40;
          const posX = offset * 520 + activeShift;
          const isCenter = idx === targetIndex;
          const scale = isCenter ? 1.0 : 0.84;
          const opacity = isCenter ? 1.0 : 0.32;
          const zIndex = isCenter ? 20 : 10;

          return (
            <div
              key={`card_${idx}`}
              style={{
                ...cardStyle,
                left: '50%',
                top: '50%',
                width: '640px',
                minHeight: '260px',
                transform: `translate(-50%, -50%) translateX(${posX}px) scale(${scale})`,
                opacity,
                zIndex,
                boxShadow: isCenter
                  ? `0 20px 50px rgba(0,0,0,0.65), 0 0 25px ${activeAccent}40`
                  : '0 8px 24px rgba(0,0,0,0.4)',
                borderWidth: isCenter ? '2px' : '1px',
                borderColor: isCenter ? activeAccent : `${activeAccent}30`,
              }}
              className="absolute rounded-3xl p-7 flex flex-col justify-between duration-75"
            >
              {/* Card Header: Step Index */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <span
                  style={{
                    color: activeAccent,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '24px',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                  }}
                  className="uppercase"
                >
                  {`0${idx + 1} / 0${cardCount}`}
                </span>
                <div
                  style={{ backgroundColor: `${activeAccent}25`, borderColor: activeAccent }}
                  className="px-3 py-0.5 rounded-full border text-[13px] font-mono font-bold text-white uppercase tracking-wider"
                >
                  {isCenter ? 'ACTIVE FOCUS' : 'STEP'}
                </div>
              </div>

              {/* Card Body: Punchy Title */}
              <div className="flex-1 flex items-center">
                <h3
                  style={{
                    color: cardStyle.color,
                    fontSize: '44px',
                    fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                    fontWeight: 900,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                  }}
                  className="uppercase line-clamp-2"
                >
                  {cardLabel}
                </h3>
              </div>

              {/* Card Footer Subtext */}
              {scene.subtext && isCenter && (
                <div className="pt-2 text-slate-300 font-mono text-sm tracking-wide uppercase truncate">
                  {scene.subtext}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Dots Indicator */}
      <div className="flex items-center gap-2.5 mt-4">
        {cards.map((_, dotIdx) => {
          const isActive = dotIdx === targetIndex;
          return (
            <div
              key={`dot_${dotIdx}`}
              style={{
                backgroundColor: isActive ? activeAccent : `${activeAccent}35`,
                width: isActive ? '32px' : '10px',
                height: '10px',
                boxShadow: isActive ? `0 0 12px ${activeAccent}` : 'none',
              }}
              className="rounded-full duration-200"
            />
          );
        })}
      </div>
    </div>
  );
};
