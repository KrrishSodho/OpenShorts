import React from 'react';
import { interpolate, useVideoConfig } from 'remotion';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
} from '../motionKit';

export const SpecVersus: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#EC4899';
  const isLight = theme.mode === 'editorial';
  const scaleMultiplier = resolveScaleFactor(scene.textSize);
  const headlineColor = resolveGraphicTextColor(scene, theme, isLight);

  const {
    enterSpring,
    secondarySpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
  } = computeMotionEnvelope(sceneFrame, sceneTotalFrames, fps);

  const slideLeft = interpolate(enterSpring, [0, 1], [-80, 0]);
  const slideRight = interpolate(enterSpring, [0, 1], [80, 0]);

  const leftLabel = (scene.leftLabel || scene.focusWord || '').trim();
  const rightLabel = (scene.rightLabel || scene.subtext || '').trim();
  const hasRatios = scene.leftRatio != null || scene.rightRatio != null;
  const leftRatio = scene.leftRatio != null ? scene.leftRatio : 50;
  const rightRatio = scene.rightRatio != null ? scene.rightRatio : 50;

  const leftCardStyle = getEditorialCardStyle(theme, '#3B82F6', 'cobalt', scene.surfaceStyle, scene.bgColor);
  const rightCardStyle = getEditorialCardStyle(theme, activeAccent, 'crimson', scene.surfaceStyle, scene.bgColor);

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-8 flex flex-col justify-center gap-5 pointer-events-none select-none"
    >
      {/* Category Pill Tag or Headline */}
      {(scene.tag || scene.headline) && (
        <div className="flex flex-col items-center text-center">
          {scene.tag && (
            <div
              style={{
                borderColor: `${activeAccent}80`,
                backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(12,18,32,0.92)',
              }}
              className="px-6 py-1.5 rounded-full border-2 mb-2 flex items-center gap-2.5 shadow-md"
            >
              <div
                style={{ backgroundColor: activeAccent }}
                className="w-2.5 h-2.5 rounded-full"
              />
              <span
                style={{
                  color: isLight ? '#0F172A' : '#F8FAFC',
                  fontSize: '26px',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.18em',
                }}
                className="font-black uppercase"
              >
                {scene.tag}
              </span>
            </div>
          )}
          {scene.headline && (
            <h2
              style={{
                color: headlineColor,
                fontSize: `${Math.round(48 * scaleMultiplier)}px`,
                fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
              className="uppercase tracking-tight"
            >
              {scene.headline}
            </h2>
          )}
        </div>
      )}

      {/* Versus Dual Comparison Grid */}
      <div
        style={{
          transform: `scale(${scaleMultiplier})`,
        }}
        className="grid grid-cols-11 items-center gap-5 w-full max-w-[960px] mx-auto"
      >
        {/* Left Competitor Card */}
        <div
          style={{
            transform: `translateX(${slideLeft}px)`,
            ...leftCardStyle,
          }}
          className="col-span-5 rounded-3xl p-6 flex flex-col gap-4 text-center shadow-2xl"
        >
          <span
            style={{
              color: leftCardStyle.color,
              fontSize: '42px',
              fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
            className="uppercase tracking-tight"
          >
            {leftLabel}
          </span>

          {/* Left Ratio Hero Stat & Progress Bar (Render only when real ratios provided) */}
          {hasRatios && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                  fontSize: '64px',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: '#60A5FA',
                  textShadow: '0 0 24px rgba(59, 130, 246, 0.5)',
                }}
              >
                {leftRatio}%
              </span>
              <div className="w-full bg-black/60 rounded-full h-5 overflow-hidden border border-blue-500/50 p-0.5">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, leftRatio * secondarySpring))}%`,
                    boxShadow: '0 0 16px #3B82F6',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Central VS Disc (76px) */}
        <div className="col-span-1 flex justify-center">
          <div
            style={{
              backgroundColor: '#FFE600',
              color: '#090D16',
              boxShadow: '0 0 30px rgba(255, 230, 0, 0.75)',
              transform: `scale(${secondarySpring})`,
            }}
            className="w-18 h-18 rounded-full font-headline font-black text-3xl flex items-center justify-center border-4 border-slate-900 z-20 shrink-0"
          >
            VS
          </div>
        </div>

        {/* Right Competitor Card */}
        <div
          style={{
            transform: `translateX(${slideRight}px)`,
            ...rightCardStyle,
          }}
          className="col-span-5 rounded-3xl p-6 flex flex-col gap-4 text-center shadow-2xl"
        >
          <span
            style={{
              color: rightCardStyle.color,
              fontSize: '42px',
              fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
            className="uppercase tracking-tight"
          >
            {rightLabel}
          </span>

          {/* Right Ratio Hero Stat & Progress Bar (Render only when real ratios provided) */}
          {hasRatios && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                  fontSize: '64px',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: activeAccent,
                  textShadow: `0 0 24px ${activeAccent}80`,
                }}
              >
                {rightRatio}%
              </span>
              <div className="w-full bg-black/60 rounded-full h-5 overflow-hidden border border-pink-500/50 p-0.5">
                <div
                  style={{
                    backgroundColor: activeAccent,
                    width: `${Math.min(100, Math.max(0, rightRatio * secondarySpring))}%`,
                    boxShadow: `0 0 16px ${activeAccent}`,
                  }}
                  className="h-full rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
