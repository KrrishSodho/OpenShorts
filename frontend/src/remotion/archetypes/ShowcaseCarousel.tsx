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

export const ShowcaseCarousel: React.FC<ArchetypeComponentProps> = ({
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

  const rawSteps =
    scene.checklistItems.length > 0
      ? scene.checklistItems
      : scene.keywords.length > 0
      ? scene.keywords
      : ['SPEC', 'PLAN', 'BUILD', 'TEST', 'SHIP'];

  const steps = rawSteps.slice(0, 4);
  const headline = scene.headline || scene.focusWord || 'AUTOMATED WORKFLOW';
  const cardStyle = getEditorialCardStyle(theme, activeAccent, true, scene.surfaceStyle, scene.bgColor);

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-8 flex flex-col justify-center gap-5 pointer-events-none select-none"
    >
      {/* Category Pill Tag & Status Badge */}
      <div className="flex items-center justify-between gap-4">
        <div
          style={{
            borderColor: `${activeAccent}60`,
            backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)',
            transform: `scale(${scaleFactor})`,
            transformOrigin: 'left center',
          }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-md backdrop-blur-md"
        >
          <div
            style={{ backgroundColor: activeAccent }}
            className="w-2.5 h-2.5 rounded-full"
          />
          <span
            style={{
              color: isLight ? '#0F172A' : '#F8FAFC',
              fontSize: `${Math.round(18 * scaleFactor)}px`,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.16em',
            }}
            className="font-black uppercase"
          >
            {scene.tag || 'SYSTEM PIPELINE'}
          </span>
        </div>

        {scene.subtext && (
          <div
            style={{
              backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)',
              borderColor: activeAccent,
              color: activeAccent,
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'right center',
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-md font-mono text-xs font-black uppercase tracking-wider"
          >
            <span>STATUS:</span>
            <span>{scene.subtext}</span>
          </div>
        )}
      </div>

      {/* Main Headline */}
      <h2
        style={{
          fontSize: `${Math.round(38 * scaleFactor)}px`,
          color: headlineColor,
          fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
        className="font-black uppercase tracking-tight"
      >
        {headline}
      </h2>

      {/* Showcase Step Deck */}
      <div
        style={{
          ...cardStyle,
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'center center',
        }}
        className="rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
      >
        {/* Vertical Staggered Step Rows (Phone-Readable) */}
        <div className="flex flex-col gap-3">
          {steps.map((st, idx) => {
            const stepSpring = spring({
              frame: staggerDelay(sceneFrame, idx, 4),
              fps,
              config: { damping: 14, stiffness: 185 },
            });
            const isCompleted = idx <= Math.floor(steps.length * 0.6);

            return (
              <div
                key={idx}
                style={{
                  opacity: stepSpring,
                  transform: `translateX(${interpolate(stepSpring, [0, 1], [-20, 0])}px)`,
                  borderColor: isCompleted ? `${activeAccent}70` : 'rgba(255,255,255,0.12)',
                  backgroundColor: isCompleted
                    ? `${activeAccent}18`
                    : isLight
                    ? 'rgba(0,0,0,0.03)'
                    : 'rgba(255,255,255,0.04)',
                }}
                className="flex items-center justify-between px-5 py-3.5 rounded-2xl border"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    style={{
                      backgroundColor: isCompleted ? activeAccent : 'rgba(255,255,255,0.1)',
                      color: isCompleted ? (isLight ? '#FFFFFF' : '#090D16') : (isLight ? '#64748B' : '#94A3B8'),
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-black shrink-0"
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    style={{
                      color: isLight ? '#0F172A' : '#F8FAFC',
                      fontSize: `${Math.max(22, Math.round(24 * scaleFactor))}px`,
                      fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
                    }}
                    className="font-bold uppercase tracking-wide truncate"
                  >
                    {st}
                  </span>
                </div>

                <span
                  style={{
                    color: isCompleted ? activeAccent : isLight ? '#94A3B8' : '#64748B',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  className="text-xs font-black uppercase tracking-widest shrink-0 ml-2"
                >
                  {isCompleted ? 'READY' : 'QUEUED'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
