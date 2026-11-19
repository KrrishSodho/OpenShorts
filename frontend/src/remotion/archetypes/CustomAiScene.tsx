import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import {
  Sparkles,
  Layers,
  Award,
  Zap,
  Shield,
  Crosshair,
  Target,
  Flame,
  CheckCircle2,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
} from '../motionKit';

export const CustomAiScene: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const accent = scene.accentColor || theme.accentPrimary || '#00F5FF';
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

  const cardStyle = getEditorialCardStyle(theme, accent, 'default', scene.surfaceStyle);

  const headline = (scene.headline || scene.focusWord || '').trim();
  const tag = (scene.tag || '').trim();
  const metric = (scene.metricValue || '').trim();
  const subtext = (scene.subtext || '').trim();
  const items = Array.isArray(scene.checklistItems) ? scene.checklistItems : [];

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-8 flex flex-col items-center justify-center pointer-events-none select-none"
    >
      <div
        style={{
          ...cardStyle,
          width: '100%',
          maxWidth: 960,
          transform: `scale(${scaleMultiplier})`,
        }}
        className="rounded-3xl p-10 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow accent pill at top */}
        {tag && (
          <div
            style={{
              borderColor: `${accent}80`,
              backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.92)',
            }}
            className="px-6 py-2 rounded-full border flex items-center gap-2.5 shadow-md"
          >
            <Sparkles style={{ color: accent, width: 22, height: 22 }} />
            <span
              style={{
                color: isLight ? '#0F172A' : '#F8FAFC',
                fontSize: '26px',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.15em',
              }}
              className="font-bold uppercase"
            >
              {tag}
            </span>
          </div>
        )}

        {/* Large High-Contrast Headline (>= 64px for phone readability) */}
        {headline && (
          <h1
            style={{
              color: headlineColor,
              fontSize: `${Math.round(68 * scaleMultiplier)}px`,
              fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-0.025em',
              textShadow: isLight ? 'none' : '0 4px 24px rgba(0,0,0,0.85)',
            }}
            className="uppercase tracking-tight max-w-[880px]"
          >
            {headline}
          </h1>
        )}

        {/* Real Metric Display (Only when verified spoken metric exists) */}
        {metric && (
          <div className="flex flex-col items-center gap-1 my-1">
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: `${Math.round(76 * scaleMultiplier)}px`,
                fontWeight: 900,
                lineHeight: 1,
                color: accent,
                textShadow: `0 0 35px ${accent}66`,
              }}
              className="tracking-tight"
            >
              {metric}
            </span>
          </div>
        )}

        {/* Subtext Quote / Context */}
        {subtext && (
          <p
            style={{
              color: isLight ? '#475569' : 'rgba(241, 245, 249, 0.85)',
              fontSize: '32px',
              fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
              fontWeight: 600,
              lineHeight: 1.35,
              maxWidth: 780,
            }}
            className="italic m-0"
          >
            "{subtext}"
          </p>
        )}

        {/* Structured checklist items if present */}
        {items.length > 0 && (
          <div className="w-full flex flex-col gap-2.5 mt-2 max-w-[760px]">
            {items.slice(0, 3).map((item, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                  borderColor: `${accent}40`,
                }}
                className="px-5 py-3 rounded-xl border flex items-center gap-3 text-left"
              >
                <CheckCircle2 style={{ color: accent, width: 24, height: 24, flexShrink: 0 }} />
                <span
                  style={{
                    color: isLight ? '#0F172A' : '#FFFFFF',
                    fontSize: '28px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                  }}
                  className="uppercase tracking-tight"
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
