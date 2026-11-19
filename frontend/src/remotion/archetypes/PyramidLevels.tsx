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

export const PyramidLevels: React.FC<ArchetypeComponentProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
}) => {
  const { fps } = useVideoConfig();
  const activeAccent = scene.accentColor || theme.accentPrimary || '#00F5FF';
  const isLight = theme.mode === 'editorial';
  const scaleMultiplier = resolveScaleFactor(scene.textSize);
  const headlineColor = resolveGraphicTextColor(scene, theme, isLight);

  const {
    enterSpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
  } = computeMotionEnvelope(sceneFrame, sceneTotalFrames, fps);

  // Derive 3 to 4 tiers (Apex to Base)
  const rawItems =
    Array.isArray(scene.checklistItems) && scene.checklistItems.length > 0
      ? scene.checklistItems
      : Array.isArray(scene.keywords) && scene.keywords.length > 0
      ? scene.keywords
      : ['MASTERY & SCALE', 'SYSTEMS & EXECUTION', 'FOUNDATION & SKILLS'];

  const tiers = rawItems.slice(0, 4).map((it) => String(it).trim().toUpperCase());
  const tierCount = tiers.length;

  const cardStyle = getEditorialCardStyle(theme, activeAccent, 'default', scene.surfaceStyle, scene.bgColor);
  const headlineText = scene.headline && scene.headline.trim() !== '' ? scene.headline : null;

  // Base tier width = 940px, Apex tier width = 480px
  const getTierWidth = (idx: number) => {
    // idx 0 is Apex, idx tierCount-1 is Base
    if (tierCount === 1) return 800;
    const ratio = idx / (tierCount - 1);
    return Math.round(interpolate(ratio, [0, 1], [500, 920]));
  };

  return (
    <div
      style={{
        transform: `translate(${livingDriftX}px, ${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-8 flex flex-col items-center justify-center relative pointer-events-none select-none"
    >
      {/* Category Pill Tag */}
      {scene.tag && (
        <div
          style={{
            borderColor: `${activeAccent}60`,
            backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)',
            transform: `scale(${scaleMultiplier})`,
          }}
          className="px-5 py-1.5 rounded-full border mb-3 flex items-center gap-2.5 shadow-lg backdrop-blur-md"
        >
          <div style={{ backgroundColor: activeAccent }} className="w-2.5 h-2.5 rounded-full" />
          <span
            style={{
              color: isLight ? '#0F172A' : '#F8FAFC',
              fontSize: '22px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em',
            }}
            className="font-bold uppercase"
          >
            {scene.tag}
          </span>
        </div>
      )}

      {/* Main Impact Headline */}
      {headlineText && (
        <div className="text-center max-w-[940px] mb-4">
          <h2
            style={{
              color: headlineColor,
              fontSize: `${Math.round(42 * scaleMultiplier)}px`,
              fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textShadow: isLight ? 'none' : '0 4px 20px rgba(0,0,0,0.85)',
            }}
            className="uppercase tracking-tight"
          >
            {headlineText}
          </h2>
        </div>
      )}

      {/* Pyramid Tiers Stack (Base to Apex illumination) */}
      <div
        style={{
          width: '960px',
          transform: `scale(${scaleMultiplier})`,
        }}
        className="flex flex-col items-center gap-3.5"
      >
        {tiers.map((tierLabel, idx) => {
          // Stagger illumination from Base (tierCount - 1) to Apex (0)
          const reverseIdx = tierCount - 1 - idx;
          const tierSpring = spring({
            frame: staggerDelay(sceneFrame, reverseIdx, 4),
            fps,
            config: { damping: 13, stiffness: 160 },
          });

          const isApex = idx === 0;
          const tierWidth = getTierWidth(idx);

          const tierBg = isApex
            ? `${activeAccent}25`
            : isLight
            ? 'rgba(255,255,255,0.85)'
            : 'rgba(15, 23, 42, 0.75)';

          const tierBorderColor = isApex ? activeAccent : isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';

          return (
            <div
              key={`tier_${idx}`}
              style={{
                width: `${tierWidth}px`,
                backgroundColor: tierBg,
                borderColor: tierBorderColor,
                borderWidth: isApex ? '2px' : '1px',
                transform: `scale(${tierSpring})`,
                opacity: tierSpring,
                boxShadow: isApex ? `0 0 30px ${activeAccent}40` : '0 4px 16px rgba(0,0,0,0.3)',
              }}
              className="rounded-2xl px-6 py-4 flex items-center justify-between gap-4 backdrop-blur-md duration-100"
            >
              {/* Level Badge */}
              <div
                style={{
                  backgroundColor: isApex ? activeAccent : `${activeAccent}20`,
                  color: isApex ? '#0A0F1D' : activeAccent,
                }}
                className="px-3.5 py-1 rounded-md text-[13px] font-mono font-black uppercase tracking-wider shrink-0"
              >
                {isApex ? 'TOP TIER' : `LEVEL 0${tierCount - idx}`}
              </div>

              {/* Tier Headline */}
              <span
                style={{
                  color: isApex ? '#FFFFFF' : isLight ? '#0F172A' : '#F8FAFC',
                  fontSize: `${isApex ? 32 : 28}px`,
                  fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                  fontWeight: 900,
                  textShadow: isApex ? `0 0 16px ${activeAccent}` : 'none',
                }}
                className="uppercase tracking-tight truncate flex-1 text-center"
              >
                {tierLabel}
              </span>

              {/* Subtle Indicator */}
              <div
                style={{ backgroundColor: isApex ? activeAccent : 'transparent' }}
                className="w-3 h-3 rounded-full shrink-0 border border-white/20"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
