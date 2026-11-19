import React from 'react';
import { interpolate, useVideoConfig } from 'remotion';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
} from '../motionKit';

export const PowerMeterGauge: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#00F5FF';
  const isLight = theme.mode === 'editorial';
  const scaleFactor = resolveScaleFactor(scene.textSize);
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

  const rawNum = parseInt(String(scene.metricValue || scene.focusWord || '').replace(/[^\d]/g, ''), 10);
  const hasExplicitNumber = Number.isFinite(rawNum) && !isNaN(rawNum);
  const targetPct = hasExplicitNumber ? Math.min(100, Math.max(0, rawNum)) : 0;
  const currentFillPct = hasExplicitNumber
    ? Math.round(interpolate(secondarySpring, [0, 1], [0, targetPct]))
    : 0;

  const displayVal = scene.metricValue
    ? (scene.metricValue.includes('%') ? `${currentFillPct}%` : scene.metricValue)
    : (hasExplicitNumber ? `${currentFillPct}%` : (scene.focusWord || ''));

  const tagLabel = scene.tag || '';
  const headline = scene.headline || scene.subtext || '';
  const cardStyle = getEditorialCardStyle(theme, activeAccent, 'cobalt', scene.surfaceStyle);

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-8 flex flex-col justify-center gap-5 pointer-events-none select-none"
    >
      {/* Header Pill */}
      {tagLabel && (
        <div className="flex items-center">
          <div
            style={{
              borderColor: `${activeAccent}70`,
              backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)',
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'left center',
            }}
            className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full border shadow-md backdrop-blur-md"
          >
            <div
              style={{ backgroundColor: activeAccent }}
              className="w-2.5 h-2.5 rounded-full"
            />
            <span
              style={{
                color: isLight ? '#0F172A' : '#F8FAFC',
                fontSize: `${Math.round(20 * scaleFactor)}px`,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.18em',
              }}
              className="font-black uppercase"
            >
              {tagLabel}
            </span>
          </div>
        </div>
      )}

      {/* Main Impact Headline */}
      <h2
        style={{
          fontSize: `${Math.round(44 * scaleFactor)}px`,
          color: headlineColor,
          fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
        className="font-black uppercase tracking-tight max-w-[940px]"
      >
        {headline}
      </h2>

      {/* Main Gauge Readout Card */}
      <div
        style={{
          ...cardStyle,
          transform: `scale(${scaleFactor})`,
          maxWidth: '960px',
        }}
        className="rounded-3xl p-8 shadow-2xl flex flex-col gap-6 w-full"
      >
        <div className="flex items-baseline justify-between">
          <span
            style={{
              color: isLight ? '#64748B' : '#94A3B8',
              fontSize: '18px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            className="font-black uppercase tracking-wider"
          >
            BENCHMARK
          </span>
          <span
            style={{
              color: activeAccent,
              fontSize: `${Math.round(68 * scaleFactor)}px`,
              fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
              fontWeight: 900,
              lineHeight: 1,
              textShadow: `0 0 24px ${activeAccent}80`,
            }}
          >
            {displayVal}
          </span>
        </div>

        {/* Graduated Power Track (Rendered only when real number exists) */}
        {hasExplicitNumber && (
          <div className="relative w-full h-10 bg-black/60 rounded-2xl overflow-hidden p-1.5 border border-white/15">
            <div
              style={{
                width: `${currentFillPct}%`,
                backgroundColor: activeAccent,
                boxShadow: `0 0 24px ${activeAccent}`,
              }}
              className="h-full rounded-xl duration-75 relative"
            >
              <div className="absolute inset-0 bg-white/20" />
            </div>

            {/* Graduations */}
            <div className="absolute inset-0 flex justify-between px-6 pointer-events-none">
              {[20, 40, 60, 80].map((tick) => (
                <div key={tick} className="w-[1.5px] h-full bg-white/25" />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm font-mono text-slate-400 font-bold uppercase">
          <span>0%</span>
          <span>50%</span>
          <span style={{ color: activeAccent }} className="font-black">100% TARGET</span>
        </div>
      </div>
    </div>
  );
};
