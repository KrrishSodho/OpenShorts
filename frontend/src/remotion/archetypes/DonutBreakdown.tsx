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

export const DonutBreakdown: React.FC<ArchetypeComponentProps> = ({
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
    secondarySpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
  } = computeMotionEnvelope(sceneFrame, sceneTotalFrames, fps);

  // Derive 2 to 4 slices
  const rawItems =
    Array.isArray(scene.checklistItems) && scene.checklistItems.length > 0
      ? scene.checklistItems
      : Array.isArray(scene.keywords) && scene.keywords.length > 0
      ? scene.keywords
      : ['DIRECT CONVERSIONS', 'ORGANIC TRAFFIC', 'RETENTION'];

  const items = rawItems.slice(0, 4).map((it) => String(it).trim().toUpperCase());

  const hasRealValues =
    Array.isArray(scene.chartValues) && scene.chartValues.length >= items.length;

  const rawValues = hasRealValues
    ? scene.chartValues!
    : items.map(() => 100 / Math.max(1, items.length));

  const sumRaw = rawValues.slice(0, items.length).reduce((a, b) => a + (Number(b) || 1), 0) || 100;
  const percentages = items.map((_, i) => Math.max(8, Math.round(((Number(rawValues[i]) || 25) / sumRaw) * 100)));

  // Adjusted palette for slices
  const sliceColors = [
    activeAccent,
    theme.accentSecondary || '#818CF8',
    '#38BDF8',
    '#F59E0B',
  ];

  const radius = 100;
  const circumference = 2 * Math.PI * radius;

  // Compute animated dash offsets for each slice
  let cumulativePct = 0;
  const slices = items.map((label, idx) => {
    const pct = percentages[idx];
    const sliceLen = (pct / 100) * circumference;
    const startPct = cumulativePct;
    cumulativePct += pct;

    const sliceSpring = spring({
      frame: staggerDelay(sceneFrame, idx, 3),
      fps,
      config: { damping: 14, stiffness: 140 },
    });

    const animatedLength = interpolate(sliceSpring, [0, 1], [0, sliceLen]);
    const rotDeg = (startPct / 100) * 360 - 90;

    return {
      label,
      pct,
      color: sliceColors[idx % sliceColors.length],
      animatedLength,
      rotDeg,
    };
  });

  const primarySlicePct = percentages[0];
  const centerMetric = scene.metricValue || (hasRealValues ? `${primarySlicePct}%` : scene.focusWord || '');

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

      {/* Donut Stage (Clamped 960px width inside 1080px canvas) */}
      <div
        style={{
          ...cardStyle,
          width: '960px',
          transform: `scale(${scaleMultiplier})`,
        }}
        className="rounded-3xl p-8 flex items-center justify-between gap-10 shadow-2xl"
      >
        {/* SVG Donut Ring with Center Metric */}
        <div className="relative w-[300px] h-[300px] shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 260 260" className="w-full h-full overflow-visible">
            {/* Background Track */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke={isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.12)'}
              strokeWidth="28"
            />

            {/* Slices */}
            {slices.map((slice, i) => (
              <circle
                key={`slice_${i}`}
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="28"
                strokeDasharray={`${slice.animatedLength} ${circumference}`}
                transform={`rotate(${slice.rotDeg} 130 130)`}
                style={{
                  filter: i === 0 ? `drop-shadow(0 0 12px ${slice.color}60)` : 'none',
                }}
              />
            ))}
          </svg>

          {/* Center Metric Display (>= 48px) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span
              style={{
                color: activeAccent,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '56px',
                fontWeight: 900,
                lineHeight: 1,
              }}
              className="tracking-tight"
            >
              {centerMetric}
            </span>
            <span
              style={{
                color: isLight ? '#64748B' : '#94A3B8',
                fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.12em',
              }}
              className="uppercase mt-1 truncate max-w-[160px]"
            >
              {scene.focusWord || 'TOP METRIC'}
            </span>
          </div>
        </div>

        {/* Legend List (Labels >= 26px, values bold) */}
        <div className="flex-1 flex flex-col gap-4 pl-4 border-l border-white/10">
          {slices.map((slice, idx) => (
            <div key={`legend_${idx}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  style={{ backgroundColor: slice.color, boxShadow: `0 0 10px ${slice.color}80` }}
                  className="w-4 h-4 rounded-full shrink-0"
                />
                <span
                  style={{
                    color: isLight ? '#0F172A' : '#F1F5F9',
                    fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                    fontSize: '26px',
                    fontWeight: 800,
                  }}
                  className="uppercase truncate max-w-[380px]"
                >
                  {slice.label}
                </span>
              </div>

              {hasRealValues && (
                <span
                  style={{
                    color: slice.color,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '36px',
                    fontWeight: 900,
                  }}
                  className="shrink-0 leading-none"
                >
                  {`${slice.pct}%`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
