import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
  staggerDelay,
} from '../motionKit';

export const ExplainerTimeline: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const isFullTakeover = scene.zone === 'full_takeover';
  const steps = (
    scene.checklistItems.length > 0 ? scene.checklistItems : scene.keywords
  ).slice(0, 4);

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

  // SVG spine line with @remotion/paths evolvePath
  const spineHeight = Math.max(180, steps.length * 105);
  const spinePath = `M 24 16 L 24 ${spineHeight - 16}`;
  const spineEvolution = evolvePath(Math.min(1, secondarySpring * 1.1), spinePath);

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className={`w-full h-full px-10 flex flex-col justify-center gap-5 pointer-events-none select-none ${
        isFullTakeover ? 'pb-32 pt-14' : 'py-6'
      }`}
    >
      {/* Category Pill Tag */}
      {scene.tag && (
        <div
          style={{
            borderColor: `${activeAccent}60`,
            backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)',
            transform: `scale(${scaleFactor})`,
            transformOrigin: 'left center',
          }}
          className="self-start px-4 py-1.5 rounded-full border mb-1 flex items-center gap-2 shadow-lg backdrop-blur-md"
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
              letterSpacing: '0.18em',
            }}
            className="font-black uppercase"
          >
            {scene.tag}
          </span>
        </div>
      )}

      {/* Impact Headline */}
      {scene.headline && (
        <h2
          style={{
            fontSize: `${Math.round(44 * scaleFactor)}px`,
            color: headlineColor,
            fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
          }}
          className="font-black uppercase tracking-tight"
        >
          {scene.headline}
        </h2>
      )}

      {/* Vertical Spine + Staggered Step Cards */}
      <div className="relative pl-14 flex flex-col gap-4">
        {/* Animated SVG Spine connecting all steps */}
        <svg
          className="absolute left-0 top-0 w-12 h-full overflow-visible pointer-events-none"
          viewBox={`0 0 48 ${spineHeight}`}
          fill="none"
        >
          {/* Faint track background */}
          <path
            d={spinePath}
            stroke={isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.15)'}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Evolving accent line */}
          <path
            d={spinePath}
            stroke={activeAccent}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={spineEvolution.strokeDasharray}
            strokeDashoffset={spineEvolution.strokeDashoffset}
            style={{ filter: `drop-shadow(0 0 8px ${activeAccent})` }}
          />
        </svg>

        {steps.map((st, idx) => {
          const stepSpring = spring({
            frame: staggerDelay(sceneFrame, idx, 5),
            fps,
            config: { damping: 14, stiffness: 180, mass: 0.72 },
          });

          const isLast = idx === steps.length - 1;
          const cardStyle = getEditorialCardStyle(theme, activeAccent, isLast, scene.surfaceStyle, scene.bgColor);

          return (
            <div
              key={idx}
              style={{
                opacity: stepSpring,
                transform: `translateX(${interpolate(stepSpring, [0, 1], [-40, 0])}px) scale(${stepSpring})`,
                ...cardStyle,
              }}
              className="relative flex items-center gap-5 rounded-2xl px-6 py-4.5"
            >
              {/* Spine Node Badge */}
              <div
                style={{
                  backgroundColor: activeAccent,
                  color: theme.mode === 'editorial' ? '#FFFFFF' : '#090D16',
                  boxShadow: `0 0 16px ${activeAccent}66`,
                }}
                className="absolute -left-14 w-10 h-10 rounded-full font-mono font-black text-lg flex items-center justify-center border-2 border-slate-900 z-10"
              >
                {idx + 1}
              </div>

              <span
                style={{
                  fontSize: `${Math.round(30 * scaleFactor)}px`,
                  color: cardStyle.color,
                  fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                }}
                className="font-black uppercase tracking-tight"
              >
                {st}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
