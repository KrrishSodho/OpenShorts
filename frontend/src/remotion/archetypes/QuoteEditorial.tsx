import React from 'react';
import { useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  generateRoughUnderlinePath,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
} from '../motionKit';

export const QuoteEditorial: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#F59E0B';
  const isLight = theme.mode === 'editorial';
  const scaleMultiplier = resolveScaleFactor(scene.textSize);

  const {
    enterSpring,
    secondarySpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
  } = computeMotionEnvelope(sceneFrame, sceneTotalFrames, fps);

  const quoteText = scene.headline || scene.focusWord || scene.subtext || 'KEY INSIGHT';
  const quoteLen = quoteText.length;
  const quoteFontSize = quoteLen > 60 ? 38 : quoteLen > 35 ? 44 : 52;
  const quoteColor = resolveGraphicTextColor(scene, theme, isLight);
  const cardStyle = getEditorialCardStyle(theme, activeAccent, 'paper', scene.surfaceStyle, scene.bgColor);

  const underlinePath = generateRoughUnderlinePath(320, 12);
  const underlineEvolution = evolvePath(Math.min(1, secondarySpring), underlinePath);

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
        className="w-full max-w-[960px] rounded-3xl p-10 flex items-stretch gap-8 shadow-2xl relative overflow-hidden"
      >
        {/* Animated Left Accent Indicator Bar (Thick 14px) */}
        <div className="w-3.5 bg-black/15 rounded-full overflow-hidden shrink-0">
          <div
            style={{
              height: `${Math.round(secondarySpring * 100)}%`,
              backgroundColor: '#D97706',
              boxShadow: '0 0 16px rgba(217, 119, 6, 0.6)',
            }}
            className="w-full rounded-full"
          />
        </div>

        {/* Quote Content Body */}
        <div className="flex-1 flex flex-col justify-between gap-4 relative z-10">
          {/* Header pill & Source Tag */}
          <div className="flex items-center justify-between">
            <span
              style={{
                color: '#B45309',
                fontSize: '26px',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.18em',
              }}
              className="font-black uppercase"
            >
              {scene.tag || 'EDITORIAL PULL-QUOTE'}
            </span>

            {scene.subtext && scene.subtext.trim().toUpperCase() !== quoteText.trim().toUpperCase() && (
              <div className="relative flex flex-col items-end">
                <span
                  style={{
                    color: '#0F172A',
                    fontSize: '26px',
                    fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                    fontWeight: 900,
                  }}
                  className="uppercase tracking-wider"
                >
                  — {scene.subtext}
                </span>
                <svg
                  className="w-48 h-4 overflow-visible mt-1"
                  viewBox="0 0 320 20"
                  fill="none"
                >
                  <path
                    d={underlinePath}
                    stroke="#D97706"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={underlineEvolution.strokeDasharray}
                    strokeDashoffset={underlineEvolution.strokeDashoffset}
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Dynamic Quote Heading */}
          <blockquote
            style={{
              fontSize: `${quoteFontSize}px`,
              color: quoteColor,
              fontFamily: "'Plus Jakarta Sans', Montserrat, serif",
              fontWeight: 900,
              fontStyle: 'italic',
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
            }}
            className="tracking-tight"
          >
            “{quoteText}”
          </blockquote>
        </div>

        {/* Ambient Giant Watermark Quotation Mark */}
        <div
          style={{
            color: '#B45309',
            fontFamily: 'Georgia, serif',
            opacity: 0.12,
          }}
          className="absolute -right-4 -bottom-16 text-[260px] font-black select-none pointer-events-none"
        >
          ”
        </div>
      </div>
    </div>
  );
};
