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

export const BarComparison: React.FC<ArchetypeComponentProps> = ({
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

  // Derive 2 to 4 comparison items and values
  const rawItems =
    Array.isArray(scene.checklistItems) && scene.checklistItems.length > 0
      ? scene.checklistItems
      : Array.isArray(scene.keywords) && scene.keywords.length > 0
      ? scene.keywords
      : ['CURRENT METHOD', 'OPTIMIZED SYSTEM', 'INDUSTRY BENCHMARK'];

  const items = rawItems.slice(0, 4).map((it) => String(it).trim().toUpperCase());

  const hasRealValues =
    Array.isArray(scene.chartValues) && scene.chartValues.length >= items.length;

  const rawValues = hasRealValues ? scene.chartValues! : [90, 70, 50, 30];
  const values = items.map((_, i) => Math.max(10, Math.min(100, Math.round(rawValues[i] ?? 50))));

  const cardStyle = getEditorialCardStyle(theme, activeAccent, 'default', scene.surfaceStyle, scene.bgColor);
  const headlineText = scene.headline && scene.headline.trim() !== '' ? scene.headline : null;

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-8 flex flex-col items-center justify-center relative pointer-events-none select-none"
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
              color: scene.textColor || (isLight ? '#0F172A' : '#FFFFFF'),
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

      {/* Bar Comparison Stage (Clamped 960px width inside 1080px canvas) */}
      <div
        style={{
          ...cardStyle,
          width: '960px',
          transform: `scale(${scaleMultiplier})`,
        }}
        className="rounded-3xl p-8 flex flex-col gap-6 shadow-2xl"
      >
        {items.map((rawLabel, idx) => {
          const label = rawLabel.replace(/:\s*\d+%\s*$/i, '').trim();
          const targetVal = values[idx];
          const isHighest = targetVal === Math.max(...values);

          // Fast punchy arrival: reach 100% of target within first ~40% of beat duration and hold
          const maxAnimFrames = Math.max(10, Math.floor(sceneTotalFrames * 0.40));
          const delayedFrame = staggerDelay(sceneFrame, idx, 3);
          const rawProgress = interpolate(delayedFrame, [0, maxAnimFrames], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          // Snappy ease-out curve that reaches and holds 1.0
          const easedProgress = Math.min(1, Math.sin((rawProgress * Math.PI) / 2));

          const currentWidthPct = easedProgress * targetVal;
          const displayVal = Math.round(easedProgress * targetVal);

          const barColor = isHighest ? activeAccent : isLight ? '#64748B' : '#94A3B8';

          return (
            <div key={`bar_${idx}`} className="flex flex-col gap-2">
              {/* Top row: Clean Label + Large Numeric Value (>= 48px) */}
              <div className="flex items-baseline justify-between gap-4">
                <span
                  style={{
                    fontSize: '28px',
                    fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                    fontWeight: 800,
                    color: isLight ? '#0F172A' : '#F1F5F9',
                  }}
                  className="uppercase tracking-tight truncate max-w-[650px]"
                >
                  {label}
                </span>
                {hasRealValues ? (
                  <span
                    style={{
                      fontSize: '52px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 900,
                      color: isHighest ? activeAccent : isLight ? '#1E293B' : '#FFFFFF',
                      textShadow: isHighest ? `0 0 20px ${activeAccent}60` : 'none',
                    }}
                    className="shrink-0 leading-none"
                  >
                    {`${displayVal}%`}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '32px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      color: isHighest ? activeAccent : isLight ? '#64748B' : '#94A3B8',
                    }}
                    className="shrink-0 leading-none opacity-80"
                  >
                    {`#0${idx + 1}`}
                  </span>
                )}
              </div>

              {/* Progress Bar Track (Enlarged to 28px height) */}
              <div
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                  height: '28px',
                }}
                className="w-full rounded-full p-1 relative overflow-hidden"
              >
                <div
                  style={{
                    width: `${currentWidthPct}%`,
                    backgroundColor: barColor,
                    boxShadow: isHighest ? `0 0 16px ${activeAccent}` : 'none',
                  }}
                  className="h-full rounded-full duration-75 relative"
                >
                  {/* Subtle leading shine pill */}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/70" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
