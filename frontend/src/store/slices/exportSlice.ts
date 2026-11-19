import { cancelRenderExport, triggerRenderExport } from '../../api';
import { ExportHistoryItem } from '../../types';
import { SliceCreator } from '../types';

const STORAGE_KEY = 'viral_studio_export_history';

function loadPersistedHistory(): ExportHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistHistory(items: ExportHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // Ignore storage quota errors
  }
}

export interface ExportSlice {
  activeRenderId: string | null;
  isRendering: boolean;
  renderProgress: number;
  renderStep: string;
  renderEtaSec: number;
  renderElapsedSec: number;
  exportHistory: ExportHistoryItem[];

  startRenderExport: () => Promise<void>;
  cancelRenderExport: () => Promise<void>;
  updateRenderProgressState: (
    progress: number,
    step: string,
    etaSec: number,
    elapsedSec: number
  ) => void;
  completeRenderExport: (
    downloadUrl: string,
    filename: string,
    details?: { thumbnailUrl?: string | null; fileSizeBytes?: number; durationSec?: number }
  ) => void;
  removeExportHistoryItem: (renderId: string) => void;
  clearExportHistory: () => void;
  failRenderExport: (error: string) => void;
}

export const createExportSlice: SliceCreator<ExportSlice> = (set, get) => ({
  activeRenderId: null,
  isRendering: false,
  renderProgress: 0,
  renderStep: '',
  renderEtaSec: 0,
  renderElapsedSec: 0,
  exportHistory: loadPersistedHistory(),

  startRenderExport: async () => {
    const {
      currentMedia,
      selectedPreset,
      activeClipId,
      clipEditsById,
      subtitleConfig,
      fps,
      videoVolume,
      sfxEnabled,
      sfxVolume,
      masterMuted,
      isRendering,
    } = get();

    if (!currentMedia || !selectedPreset || !activeClipId || isRendering) return;
    const clip = clipEditsById[activeClipId];
    if (!clip || !clip.videoUrl) return;

    const clipDuration = Math.max(1, clip.endTime - clip.startTime);
    const trimStart = Math.max(0, clip.trimStart ?? 0);
    const trimEnd = Math.max(
      trimStart + 0.5,
      Math.min(clipDuration, clip.trimEnd ?? clipDuration)
    );
    const effectiveDuration = Math.max(0.5, trimEnd - trimStart);

    set({
      isRendering: true,
      renderProgress: 5,
      renderStep: 'Starting 1080x1920 Remotion Export...',
      renderEtaSec: 18,
      renderElapsedSec: 0,
      errorMessage: null,
      activeRenderId: null,
    });

    try {
      const uniqueRenderKey = `${activeClipId}_${Date.now()}`;
      const inputProps = {
        videoUrl: clip.videoUrl,
        words: clip.words,
        preset: selectedPreset,
        subtitleConfig,
        title: clip.title,
        showTopHook: clip.showTopHook,
        hookSize: clip.hookSize || 'md',
        hookTextColor: clip.hookTextColor || null,
        hookBgColor: clip.hookBgColor || null,
        panPercent: clip.panKeyframes[0]?.pan ?? 50,
        panKeyframes: clip.panKeyframes,
        motionEvents: clip.motionEvents,
        framingLayout: clip.framingLayout || 'single',
        splitTopPan: clip.splitTopPan ?? 22,
        splitBottomPan: clip.splitBottomPan ?? 78,
        splitZoom: clip.splitZoom ?? 1.55,
        trioLeftPan: clip.trioLeftPan ?? 18,
        trioRightPan: clip.trioRightPan ?? 82,
        cleanSpeakerMode: clip.cleanSpeakerMode ?? false,
        themeAccentOverride: get().themeAccentOverride,
        videoVolume: masterMuted ? 0 : videoVolume,
        sfxEnabled: masterMuted ? false : sfxEnabled,
        sfxVolume: masterMuted ? 0 : sfxVolume,
        duration: clipDuration,
        trimStart,
        trimEnd,
        effectiveDuration,
        fps,
      };

      const data = await triggerRenderExport({
        clip_id: uniqueRenderKey,
        input_props: inputProps,
        fps,
      });

      set({ activeRenderId: data.render_id });
    } catch (err: any) {
      set({
        isRendering: false,
        activeRenderId: null,
        errorMessage: err?.message || 'Render export failed to start.',
      });
    }
  },

  cancelRenderExport: async () => {
    const { activeRenderId } = get();
    if (!activeRenderId) {
      set({ isRendering: false, activeRenderId: null, renderStep: 'Cancelled' });
      return;
    }
    set({ renderStep: 'Cancelling Chromium render...' });
    try {
      await cancelRenderExport(activeRenderId);
    } catch {
      // ignore network error on cancel
    } finally {
      set({
        isRendering: false,
        activeRenderId: null,
        renderProgress: 0,
        renderStep: '',
      });
    }
  },

  updateRenderProgressState: (renderProgress, renderStep, renderEtaSec, renderElapsedSec) =>
    set({ renderProgress, renderStep, renderEtaSec, renderElapsedSec }),

  completeRenderExport: (downloadUrl, filename, details) =>
    set((state) => {
      const clip = state.activeClipId ? state.clipEditsById[state.activeClipId] : null;
      const nextVersion = state.exportHistory.length + 1;
      const newItem: ExportHistoryItem = {
        renderId: state.activeRenderId || `render_${Date.now()}`,
        version: nextVersion,
        clipId: state.activeClipId || '',
        title: clip?.title || 'Viral Short',
        subtitleStyle: state.subtitleConfig.style,
        presetName: state.selectedPreset?.name || 'Fable 5.2',
        downloadUrl,
        filename,
        thumbnailUrl: details?.thumbnailUrl || null,
        fileSizeBytes: details?.fileSizeBytes,
        durationSec: details?.durationSec,
        createdAt: new Date().toLocaleTimeString(),
      };
      const updatedHistory = [newItem, ...state.exportHistory];
      persistHistory(updatedHistory);
      return {
        isRendering: false,
        activeRenderId: null,
        renderProgress: 100,
        renderStep: 'Export Complete!',
        renderEtaSec: 0,
        exportHistory: updatedHistory,
      };
    }),

  removeExportHistoryItem: (renderId) =>
    set((state) => {
      const updatedHistory = state.exportHistory.filter((item) => item.renderId !== renderId);
      persistHistory(updatedHistory);
      return { exportHistory: updatedHistory };
    }),

  clearExportHistory: () => {
    persistHistory([]);
    set({ exportHistory: [] });
  },

  failRenderExport: (error) =>
    set({
      isRendering: false,
      activeRenderId: null,
      errorMessage: error,
    }),
});
