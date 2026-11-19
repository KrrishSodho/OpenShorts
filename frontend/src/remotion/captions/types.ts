import React from 'react';
import { SubtitleConfig, SubtitleStyleId, TranscriptWord } from '../../types';

export interface CaptionPhrase {
  words: TranscriptWord[];
  start: number;
  end: number;
}

export interface CaptionRenderProps {
  activePhrase: CaptionPhrase;
  activeWordIndex: number;
  currentTime: number;
  fps: number;
  cfg: SubtitleConfig;
  themeAccent?: string;
  fontSizePx: number;
  formatWord: (w: string) => string;
}

export interface SubtitleStyleDefinition {
  id: SubtitleStyleId;
  name: string;
  desc: string;
  swatch: string;
  Component: React.FC<CaptionRenderProps>;
}

export interface HighlightColorTokens {
  hex: string;
  textHex: string;
  glowHex: string;
}

export const HIGHLIGHT_COLOR_MAP: Record<string, HighlightColorTokens> = {
  yellow: { hex: '#FFE600', textHex: '#090D16', glowHex: 'rgba(255, 230, 0, 0.7)' },
  cyan: { hex: '#00F0FF', textHex: '#090D16', glowHex: 'rgba(0, 240, 255, 0.7)' },
  emerald: { hex: '#10B981', textHex: '#090D16', glowHex: 'rgba(16, 185, 129, 0.7)' },
  crimson: { hex: '#E63946', textHex: '#FFFFFF', glowHex: 'rgba(230, 57, 70, 0.7)' },
  violet: { hex: '#A855F7', textHex: '#FFFFFF', glowHex: 'rgba(168, 85, 247, 0.7)' },
  white: { hex: '#FFFFFF', textHex: '#090D16', glowHex: 'rgba(255, 255, 255, 0.7)' },
};

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128;
}

export function resolveHighlightTokens(
  colorNameOrHex?: string,
  defaultFallback: string = 'yellow'
): HighlightColorTokens {
  if (colorNameOrHex && colorNameOrHex.startsWith('#')) {
    const isDarkText = isLightColor(colorNameOrHex);
    return {
      hex: colorNameOrHex,
      textHex: isDarkText ? '#090D16' : '#FFFFFF',
      glowHex: `${colorNameOrHex}B3`,
    };
  }
  return (
    HIGHLIGHT_COLOR_MAP[colorNameOrHex || ''] ||
    HIGHLIGHT_COLOR_MAP[defaultFallback] ||
    HIGHLIGHT_COLOR_MAP.yellow
  );
}
