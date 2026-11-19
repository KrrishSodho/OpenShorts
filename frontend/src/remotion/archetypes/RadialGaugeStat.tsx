import React from 'react';
import { interpolate, useVideoConfig } from 'remotion';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
} from '../motionKit';

export const RadialGaugeStat: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#10B981';
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

  // Parse numeric percentage, multiplier, or general metric
  const rawMetric = String(scene.metricValue || scene.focusWord || '').trim();
  const pctMatch = rawMetric.match(/(\d+(?:[.,]\d+)?)\s*%/);
  const multMatch = rawMetric.match(/(\d+(?:[.,]\d+)?)\s*x/i);
  const numMatch = rawMetric.match(/[\$€£]?\s*(\d+(?:[.,]\d+)?)/);

  const hasRealMetric = Boolean(pctMatch || multMatch || numMatch || rawMetric);
  let targetPct = 0;
  let formattedDisplay = '';

  if (pctMatch) {
    const parsed = parseFloat(pctMatch[1].replace(',', '.'));
    targetPct = Math.min(100, Math.max(0, parsed));
    const animatedVal = (targetPct * secondarySpring).toFixed(parsed % 1 !== 0 ? 1 : 0);
    formattedDisplay = `${animatedVal}%`;
  } else if (multMatch) {
    const val = parseFloat(multMatch[1].replace(',', '.'));
    targetPct = Math.min(100, Math.max(0, (val / 5.0) * 100));
    const animatedVal = (val * secondarySpring).toFixed(1).replace(/\.0$/, '');
    formattedDisplay = `${animatedVal}x`;
  } else if (numMatch) {
    formattedDisplay = rawMetric;
    const val = parseFloat(numMatch[1].replace(',', '.'));
    targetPct = Math.min(100, Math.max(0, val <= 100 ? val : 100));
  } else {
    formattedDisplay = rawMetric;
    targetPct = rawMetric ? 100 : 0;
  }

  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = interpolate(
    secondarySpring,
    [0, 1],
    [circumference, circumference * (1 - targetPct / 100)]
  );

  const cardStyle = getEditorialCardStyle(theme, activeAccent, 'emerald', scene.surfaceStyle, scene.bgColor);

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-8 flex items-center justify-center pointer-events-none select-none"
    >
      <div
        style={{
          ...cardStyle,
          transform: `scale(${scaleMultiplier})`,
        }}
        className="w-full max-w-[960px] rounded-3xl p-8 flex items-center justify-between gap-10 shadow-2xl"
      >
        {/* Large Radial Arc SVG with Hero Counter (118px) */}
        <div className="relative w-[280px] h-[280px] shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 260 260" className="w-full h-full -rotate-90 overflow-visible">
            {/* Background Track Ring */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke={isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255,255,255,0.14)'}
              strokeWidth="24"
            />
            {/* Glow backing */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke={activeAccent}
              strokeWidth="32"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              opacity="0.38"
              style={{ filter: `drop-shadow(0 0 16px ${activeAccent})` }}
            />
            {/* Crisp Foreground Arc */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke={activeAccent}
              strokeWidth="24"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>

          {/* Centered Giant Readout (responsive font size) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              style={{
                color: isLight ? '#0F172A' : '#FFFFFF',
                fontSize: formattedDisplay.length > 5 ? '64px' : formattedDisplay.length > 3 ? '84px' : '118px',
                fontFamily: "'Plus Jakarta Sans', Montserrat, monospace",
                fontWeight: 900,
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
              }}
            >
              {formattedDisplay}
            </span>
          </div>
        </div>

        {/* Text Details Area */}
        <div className="flex-1 flex flex-col gap-3">
          {scene.tag && (
            <div
              style={{
                borderColor: `${activeAccent}80`,
                backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(6,24,18,0.92)',
              }}
              className="self-start px-4 py-1.5 rounded-full border-2 mb-1 flex items-center gap-2.5 shadow-md"
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
                  letterSpacing: '0.16em',
                }}
                className="font-black uppercase"
              >
                {scene.tag}
              </span>
            </div>
          )}

          {(scene.headline || scene.subtext || scene.focusWord) && (
            <h3
              style={{
                color: headlineColor,
                fontSize: `${Math.round(56 * scaleMultiplier)}px`,
                fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
              className="uppercase tracking-tight"
            >
              {scene.headline || scene.subtext || scene.focusWord}
            </h3>
          )}

          {scene.subtext && scene.headline && (
            <span
              style={{
                color: isLight ? '#334155' : '#94A3B8',
                fontSize: '28px',
                fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                fontWeight: 800,
              }}
              className="uppercase tracking-wide mt-1"
            >
              {scene.subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
