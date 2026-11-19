import React from 'react';
import { interpolate, useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
} from '../motionKit';
import { buildDynamicSvgPath } from './transitionHelpers';

export const OdometerCounter: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#38BDF8';
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

  // Spline graph path from values ONLY if real chart values exist
  const hasRealChart = Array.isArray(scene.chartValues) && scene.chartValues.length >= 2;
  const chartW = 440;
  const chartH = 220;
  const { linePath, areaPath, lastX, lastY } = buildDynamicSvgPath(
    hasRealChart ? scene.chartValues : [],
    chartW,
    chartH
  );

  const strokeEvolution = evolvePath(Math.min(1, secondarySpring * 1.15), linePath);

  // Extract digits for slot-machine odometer roll
  const rawMetric = (scene.metricValue || scene.focusWord || '').trim();
  const numericMatch = rawMetric.match(/\d+/);
  const hasNumber = Boolean(numericMatch);
  const targetNumber = hasNumber ? parseInt(numericMatch![0], 10) : 0;
  const prefix = hasNumber ? rawMetric.slice(0, rawMetric.indexOf(numericMatch![0])) : '';
  const suffix = hasNumber
    ? rawMetric.slice(rawMetric.indexOf(numericMatch![0]) + numericMatch![0].length)
    : '';

  const currentCount = hasNumber
    ? Math.round(interpolate(secondarySpring, [0, 1], [0, targetNumber]))
    : 0;

  const cardStyle = getEditorialCardStyle(theme, activeAccent, 'cobalt', scene.surfaceStyle);

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
        className="w-full max-w-[960px] rounded-3xl p-8 flex flex-col gap-6 shadow-2xl"
      >
        {/* Header Bar */}
        {(scene.tag || scene.subtext) && (
          <div className="flex items-center justify-between border-b pb-3 border-blue-500/30">
            {scene.tag ? (
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: activeAccent }}
                  className="w-3 h-3 rounded-full"
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
            ) : <div />}

            {scene.subtext && (
              <span
                style={{
                  color: activeAccent,
                  fontSize: '18px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                className="font-bold tracking-wider uppercase"
              >
                {scene.subtext}
              </span>
            )}
          </div>
        )}

        {/* Metric Readout & Spline Chart */}
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col">
            {/* Odometer Rolling Counter Display */}
            <div className="flex items-baseline gap-1">
              {hasNumber ? (
                <>
                  {prefix && (
                    <span
                      style={{
                        color: activeAccent,
                        fontSize: '84px',
                        fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                        fontWeight: 900,
                      }}
                    >
                      {prefix}
                    </span>
                  )}
                  <span
                    style={{
                      color: isLight ? '#0F172A' : '#FFFFFF',
                      fontSize: '124px',
                      fontFamily: "'Plus Jakarta Sans', Montserrat, monospace",
                      fontWeight: 900,
                      lineHeight: 0.9,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {currentCount}
                  </span>
                  {suffix && (
                    <span
                      style={{
                        color: activeAccent,
                        fontSize: '84px',
                        fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                        fontWeight: 900,
                      }}
                    >
                      {suffix}
                    </span>
                  )}
                </>
              ) : (
                <span
                  style={{
                    color: activeAccent,
                    fontSize: '84px',
                    fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                    fontWeight: 900,
                    lineHeight: 1.0,
                  }}
                  className="uppercase"
                >
                  {rawMetric || 'KEY METRIC'}
                </span>
              )}
            </div>

            {/* Impact Headline */}
            {scene.headline && (
              <h3
                style={{
                  color: headlineColor,
                  fontSize: `${Math.round(48 * scaleMultiplier)}px`,
                  fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                }}
                className="uppercase tracking-tight mt-3"
              >
                {scene.headline}
              </h3>
            )}
          </div>

          {/* Spline Area Chart (Rendered only when real chart values exist) */}
          {hasRealChart && (
            <div className="w-[440px] h-[220px] shrink-0 relative">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeAccent} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={activeAccent} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area gradient under spline */}
                <path
                  d={areaPath}
                  fill="url(#areaGrad)"
                  opacity={secondarySpring}
                />

                {/* Evolving stroke spline */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={activeAccent}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={strokeEvolution.strokeDasharray}
                  strokeDashoffset={strokeEvolution.strokeDashoffset}
                  style={{ filter: `drop-shadow(0 0 12px ${activeAccent})` }}
                />

                {/* Glowing milestone endpoint indicator */}
                <circle
                  cx={lastX}
                  cy={lastY}
                  r={12 * secondarySpring}
                  fill={activeAccent}
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  style={{ filter: `drop-shadow(0 0 12px ${activeAccent})` }}
                />
              </svg>
            </div>
          )}
        </div>

        {/* Bottom Horizon Progress Track */}
        <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden">
          <div
            style={{
              width: `${Math.round(secondarySpring * 100)}%`,
              backgroundColor: activeAccent,
              boxShadow: `0 0 16px ${activeAccent}`,
            }}
            className="h-full rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
