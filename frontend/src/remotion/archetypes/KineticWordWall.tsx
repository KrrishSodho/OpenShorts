import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  generateRoughHighlightRect,
  resolveGraphicTextColor,
  resolveScaleFactor,
  staggerDelay,
} from '../motionKit';

export const KineticWordWall: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#FFE600';
  const isLight = theme.mode === 'editorial';
  const scaleFactor = resolveScaleFactor(scene.textSize);
  const headlineColor = resolveGraphicTextColor(scene, theme, isLight);

  const {
    enterSpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
  } = computeMotionEnvelope(sceneFrame, sceneTotalFrames, fps);

  const isFullTakeover = scene.zone === 'full_takeover';
  const rawWords = (
    scene.keywords.length > 0
      ? scene.keywords
      : (scene.headline || scene.focusWord || '').split(/\s+/).filter(Boolean)
  ).slice(0, 4);

  const wordsStack = rawWords.length > 0 ? rawWords : [scene.focusWord || ''];

  const baseSize = wordsStack.length >= 4 ? 68 : 82;
  const scaledSizePx = Math.round(baseSize * scaleFactor);

  const highlightPath = generateRoughHighlightRect(600, 84, 0);

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className={`w-full h-full px-10 flex flex-col items-center justify-center gap-4 pointer-events-none select-none ${
        isFullTakeover ? 'pb-32 pt-14' : 'py-8'
      }`}
    >
      {/* Category Pill Tag */}
      {scene.tag && (
        <div
          style={{
            borderColor: `${activeAccent}60`,
            backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)',
            transform: `scale(${scaleFactor})`,
          }}
          className="px-4 py-1.5 rounded-full border mb-2 flex items-center gap-2 shadow-lg backdrop-blur-md"
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

      {/* Rhythmic Word Stack */}
      {wordsStack.map((word, idx) => {
        const itemSpring = spring({
          frame: staggerDelay(sceneFrame, idx, 4),
          fps,
          config: { damping: 13, stiffness: 200, mass: 0.65 },
        });

        const isHero = idx === wordsStack.length - 1;
        const evolution = evolvePath(Math.min(1, itemSpring), highlightPath);

        return (
          <div
            key={idx}
            style={{
              transform: `scale(${itemSpring})`,
              opacity: itemSpring,
            }}
            className="relative inline-flex items-center justify-center px-8 py-2"
          >
            {/* Highlighter marker sweep behind hero word */}
            {isHero && (
              <svg
                className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                viewBox="0 0 600 84"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d={highlightPath}
                  fill={activeAccent}
                  opacity={0.35}
                  stroke={activeAccent}
                  strokeWidth="3"
                  strokeDasharray={evolution.strokeDasharray}
                  strokeDashoffset={evolution.strokeDashoffset}
                />
              </svg>
            )}

            <span
              style={{
                color: isHero ? activeAccent : headlineColor,
                fontSize: `${scaledSizePx}px`,
                fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                lineHeight: 0.96,
                letterSpacing: '-0.03em',
                textShadow: isLight
                  ? 'none'
                  : isHero
                  ? `0 0 30px ${activeAccent}66`
                  : '0 6px 20px rgba(0,0,0,0.8)',
              }}
              className="font-black uppercase tracking-tight text-center relative z-10"
            >
              {word}
            </span>
          </div>
        );
      })}
    </div>
  );
};
