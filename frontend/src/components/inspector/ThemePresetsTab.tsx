import React from 'react';
import { Palette, Check, Eye, EyeOff, Sparkles, Pipette } from 'lucide-react';
import { PresetConfig, ClipEditState } from '../../types';
import { Button, Badge } from '../ui';

interface ThemePresetsTabProps {
  clip: ClipEditState;
  presets: PresetConfig[];
  selectedPreset: PresetConfig | null;
  themeAccentOverride: string | null;
  isRendering: boolean;
  setSelectedPreset: (p: PresetConfig) => void;
  setThemeAccentOverride: (color: string | null) => void;
  setCleanSpeakerMode: (clean: boolean) => void;
}

const BRAND_PALETTES = [
  { name: 'Preset Default', value: null, hex: '#64748B' },
  { name: 'Cyber Cyan', value: '#00F5FF', hex: '#00F5FF' },
  { name: 'Electric Violet', value: '#A855F7', hex: '#A855F7' },
  { name: 'Crimson Punch', value: '#EF4444', hex: '#EF4444' },
  { name: 'Amber Gold', value: '#F59E0B', hex: '#F59E0B' },
  { name: 'Emerald Clean', value: '#10B981', hex: '#10B981' },
  { name: 'Pure White', value: '#FFFFFF', hex: '#FFFFFF' },
];

export const ThemePresetsTab: React.FC<ThemePresetsTabProps> = ({
  clip,
  presets,
  selectedPreset,
  themeAccentOverride,
  isRendering,
  setSelectedPreset,
  setThemeAccentOverride,
  setCleanSpeakerMode,
}) => {
  const cleanMode = clip.cleanSpeakerMode ?? false;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-8 flex flex-col gap-4 text-xs select-none">
      {/* 1. Visual Theme Presets */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preset Visual Theme</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            {presets.length} Presets Available
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {presets.map((p) => {
            const isSelected = selectedPreset?.id === p.id;
            const primaryColor = p.palette?.primaryAccent || p.palette?.highlightColor || '#00F5FF';
            const baseColor = p.background?.baseColor || '#0A0A0E';

            return (
              <button
                key={p.id}
                type="button"
                disabled={isRendering}
                onClick={() => setSelectedPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-xs">{p.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: baseColor }}
                    />
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 ml-1" />}
                  </div>
                </div>
                {p.description && (
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Clean Speaker View Toggle */}
      <section className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              {cleanMode ? (
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Clean Speaker View</span>
            </span>
            <span className="text-[10px] text-slate-400 max-w-[200px]">
              {cleanMode
                ? 'Pure video feed + subtitles (motion graphics hidden)'
                : 'Full AI Director motion overlays & graphic stages'}
            </span>
          </div>

          <Button
            variant={cleanMode ? 'primary' : 'secondary'}
            size="xs"
            disabled={isRendering}
            onClick={() => setCleanSpeakerMode(!cleanMode)}
          >
            {cleanMode ? 'Clean ON' : 'Standard'}
          </Button>
        </div>
      </section>

      {/* 3. Brand Accent Color Palette */}
      <section className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Brand Accent Palette</span>
          </div>
          <div className="flex items-center gap-1.5">
            {themeAccentOverride && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setThemeAccentOverride(null)}
                className="h-5 px-1.5 text-[9px] font-mono text-cyan-400 hover:text-cyan-300"
              >
                Reset Default
              </Button>
            )}
            <Badge variant={themeAccentOverride ? 'amber' : 'default'} size="sm">
              {themeAccentOverride ? 'Override' : 'Default'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {BRAND_PALETTES.map((bp) => {
            const isSelected = themeAccentOverride === bp.value;
            return (
              <button
                key={bp.name}
                type="button"
                disabled={isRendering}
                onClick={() => setThemeAccentOverride(bp.value)}
                className={`py-2 px-1.5 rounded-lg border text-center flex flex-col items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                  style={{ backgroundColor: bp.hex }}
                />
                <span className="text-[9px] font-bold text-slate-300 truncate w-full">
                  {bp.name}
                </span>
              </button>
            );
          })}

          {/* 8th Slot: Custom RGB Accent Color Picker */}
          <label
            title="Custom Brand Accent Color Picker (RGB)"
            className={`py-2 px-1.5 rounded-lg border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer relative overflow-hidden ${
              themeAccentOverride &&
              !BRAND_PALETTES.some((bp) => bp.value?.toUpperCase() === themeAccentOverride.toUpperCase())
                ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400 shadow-md'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div
              className="w-4 h-4 rounded-full border border-black/40 shadow-sm flex items-center justify-center"
              style={{
                background:
                  'conic-gradient(from 180deg at 50% 50%, #EF4444 0deg, #F59E0B 72deg, #10B981 144deg, #00F5FF 216deg, #A855F7 288deg, #EF4444 360deg)',
              }}
            >
              <Pipette className="w-2 h-2 text-slate-950 stroke-[3]" />
            </div>
            <span className="text-[9px] font-bold text-slate-300 truncate w-full">
              Custom RGB
            </span>
            <input
              type="color"
              disabled={isRendering}
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={themeAccentOverride || '#00F5FF'}
              onChange={(e) => setThemeAccentOverride(e.target.value)}
            />
          </label>
        </div>
      </section>
    </div>
  );
};
