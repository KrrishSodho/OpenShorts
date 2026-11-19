// PATH: frontend/src/remotion/layers/ProceduralStageRenderer.tsx
/**
 * Procedural Stage Renderer
 *
 * Remotion visual renderer for Procedural Motion Engine (v2.0).
 * Renders declarative scene graph layouts calculated by layoutSolver.ts.
 *
 * ZERO hardcoded archetype glass cards. ZERO eval / new Function().
 * Speech-aligned spring dynamics, high-contrast typography, and phone-readability.
 */

import React, { useMemo } from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { DynamicThemeTokens, CompiledSceneBeat } from '../../types';
import {
  ProceduralScene,
  SolvedSceneLayout,
  SolvedNodeBox,
  SolvedConnectorPath,
} from '../../types/procedural';
import { solveProceduralLayout, synthesizeProceduralScene } from '../procedural/layoutSolver';

interface ProceduralStageRendererProps {
  scene: CompiledSceneBeat;
  theme: DynamicThemeTokens;
  sceneFrame: number;
  sceneTotalFrames: number;
  currentTime: number;
  enterSpring: number;
  secondarySpring: number;
  hookActive?: boolean;
  captionPosition?: 'bottom' | 'middle' | 'top';
}

export const ProceduralStageRenderer: React.FC<ProceduralStageRendererProps> = ({
  scene,
  theme,
  sceneFrame,
  sceneTotalFrames,
  enterSpring,
  hookActive = true,
  captionPosition = 'bottom',
}) => {
  const { fps } = useVideoConfig();

  // 1. Resolve or synthesize ProceduralScene (v2.0)
  const proceduralScene: ProceduralScene = useMemo(() => {
    if (scene.proceduralScene) {
      return scene.proceduralScene;
    }
    return synthesizeProceduralScene(scene);
  }, [scene]);

  // 2. Solve spatial coordinates and connector paths
  const layout: SolvedSceneLayout = useMemo(() => {
    try {
      return solveProceduralLayout(proceduralScene, {
        canvasWidth: 1080,
        canvasHeight: 1920,
        hookActive,
        captionPosition,
        fps,
      });
    } catch (err) {
      console.error('Procedural layout solve error:', err);
      return {
        scene_id: scene?.id || 'error_fallback',
        visual_intent: 'focal_statement',
        containerBox: { x: 80, y: 270, width: 920, height: 1130 },
        nodes: [],
        connectors: [],
        backdrop_style: 'minimal_blur',
        score: 0,
      };
    }
  }, [proceduralScene, hookActive, captionPosition, fps, scene?.id]);

  // Master exit animation
  const exitProgress = interpolate(
    sceneFrame,
    [sceneTotalFrames - 8, sceneTotalFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const masterOpacity = Math.min(1, enterSpring) * exitProgress;

  const accentColor = scene.accentColor || theme.accentPrimary || '#00F5FF';
  const textColor = scene.textColor || theme.textPrimary || '#FFFFFF';

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-30"
    >
      {/* Dynamic Backdrop */}
      {layout.backdrop_style === 'minimal_blur' && (
        <div
          style={{
            backgroundColor: 'rgba(8, 12, 22, 0.62)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        />
      )}
      {layout.backdrop_style === 'dark_scrim' && (
        <div
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(10,15,30,0.85) 0%, rgba(5,7,15,0.95) 100%)',
          }}
          className="absolute inset-0 pointer-events-none"
        />
      )}

      {/* SVG Connectors Layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1080 1920"
      >
        <defs>
          <marker
            id="proc-arrow-head"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill={accentColor} />
          </marker>
        </defs>

        {(layout?.connectors || []).map((conn: SolvedConnectorPath, idx: number) => {
          const connAge = Math.max(0, sceneFrame - conn.revealFrame);
          const connSpring = spring({
            frame: connAge,
            fps,
            config: { damping: 14, mass: 0.8, stiffness: 120 },
          });

          if (conn.type === 'vs_divider') {
            const pillX = conn.labelX ?? 540;
            const pillY = conn.labelY ?? 960;
            return (
              <g key={`conn_${idx}`} style={{ opacity: connSpring }}>
                <path
                  d={conn.pathD}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  fill="none"
                />
                <circle
                  cx={pillX}
                  cy={pillY}
                  r="36"
                  fill="#0B0F19"
                  stroke={accentColor}
                  strokeWidth="3"
                />
                <text
                  x={pillX}
                  y={pillY + 7}
                  fill="#FFFFFF"
                  fontSize="22"
                  fontWeight="900"
                  fontFamily="'JetBrains Mono', monospace"
                  textAnchor="middle"
                >
                  VS
                </text>
              </g>
            );
          }

          return (
            <path
              key={`conn_${idx}`}
              d={conn.pathD}
              stroke={accentColor}
              strokeWidth="4"
              strokeDasharray="8 6"
              fill="none"
              markerEnd="url(#proc-arrow-head)"
              style={{
                opacity: connSpring,
                strokeDashoffset: (1 - connSpring) * 60,
              }}
            />
          );
        })}
      </svg>

      {/* Procedural Graphic Nodes */}
      {(layout?.nodes || []).map((box: SolvedNodeBox, idx: number) => {
        const nodeAge = Math.max(0, sceneFrame - box.revealFrame);
        const nodeSpring = spring({
          frame: nodeAge,
          fps,
          config: { damping: 14, mass: 0.8, stiffness: 120 },
        });

        const translateY = interpolate(nodeSpring, [0, 1], [35, 0]);
        const scale = interpolate(nodeSpring, [0, 1], [0.92, 1]);
        const opacity = interpolate(nodeSpring, [0, 1], [0, 1]);

        return (
          <div
            key={box.id}
            style={{
              position: 'absolute',
              left: `${box.x}px`,
              top: `${box.y}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
            }}
            className="flex flex-col items-center justify-center pointer-events-none"
          >
            <ProceduralNodeCard
              box={box}
              accentColor={accentColor}
              textColor={textColor}
              theme={theme}
              intent={layout.visual_intent}
              nodeIndex={idx}
            />
          </div>
        );
      })}
    </div>
  );
};

interface ProceduralNodeCardProps {
  box: SolvedNodeBox;
  accentColor: string;
  textColor: string;
  theme: DynamicThemeTokens;
  intent: string;
  nodeIndex: number;
}

const ProceduralNodeCard: React.FC<ProceduralNodeCardProps> = ({
  box,
  accentColor,
  textColor,
  theme,
  intent,
  nodeIndex,
}) => {
  const node = box?.node || { id: 'fallback', role: 'primary' as const, text: '' };
  const safeText = String(node.text || '');

  // Stat Callout Variant (Verified Quantitative Mark)
  if (intent === 'stat_callout' || node.metric) {
    const metricText = node.metric?.display_text || String(node.metric?.value || '');
    return (
      <div
        style={{
          backgroundColor: 'rgba(11, 15, 25, 0.82)',
          border: `2px solid ${accentColor}`,
          boxShadow: `0 16px 48px rgba(0,0,0,0.7), 0 0 32px ${accentColor}30`,
        }}
        className="w-full h-full rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 backdrop-blur-xl"
      >
        <span
          style={{
            fontSize: `${box.fontSize}px`,
            lineHeight: `${box.lineHeight}px`,
            color: accentColor,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 900,
            textShadow: `0 4px 20px ${accentColor}60`,
          }}
          className="tracking-tight"
        >
          {metricText}
        </span>
        <span
          style={{
            fontSize: '36px',
            color: textColor,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            lineHeight: 1.25,
          }}
          className="uppercase tracking-wide"
        >
          {safeText}
        </span>
      </div>
    );
  }

  // Comparison Counterpart Variant
  if (intent === 'comparison') {
    const isPrimary = node.role === 'primary';
    const borderColor = isPrimary ? accentColor : 'rgba(255, 255, 255, 0.2)';
    const cardBg = isPrimary ? 'rgba(11, 15, 25, 0.9)' : 'rgba(15, 23, 42, 0.85)';

    return (
      <div
        style={{
          backgroundColor: cardBg,
          border: `2px solid ${borderColor}`,
          boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
        }}
        className="w-full h-full rounded-2xl p-6 flex flex-col items-center justify-center text-center backdrop-blur-xl"
      >
        <span
          style={{
            fontSize: `${box.fontSize}px`,
            lineHeight: `${box.lineHeight}px`,
            color: isPrimary ? accentColor : textColor,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
          }}
          className="uppercase tracking-wide"
        >
          {safeText}
        </span>
      </div>
    );
  }

  // Sequence Step Variant
  if (intent === 'sequence') {
    return (
      <div
        style={{
          backgroundColor: 'rgba(11, 15, 25, 0.88)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
        className="w-full h-full rounded-2xl px-8 flex items-center gap-6 backdrop-blur-xl"
      >
        <div
          style={{
            backgroundColor: `${accentColor}25`,
            borderColor: accentColor,
            color: accentColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}
          className="w-14 h-14 rounded-xl border flex items-center justify-center font-black text-2xl shrink-0"
        >
          {String(nodeIndex + 1).padStart(2, '0')}
        </div>
        <span
          style={{
            fontSize: `${box.fontSize}px`,
            lineHeight: `${box.lineHeight}px`,
            color: textColor,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
          }}
          className="uppercase tracking-wide"
        >
          {safeText}
        </span>
      </div>
    );
  }

  // Verbatim Quote Variant
  if (intent === 'verbatim_quote') {
    return (
      <div
        style={{
          backgroundColor: 'rgba(11, 15, 25, 0.9)',
          borderLeft: `6px solid ${accentColor}`,
          boxShadow: '0 16px 44px rgba(0,0,0,0.7)',
        }}
        className="w-full h-full rounded-2xl p-8 flex flex-col justify-center text-left backdrop-blur-xl relative"
      >
        <span
          style={{
            fontSize: '72px',
            lineHeight: '40px',
            color: `${accentColor}80`,
            fontFamily: 'serif',
          }}
          className="font-bold -mb-2"
        >
          “
        </span>
        <span
          style={{
            fontSize: `${box.fontSize}px`,
            lineHeight: `${box.lineHeight}px`,
            color: textColor,
            fontFamily: "'Newsreader', serif",
            fontStyle: 'italic',
            fontWeight: 600,
          }}
          className="tracking-normal"
        >
          {safeText}
        </span>
      </div>
    );
  }

  // Default Focal Statement Variant
  const isPrimary = node.role === 'primary';
  return (
    <div
      style={{
        backgroundColor: isPrimary ? 'rgba(11, 15, 25, 0.92)' : 'rgba(15, 23, 42, 0.75)',
        border: `2px solid ${isPrimary ? accentColor : 'rgba(255,255,255,0.18)'}`,
        boxShadow: isPrimary
          ? `0 16px 48px rgba(0,0,0,0.75), 0 0 28px ${accentColor}30`
          : '0 10px 30px rgba(0,0,0,0.5)',
      }}
      className="w-full h-full rounded-3xl p-8 flex items-center justify-center text-center backdrop-blur-xl"
    >
      <span
        style={{
          fontSize: `${box.fontSize}px`,
          lineHeight: `${box.lineHeight}px`,
          color: isPrimary ? textColor : 'rgba(255, 255, 255, 0.75)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: isPrimary ? 800 : 600,
          textShadow: '0 3px 12px rgba(0,0,0,0.8)',
        }}
        className="uppercase tracking-wide"
      >
        {safeText}
      </span>
    </div>
  );
};
