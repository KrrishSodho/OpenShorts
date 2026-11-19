import { fetchHealth, fetchPresets } from '../../api';
import { PresetConfig, SubtitleStyleId } from '../../types';
import { SliceCreator } from '../types';

export interface MediaSlice {
  apiStatus: 'online' | 'connecting' | 'offline';
  presets: PresetConfig[];
  selectedPreset: PresetConfig | null;
  fps: 30 | 60;
  videoVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  masterMuted: boolean;
  themeAccentOverride: string | null;

  initBackend: () => Promise<void>;
  setSelectedPreset: (preset: PresetConfig) => void;
  setThemeAccentOverride: (color: string | null) => void;
  setFps: (fps: 30 | 60) => void;
  setVideoVolume: (vol: number) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setSfxVolume: (vol: number) => void;
  setMasterMuted: (muted: boolean) => void;
}

export const createMediaSlice: SliceCreator<MediaSlice> = (set, get) => ({
  apiStatus: 'connecting',
  presets: [],
  selectedPreset: null,
  fps: 30,
  videoVolume: 1.0,
  sfxEnabled: true,
  sfxVolume: 0.25,
  masterMuted: false,
  themeAccentOverride: null,

  initBackend: async () => {
    try {
      const [health, presets] = await Promise.all([fetchHealth(), fetchPresets()]);
      const defaultPreset =
        presets.find((p) => p.id.includes('fable')) || presets[0] || null;
      set({
        apiStatus: health.status === 'online' ? 'online' : 'offline',
        presets,
        selectedPreset: defaultPreset,
      });
    } catch {
      set({ apiStatus: 'offline' });
    }
  },

  setSelectedPreset: (preset) => {
    if (get().isRendering) return;
    // Decoupled: changing Look/Theme MUST NEVER override the user's chosen subtitle configuration
    set({ selectedPreset: preset });
  },

  setThemeAccentOverride: (color) => {
    if (get().isRendering) return;
    set({ themeAccentOverride: color });
  },

  setFps: (fps) => {
    if (get().isRendering) return;
    set({ fps });
  },

  setVideoVolume: (videoVolume) => set({ videoVolume }),

  setSfxEnabled: (sfxEnabled) => {
    if (get().isRendering) return;
    set({ sfxEnabled });
  },

  setSfxVolume: (sfxVolume) => {
    if (get().isRendering) return;
    set({ sfxVolume });
  },

  setMasterMuted: (masterMuted) => {
    if (get().isRendering) return;
    set({ masterMuted });
  },
});
