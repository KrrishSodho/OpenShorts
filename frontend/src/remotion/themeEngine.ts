import { PresetConfig, DynamicThemeTokens } from '../types';

/**
 * Dynamically resolves all visual tokens from the active Preset JSON configuration
 * and optional AI niche accent overrides — zero hardcoded colors in UI components.
 */
export function resolveDynamicTheme(
  preset: PresetConfig | undefined,
  aiAccentOverride?: string | null
): DynamicThemeTokens {
  const id = (preset?.id || '').toLowerCase();
  const bg = preset?.background || {};
  const pal = preset?.palette || {};

  if (id.includes('cyber')) {
    const primary = aiAccentOverride || pal.primaryAccent || '#00F5FF';
    const secondary = pal.secondaryAccent || '#A855F7';
    const baseBg = bg.baseColor || '#060810';
    const gridColor = bg.gridLineColor || '#151B2E';

    return {
      mode: 'technical',
      stageBg: baseBg,
      stageBgInverted: primary,
      cardBg: '#0B0F19',
      textPrimary: pal.textPrimary || '#F8FAFC',
      textMuted: pal.textMuted || '#94A3B8',
      accentPrimary: primary,
      accentSecondary: secondary,
      borderStyle: primary,
      gridPattern: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
      gridSize: '28px 28px',
    };
  }

  if (id.includes('minimal') || id.includes('studio_minimal')) {
    const primary = aiAccentOverride || pal.primaryAccent || '#10B981';
    const secondary = pal.secondaryAccent || '#64748B';
    const baseBg = bg.baseColor || '#0B0F17';
    const gridColor = bg.gridLineColor || '#162032';

    return {
      mode: 'technical',
      stageBg: baseBg,
      stageBgInverted: primary,
      cardBg: '#111827',
      textPrimary: pal.textPrimary || '#FFFFFF',
      textMuted: pal.textMuted || '#94A3B8',
      accentPrimary: primary,
      accentSecondary: secondary,
      borderStyle: '#334155',
      gridPattern: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
      gridSize: '36px 36px',
    };
  }

  if (id.includes('opus')) {
    const primary = aiAccentOverride || pal.primaryAccent || '#E63946';
    const baseBg = bg.baseColor || bg.primaryColor || '#F5F2EB';
    const gridColor = bg.gridLineColor || bg.secondaryColor || '#E0DDD5';

    return {
      mode: 'editorial',
      stageBg: baseBg,
      stageBgInverted: primary,
      cardBg: '#FFFFFF',
      textPrimary: pal.textPrimary || '#0F172A',
      textMuted: pal.textMuted || '#64748B',
      accentPrimary: primary,
      accentSecondary: pal.darkAccent || '#1E293B',
      borderStyle: '#0F172A',
      gridPattern: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
      gridSize: '38px 38px',
    };
  }

  if (id.includes('vox')) {
    const primary = aiAccentOverride || pal.primaryAccent || '#FFE600';
    const secondary = pal.secondaryAccent || '#38BDF8';
    const baseBg = bg.baseColor || bg.primaryColor || '#080F1E';
    const gridColor = bg.gridLineColor || '#152238';

    return {
      mode: 'technical',
      stageBg: baseBg,
      stageBgInverted: primary,
      cardBg: '#0F172A',
      textPrimary: pal.textPrimary || '#F8FAFC',
      textMuted: pal.textMuted || '#94A3B8',
      accentPrimary: primary,
      accentSecondary: secondary,
      borderStyle: primary,
      gridPattern: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
      gridSize: '32px 32px',
    };
  }

  // Default: Fable Kinetic Mode
  const primary = aiAccentOverride || pal.highlightColor || '#FF3B1D';
  const secondary = pal.primaryAccent || '#FFE600';
  const baseBg = bg.baseColor || '#0A0A0E';
  const dotColor = bg.dotColor || '#24242C';

  return {
    mode: 'kinetic',
    stageBg: baseBg,
    stageBgInverted: primary,
    cardBg: '#14141B',
    textPrimary: pal.textPrimary || '#FFFFFF',
    textMuted: pal.textMuted || '#94A3B8',
    accentPrimary: primary,
    accentSecondary: secondary,
    borderStyle: '#FFFFFF',
    gridPattern: `radial-gradient(${dotColor} 2px, transparent 2px)`,
    gridSize: '22px 22px',
  };
}
