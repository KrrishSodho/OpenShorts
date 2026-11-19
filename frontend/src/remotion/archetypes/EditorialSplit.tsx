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

export const EditorialSplit: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#00F5FF';
  const isLight = theme.mode === 'editorial';
  const isPaperSurface = scene.surfaceStyle === 'paper';
  const scaleFactor = resolveScaleFactor(scene.textSize);
  const headlineTextColor = resolveGraphicTextColor(scene, theme, isLight);

  const {
    enterSpring,
    secondarySpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
  } = computeMotionEnvelope(sceneFrame, sceneTotalFrames, fps);

  const headlineTokens = (scene.headline || scene.focusWord || 'CORE INSIGHT').split(/\s+/).filter(Boolean);
  const baseSize =
    headlineTokens.length > 7
      ? 46
      : headlineTokens.length > 5
      ? 54
      : headlineTokens.length <= 3
      ? 76
      : 64;
  const scaledSizePx = Math.round(baseSize * scaleFactor);

  const underlinePath = generateRoughUnderlinePath(240, 10);
  const underlineEvolution = evolvePath(Math.min(1, secondarySpring), underlinePath);

  const focusMatchesToken = Boolean(
    scene.focusWord &&
    headlineTokens.some(
      (tok) => tok.replace(/[^a-zA-Z0-9']/g, '').toUpperCase() === scene.focusWord.toUpperCase()
    )
  );

  const cardStyle =
    scene.surfaceStyle && scene.surfaceStyle !== 'transparent' && scene.surfaceStyle !== 'auto'
      ? getEditorialCardStyle(theme, activeAccent, false, scene.surfaceStyle)
      : null;

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-8 flex flex-col items-center justify-center text-center pointer-events-none select-none"
    >
      <div
        style={cardStyle ? { ...cardStyle, maxWidth: '960px', padding: '36px 40px', borderRadius: '32px' } : undefined}
        className="flex flex-col items-center justify-center text-center w-full"
      >
        {/* Category Pill Tag */}
        {scene.tag && (
          <div
            style={{
              borderColor: `${activeAccent}60`,
              backgroundColor: isPaperSurface ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.88)',
              transform: `scale(${scaleFactor})`,
            }}
            className="px-5 py-1.5 rounded-full border mb-4 flex items-center gap-2 shadow-lg backdrop-blur-md"
          >
            <div
              style={{ backgroundColor: activeAccent }}
              className="w-2.5 h-2.5 rounded-full"
            />
            <span
              style={{
                color: isPaperSurface ? '#0F172A' : '#F8FAFC',
                fontSize: `${Math.round(20 * scaleFactor)}px`,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.18em',
              }}
              className="font-black uppercase"
            >
              {scene.tag}
            </span>
          </div>
        )}

        {/* Main Headline with Animated Underline */}
        <h1
          style={{
            fontSize: `${scaledSizePx}px`,
            fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
            lineHeight: 1.14,
            letterSpacing: '-0.025em',
            textShadow: isPaperSurface
              ? '0 2px 12px rgba(15,23,42,0.12)'
              : '0 8px 32px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.85)',
            maxWidth: '920px',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
          className="font-black uppercase tracking-tight text-center"
        >
          {headlineTokens.map((tok, idx) => {
            const cleanW = tok.replace(/[^a-zA-Z0-9']/g, '').toUpperCase();
            const isFocus = scene.focusWord && cleanW === scene.focusWord.toUpperCase();

            return (
              <span key={idx} className="inline-block mr-3.5 relative">
                <span
                  style={{
                    color: isFocus ? activeAccent : headlineTextColor,
                  }}
                >
                  {tok}
                </span>
                {isFocus && (
                  <svg
                    className="absolute left-0 -bottom-3 w-full h-4 pointer-events-none overflow-visible"
                    viewBox="0 0 240 16"
                    preserveAspectRatio="none"
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
                )}
              </span>
            );
          })}
        </h1>

        {/* Highlighted Keyword Badge (Eliminates ghost field when focusWord is not in headline, e.g. INVITÉES) */}
        {scene.focusWord && !focusMatchesToken && (
          <div
            style={{
              borderColor: `${activeAccent}90`,
              backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(12,18,32,0.92)',
              transform: `scale(${scaleFactor})`,
              boxShadow: `0 8px 24px ${activeAccent}35`,
            }}
            className="px-6 py-2 rounded-2xl border-2 mt-4 flex items-center gap-2 backdrop-blur-md"
          >
            <span
              style={{
                color: activeAccent,
                fontSize: `${Math.round(26 * scaleFactor)}px`,
                fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                letterSpacing: '0.08em',
              }}
              className="font-black uppercase"
            >
              {scene.focusWord}
            </span>
          </div>
        )}

        {/* Supporting Subtext Detail */}
        {scene.subtext && (
          <span
            style={{
              fontSize: `${Math.round(24 * scaleFactor)}px`,
              color: isLight ? '#64748B' : '#CBD5E1',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.04em',
            }}
            className="font-bold uppercase tracking-wide mt-4 max-w-[800px]"
          >
            {scene.subtext}
          </span>
        )}
      </div>
    </div>
  );
};
