import { interpolate, spring } from 'remotion';
import { DynamicThemeTokens } from '../types';

/**
 * Commercial-Grade Motion Design Tokens for 9:16 Shorts (1080x1920 canvas)
 * Minimum subtext/label font size = 26px–32px
 * Headings = 56px–88px
 * Hero numbers = 110px–150px
 * Filling 75–85% of graphic stage
 */
export const MOTION_TYPOGRAPHY = {
  tag: {
    baseSize: 28,
    tracking: '0.18em',
    lineHeight: 1.2,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 900,
  },
  headline: {
    baseSize: 76,
    tracking: '-0.025em',
    lineHeight: 1.1,
    fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
    fontWeight: 900,
  },
  body: {
    baseSize: 34,
    tracking: '0.01em',
    lineHeight: 1.25,
    fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
    fontWeight: 800,
  },
  heroMetric: {
    baseSize: 130,
    tracking: '-0.04em',
    lineHeight: 1.0,
    fontFamily: "'Plus Jakarta Sans', Montserrat, monospace",
    fontWeight: 900,
  },
  cardLabel: {
    baseSize: 42,
    tracking: '-0.02em',
    lineHeight: 1.15,
    fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
    fontWeight: 900,
  },
  cardSub: {
    baseSize: 28,
    tracking: '0.08em',
    lineHeight: 1.2,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 800,
  },
};

/**
 * Safe bounds constants for 1080x1920 mobile viewport
 */
export const SAFE_MARGIN_X = 64; // Guaranteed >= 64px horizontal margin
export const MAX_CONTENT_WIDTH = 952; // 1080 - (64 * 2)

/**
 * Automatically calculates safe font size for long words (e.g. NEUROPLASTICITY)
 * to guarantee that NO word ever clips or overflows the 1080px screen width.
 */
export function fitHeadlineFontSize(
  text: string,
  maxContainerWidth = 760,
  baseFontSize = 80,
  minFontSize = 42
): number {
  const clean = (text || '').trim();
  if (!clean) return baseFontSize;

  const words = clean.split(/\s+/);
  const longestWordLen = Math.max(...words.map((w) => w.length));

  // In ultra-bold modern uppercase sans-serif (800-900 weight), average character width is ~0.78 of font size
  const estimatedCharWidthRatio = 0.78;
  const longestWordWidth = longestWordLen * (baseFontSize * estimatedCharWidthRatio);

  if (longestWordWidth > maxContainerWidth) {
    const calculated = Math.floor(maxContainerWidth / (longestWordLen * estimatedCharWidthRatio));
    return Math.max(minFontSize, calculated);
  }

  // Also check single-line full phrase if 1-2 words
  if (words.length <= 2) {
    const totalLen = clean.length;
    const totalEstimated = totalLen * (baseFontSize * estimatedCharWidthRatio);
    if (totalEstimated > maxContainerWidth) {
      const calculated = Math.floor(maxContainerWidth / (totalLen * estimatedCharWidthRatio));
      return Math.max(minFontSize, calculated);
    }
  }

  return baseFontSize;
}

/**
 * Text Scale Factor resolution (1.0x, 1.3x, 1.6x, 2.0x, 2.3x)
 */
export function resolveScaleFactor(textSize?: string | null): number {
  if (textSize === '2.3x') return 2.3;
  if (textSize === '2.0x') return 2.0;
  if (textSize === '1.6x' || textSize === 'xl' || textSize === '1.5x') return 1.6;
  if (textSize === '1.3x' || textSize === 'lg' || textSize === '1.2x') return 1.3;
  if (textSize === '1.0x' || textSize === 'md') return 1.0;
  return 1.0;
}

/**
 * 3-Act Motion Choreography Envelope:
 * Act 1: Snappy physics spring entry with overshoot control
 * Act 2: Continuous living hold (subtle floating drift, rhythmic pulse, zero dead frames)
 * Act 3: Clean directional wipe / fade exit in final 8 frames
 */
export interface MotionEnvelope {
  enterSpring: number;
  secondarySpring: number;
  exitCurtain: number;
  morphProgress: number;
  livingDriftX: number;
  livingDriftY: number;
  livingPulse: number;
  frame: number;
  fps: number;
  durationInFrames: number;
}

export function computeMotionEnvelope(
  frame: number,
  durationInFrames: number,
  fps: number
): MotionEnvelope {
  const safeDuration = Math.max(20, durationInFrames);
  const clampedFrame = Math.max(0, Math.min(frame, safeDuration));

  // Act 1: Primary entrance spring (Damping: 14, Stiffness: 175, Mass: 0.72)
  const enterSpring = spring({
    frame: clampedFrame,
    fps,
    config: { damping: 14, stiffness: 175, mass: 0.72 },
  });

  // Secondary delayed spring for child elements & accents (offset by 3 frames)
  const secondarySpring = spring({
    frame: Math.max(0, clampedFrame - 3),
    fps,
    config: { damping: 15, stiffness: 155, mass: 0.8 },
  });

  // Act 3: Clean exit curtain in final 8 frames
  const exitDurationFrames = Math.min(9, Math.floor(safeDuration * 0.2));
  const exitStartFrame = safeDuration - exitDurationFrames;
  const exitCurtain = interpolate(
    clampedFrame,
    [exitStartFrame, safeDuration],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const morphProgress = Math.min(1, enterSpring) * exitCurtain;

  // Act 2: Living Hold micro-movements (continuous sine drift, zero dead frames)
  const seconds = clampedFrame / fps;
  const livingDriftX = Math.sin(seconds * 1.8) * 3.5;
  const livingDriftY = Math.cos(seconds * 1.4) * 2.8;
  const livingPulse = 1.0 + Math.sin(seconds * 2.4) * 0.015;

  return {
    enterSpring,
    secondarySpring,
    exitCurtain,
    morphProgress,
    livingDriftX,
    livingDriftY,
    livingPulse,
    frame: clampedFrame,
    fps,
    durationInFrames: safeDuration,
  };
}

/**
 * Child staggered frame calculator
 */
export function staggerDelay(baseFrame: number, index: number, stepFrames = 4): number {
  return Math.max(0, baseFrame - index * stepFrames);
}

export type CardSurfaceVariant = 'default' | 'paper' | 'glass' | 'cobalt' | 'crimson' | 'emerald' | 'transparent';

/**
 * High-Craft Editorial Card Surface Styling
 * Supports per-beat surfaceStyleOverride ('paper', 'glass', 'transparent', 'auto').
 */
export function getEditorialCardStyle(
  theme: DynamicThemeTokens,
  activeAccent: string,
  variant: CardSurfaceVariant | boolean = 'default',
  surfaceOverride?: 'auto' | 'paper' | 'glass' | 'transparent' | null,
  bgColorOverride?: string | null
): React.CSSProperties {
  const isLight = theme.mode === 'editorial';
  let resolvedVariant: CardSurfaceVariant =
    typeof variant === 'boolean' ? (variant ? 'glass' : 'default') : variant;

  if (surfaceOverride && surfaceOverride !== 'auto') {
    resolvedVariant = surfaceOverride;
  }

  // 1. Direct user custom backdrop / background color override (Brand Color Hex / RGB)
  if (bgColorOverride && bgColorOverride.trim()) {
    const raw = bgColorOverride.trim();
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    const cleanHex = hex.slice(0, 7);
    const isLightHex =
      cleanHex.toUpperCase() === '#FFFFFF' ||
      cleanHex.toUpperCase() === '#F6F2E9' ||
      cleanHex.toUpperCase() === '#F8FAFC' ||
      cleanHex.toUpperCase() === '#F1F5F9' ||
      cleanHex.toUpperCase() === '#FFF';

    return {
      backgroundColor: cleanHex.length === 7 ? `${cleanHex}E6` : cleanHex,
      borderColor: isLightHex ? '#0F172A' : activeAccent || 'rgba(255, 255, 255, 0.28)',
      borderWidth: '2.5px',
      boxShadow: isLightHex
        ? '0 20px 48px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.12)'
        : `0 20px 50px rgba(0, 0, 0, 0.85), 0 0 28px ${activeAccent}40`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      color: isLightHex ? '#0F172A' : '#FFFFFF',
    };
  }

  if (resolvedVariant === 'transparent') {
    return {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: '0px',
      boxShadow: 'none',
      backdropFilter: 'none',
      color: '#FFFFFF',
    };
  }

  if (resolvedVariant === 'paper' || (isLight && resolvedVariant === 'default')) {
    // Full-bleed warm cream editorial paper (#F6F2E9) with bold dark ink
    return {
      backgroundColor: 'rgba(246, 242, 233, 0.98)',
      borderColor: '#0F172A',
      borderWidth: '2.5px',
      boxShadow: '0 20px 48px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(16px)',
      color: '#0F172A',
    };
  }

  if (resolvedVariant === 'cobalt') {
    return {
      backgroundColor: 'rgba(10, 22, 48, 0.94)',
      borderColor: '#3B82F6',
      borderWidth: '2.5px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 28px rgba(59, 130, 246, 0.45)',
      backdropFilter: 'blur(20px)',
      color: '#F8FAFC',
    };
  }

  if (resolvedVariant === 'crimson') {
    return {
      backgroundColor: 'rgba(40, 10, 20, 0.94)',
      borderColor: '#F43F5E',
      borderWidth: '2.5px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 28px rgba(244, 63, 94, 0.45)',
      backdropFilter: 'blur(20px)',
      color: '#F8FAFC',
    };
  }

  if (resolvedVariant === 'emerald') {
    return {
      backgroundColor: 'rgba(6, 32, 24, 0.94)',
      borderColor: '#10B981',
      borderWidth: '2.5px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 28px rgba(16, 185, 129, 0.45)',
      backdropFilter: 'blur(20px)',
      color: '#F8FAFC',
    };
  }

  // Cinematic deep graphite glass
  return {
    backgroundColor: 'rgba(10, 15, 26, 0.94)',
    borderColor: activeAccent,
    borderWidth: '2px',
    boxShadow: `0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px ${activeAccent}40`,
    backdropFilter: 'blur(20px)',
    color: '#F8FAFC',
  };
}

/**
 * Resolves graphic text color respecting per-beat override, surface backdrop, and theme
 */
export function resolveGraphicTextColor(
  scene: { textColor?: string | null; surfaceStyle?: string | null },
  theme: DynamicThemeTokens,
  isLight: boolean
): string {
  if (scene.textColor && scene.textColor.trim()) return scene.textColor.trim();
  // Warm cream paper surface uses deep ink
  if (scene.surfaceStyle === 'paper') return '#0F172A';
  // All video overlays, glass, transparent, and dark backdrops MUST default to crisp white for readability
  return '#FFFFFF';
}

/**
 * Deterministic Rough Notation SVG Path Generator
 */
export function generateRoughUnderlinePath(
  width: number,
  yOffset = 8
): string {
  const p1 = `M 4 ${yOffset} C ${width * 0.3} ${yOffset - 4}, ${width * 0.7} ${yOffset + 3}, ${width - 4} ${yOffset}`;
  const p2 = `M 8 ${yOffset + 5} C ${width * 0.4} ${yOffset + 7}, ${width * 0.8} ${yOffset + 2}, ${width - 8} ${yOffset + 4}`;
  return `${p1} ${p2}`;
}

export function generateRoughHighlightRect(
  width: number,
  height: number,
  yOffset = 0
): string {
  const top = yOffset;
  const bottom = yOffset + height;
  return `M 4 ${top + 4} Q ${width * 0.5} ${top - 3} ${width - 4} ${top + 3} L ${width - 2} ${bottom - 3} Q ${width * 0.5} ${bottom + 4} 4 ${bottom - 2} Z`;
}

export function generateRoughCirclePath(
  width: number,
  height: number
): string {
  const rx = width / 2;
  const ry = height / 2;
  const cx = rx;
  const cy = ry;
  return `M ${cx - rx + 6} ${cy} C ${cx - rx} ${cy - ry}, ${cx + rx} ${cy - ry}, ${cx + rx - 4} ${cy} C ${cx + rx} ${cy + ry}, ${cx - rx} ${cy + ry}, ${cx - rx + 8} ${cy - 2}`;
}
