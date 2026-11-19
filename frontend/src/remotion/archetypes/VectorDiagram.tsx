import React from 'react';
import { spring, useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { ArchetypeComponentProps } from './types';
import {
  computeMotionEnvelope,
  getEditorialCardStyle,
  resolveGraphicTextColor,
  resolveScaleFactor,
  staggerDelay,
} from '../motionKit';

export const VectorDiagram: React.FC<ArchetypeComponentProps> = ({
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

  // Derive 2 to 3 flowchart step items from vectorNodes, keywords, checklist items, or headline
  const vectorNodeLabels = Array.isArray(scene.vectorNodes) && scene.vectorNodes.length > 0
    ? scene.vectorNodes.map((n: any) => typeof n === 'object' && n ? n.label || '' : String(n)).filter(Boolean)
    : [];

  const rawSteps =
    vectorNodeLabels.length > 0
      ? vectorNodeLabels
      : Array.isArray(scene.keywords) && scene.keywords.length > 0
      ? scene.keywords
      : Array.isArray(scene.checklistItems) && scene.checklistItems.length > 0
      ? scene.checklistItems
      : (scene.headline || scene.focusWord || '').split(/\s+/).filter((w) => w.length >= 2);

  const step1 = (rawSteps[0] || scene.focusWord || '').toUpperCase();
  const step2 = (rawSteps[1] || (rawSteps.length > 2 ? rawSteps[1] : '')).toUpperCase();
  const step3 = (rawSteps[2] || (rawSteps.length > 2 ? rawSteps[rawSteps.length - 1] : '')).toUpperCase();

  const stepLabels = [step1, step2, step3].filter(Boolean);
  const totalNodes = Math.max(2, Math.min(3, stepLabels.length || 2));
  const finalLabels = stepLabels.length >= 2 ? stepLabels.slice(0, 3) : [step1 || scene.focusWord || '', step2 || ''];

  const diagramWidth = 1020;
  const nodeWidth = totalNodes === 2 ? 440 : 270;
  const startX = totalNodes === 2 ? 260 : 170;
  const gapX = totalNodes === 2 ? 500 : 340;

  const nodePositions = finalLabels.map((_, i) => ({
    x: startX + i * gapX,
    y: totalNodes === 3 && i === 1 ? 140 : 185,
  }));

  const headlineText = scene.headline && scene.headline.trim() !== '' ? scene.headline : null;

  return (
    <div
      style={{
        transform: `translateY(${(1 - enterSpring) * 35 + livingDriftY}px) scale(${morphProgress * livingPulse})`,
        opacity: exitCurtain,
      }}
      className="w-full h-full px-8 flex flex-col items-center justify-center relative pointer-events-none select-none"
    >
      {/* Category Pill Tag */}
      {scene.tag && (
        <div
          style={{
            borderColor: `${activeAccent}80`,
            backgroundColor: theme.mode === 'editorial' ? 'rgba(255,255,255,0.96)' : 'rgba(12,18,32,0.92)',
            transform: `scale(${scaleMultiplier})`,
          }}
          className="px-6 py-2 rounded-full border-2 mb-3 flex items-center gap-3 shadow-xl backdrop-blur-md"
        >
          <div
            style={{ backgroundColor: activeAccent }}
            className="w-3 h-3 rounded-full"
          />
          <span
            style={{
              color: theme.mode === 'editorial' ? '#0F172A' : '#F8FAFC',
              fontSize: '26px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.18em',
            }}
            className="font-black uppercase"
          >
            {scene.tag}
          </span>
        </div>
      )}

      {/* Main Impact Headline */}
      {headlineText && (
        <div className="text-center max-w-[940px] mb-3">
          <h2
            style={{
              color: headlineColor,
              fontSize: `${Math.round(44 * scaleMultiplier)}px`,
              fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textShadow: theme.mode === 'editorial' ? 'none' : '0 4px 20px rgba(0,0,0,0.85)',
            }}
            className="uppercase tracking-tight"
          >
            {headlineText}
          </h2>
        </div>
      )}

      {/* Flowchart Diagram Stage */}
      <div
        style={{
          width: `${diagramWidth}px`,
          height: '380px',
          transform: `scale(${scaleMultiplier})`,
        }}
        className="relative flex items-center justify-center"
      >
        {/* SVG Curved Vector Connectors (Thick 6px paths) */}
        <svg
          viewBox={`0 0 ${diagramWidth} 380`}
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        >
          <defs>
            <marker
              id="vecArrowHead"
              viewBox="0 0 14 14"
              refX="11"
              refY="7"
              markerWidth="10"
              markerHeight="10"
              orient="auto-start-reverse"
            >
              <path d="M 1 2 L 13 7 L 1 12 z" fill={activeAccent} />
            </marker>
            <filter id="glowVec" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {nodePositions.slice(0, -1).map((pos, i) => {
            const nextPos = nodePositions[i + 1];
            const sx = pos.x + nodeWidth * 0.5 + 4;
            const sy = pos.y;
            const dx = nextPos.x - nodeWidth * 0.5 - 12;
            const dy = nextPos.y;
            const mx = (sx + dx) / 2;
            const my = Math.min(sy, dy) - 45;
            const pathD = `M ${sx} ${sy} Q ${mx} ${my} ${dx} ${dy}`;

            const linkSpring = spring({
              frame: staggerDelay(sceneFrame, i + 1, 5),
              fps,
              config: { damping: 14, stiffness: 160 },
            });

            const strokeEvolution = evolvePath(Math.min(1, linkSpring), pathD);

            return (
              <g key={`link_${i}`}>
                {/* Background bright glow path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={activeAccent}
                  strokeWidth="14"
                  opacity={Math.max(0.3, linkSpring * 0.55)}
                  strokeDasharray={strokeEvolution.strokeDasharray}
                  strokeDashoffset={strokeEvolution.strokeDashoffset}
                  filter="url(#glowVec)"
                />
                {/* Foreground high-contrast connector path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={activeAccent}
                  strokeWidth="6"
                  opacity={linkSpring}
                  strokeDasharray={strokeEvolution.strokeDasharray}
                  strokeDashoffset={strokeEvolution.strokeDashoffset}
                  style={{ filter: `drop-shadow(0 0 8px ${activeAccent})` }}
                  markerEnd="url(#vecArrowHead)"
                />
              </g>
            );
          })}
        </svg>

        {/* Node Cards */}
        {finalLabels.map((label, idx) => {
          const isLast = idx === finalLabels.length - 1;
          const pos = nodePositions[idx];
          const nodeSpring = spring({
            frame: staggerDelay(sceneFrame, idx, 4),
            fps,
            config: { damping: 13, stiffness: 180, mass: 0.75 },
          });

          const isHighlighted = isLast || idx === 1;
          const cardStyle = getEditorialCardStyle(
            theme,
            activeAccent,
            isHighlighted ? (idx === 1 ? 'cobalt' : 'emerald') : 'default',
            scene.surfaceStyle
          );

          return (
            <div
              key={`node_${idx}`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${nodeWidth}px`,
                transform: `translate(-50%, -50%) scale(${nodeSpring})`,
                ...cardStyle,
              }}
              className="absolute rounded-3xl p-5 flex flex-col items-center text-center duration-150 z-10"
            >
              {/* Step Pill */}
              <div
                style={{
                  backgroundColor: `${activeAccent}30`,
                  color: activeAccent,
                  borderColor: activeAccent,
                }}
                className="px-3.5 py-1 rounded-md text-sm font-mono font-black uppercase tracking-wider mb-2 border"
              >
                {`0${idx + 1}`}
              </div>

              {/* Node Title */}
              <span
                style={{
                  color: cardStyle.color,
                  fontSize: `${totalNodes === 2 ? 42 : 35}px`,
                  fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                }}
                className="uppercase line-clamp-2"
              >
                {label}
              </span>

              {/* Node Subtext Detail */}
              {scene.subtext && isLast && (
                <span
                  style={{
                    color: theme.mode === 'editorial' ? '#475569' : '#CBD5E1',
                    fontSize: '20px',
                    fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                    fontWeight: 800,
                  }}
                  className="uppercase mt-2 tracking-wide"
                >
                  {scene.subtext}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
