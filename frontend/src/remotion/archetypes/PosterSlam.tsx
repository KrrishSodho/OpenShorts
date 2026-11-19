import React from 'react';
import { useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  fitHeadlineFontSize,
  generateRoughCirclePath,
  generateRoughUnderlinePath,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
} from '../motionKit';

export const PosterSlam: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#FFE600';
  const isLight = theme.mode === 'editorial';
  const scaleMultiplier = resolveScaleFactor(scene.textSize);
  const headlineColor = resolveGraphicTextColor(scene, theme, isLight);

  const cardStyle =
    (scene.surfaceStyle && scene.surfaceStyle !== 'transparent' && scene.surfaceStyle !== 'auto') || scene.bgColor
      ? getEditorialCardStyle(theme, activeAccent, false, scene.surfaceStyle, scene.bgColor)
      : null;

  const {
    enterSpring,
    secondarySpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
  } = computeMotionEnvelope(sceneFrame, sceneTotalFrames, fps);

  const mainPhrase = (scene.focusWord || scene.headline || scene.metricValue || 'KEY INSIGHT').trim();
  const isSingleWord = !mainPhrase.includes(' ');

  // Auto-fit font size to guarantee that NEUROPLASTICITY or other long words never clip
  // Container max text width is 760px to ensure >= 160px horizontal safe padding
  const autoFontSize = fitHeadlineFontSize(mainPhrase, 760, 84, 40);
  const headlineSizePx = Math.round(autoFontSize * scaleMultiplier);

  // SVG circular marker dynamically sized for the text length
  const estWidth = Math.min(940, Math.max(480, Math.round(mainPhrase.length * (headlineSizePx * 0.78) + 90)));
  const estHeight = Math.max(160, Math.round(headlineSizePx * 2.0));
  const circlePath = generateRoughCirclePath(estWidth, estHeight);
  const strokeEvolution = evolvePath(Math.min(1, secondarySpring), circlePath);

  // Subtext underline
  const subtextWidth = Math.min(600, Math.max(260, (scene.subtext || '').length * 20));
  const underlinePath = generateRoughUnderlinePath(subtextWidth, 12);
  const underlineEvolution = evolvePath(Math.min(1, secondarySpring), underlinePath);

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 30 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-14 flex flex-col items-center justify-center relative pointer-events-none select-none"
    >
      <div className="flex flex-col items-center justify-center text-center w-full max-w-[940px]">
        {/* Category Pill Tag */}
        {scene.tag && (
          <div
            style={{
              borderColor: `${activeAccent}80`,
              backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(12,18,32,0.92)',
              transform: `scale(${scaleMultiplier})`,
            }}
            className="px-6 py-2 rounded-full border-2 mb-6 flex items-center gap-3 shadow-xl backdrop-blur-md"
          >
            <div
              style={{ backgroundColor: activeAccent }}
              className="w-3 h-3 rounded-full"
            />
            <span
              style={{
                color: isLight ? '#0F172A' : '#F8FAFC',
                fontSize: '28px',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.18em',
              }}
              className="font-black uppercase"
            >
              {scene.tag}
            </span>
          </div>
        )}

        {/* Main Slam Headline with Guaranteed No-Clip Safe Typography */}
        <div className="relative inline-flex items-center justify-center px-6 py-4 max-w-full">
          <h1
            style={{
              fontSize: `${headlineSizePx}px`,
              color: headlineColor,
              fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              whiteSpace: isSingleWord ? 'nowrap' : 'normal',
              wordBreak: isSingleWord ? 'keep-all' : 'break-word',
              maxWidth: '880px',
              textShadow: isLight
                ? '0 2px 14px rgba(0,0,0,0.08)'
                : '0 8px 32px rgba(0,0,0,0.95)',
            }}
            className="uppercase tracking-tight text-center relative z-10"
          >
            {mainPhrase}
          </h1>

          {/* Rough Spotlight Hand-Drawn Ring */}
          <svg
            className="absolute -inset-x-8 -inset-y-6 w-[calc(100%+64px)] h-[calc(100%+48px)] pointer-events-none overflow-visible z-20"
            viewBox={`0 0 ${estWidth} ${estHeight}`}
            preserveAspectRatio="none"
            fill="none"
          >
            {/* Glow backing */}
            <path
              d={circlePath}
              stroke={activeAccent}
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={secondarySpring * 0.4}
              strokeDasharray={strokeEvolution.strokeDasharray}
              strokeDashoffset={strokeEvolution.strokeDashoffset}
              style={{ filter: `drop-shadow(0 0 20px ${activeAccent})` }}
            />
            {/* Crisp stroke */}
            <path
              d={circlePath}
              stroke={activeAccent}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={secondarySpring}
              strokeDasharray={strokeEvolution.strokeDasharray}
              strokeDashoffset={strokeEvolution.strokeDashoffset}
            />
          </svg>
        </div>

        {/* Supporting Subtext Detail */}
        {scene.subtext && (
          <div className="relative flex flex-col items-center mt-6 max-w-[860px]">
            <span
              style={{
                fontSize: '32px',
                color: isLight ? '#1E293B' : '#E2E8F0',
                fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                fontWeight: 800,
                letterSpacing: '0.04em',
                lineHeight: 1.25,
              }}
              className="uppercase text-center"
            >
              {scene.subtext}
            </span>
            <svg
              className="h-5 overflow-visible mt-2"
              style={{ width: `${subtextWidth}px` }}
              viewBox={`0 0 ${subtextWidth} 20`}
              fill="none"
            >
              <path
                d={underlinePath}
                stroke={activeAccent}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={underlineEvolution.strokeDasharray}
                strokeDashoffset={underlineEvolution.strokeDashoffset}
                style={{ filter: `drop-shadow(0 0 10px ${activeAccent})` }}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
