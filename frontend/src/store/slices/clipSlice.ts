import { autoTrackPan, prepareClip } from '../../api';
import {
  MediaInfo,
  TranscriptData,
  ViralClipRecommendation,
  ClipEditState,
  PanKeyframe,
} from '../../types';
import { SliceCreator } from '../types';
import { stopSfxAudioPreview } from '../../utils/audioPreview';

let clipSwitchAbortController: AbortController | null = null;

function resolveClipId(mediaId: string, clip: ViralClipRecommendation): string {
  if (clip.clip_id) return clip.clip_id;
  return `${mediaId}_${Math.round(clip.start_time * 10)}_${Math.round(clip.end_time * 10)}`;
}

export interface ClipSlice {
  currentMedia: MediaInfo | null;
  transcript: TranscriptData | null;
  detectedNiche: string;
  recommendedClips: ViralClipRecommendation[];
  activeClipId: string | null;
  clipEditsById: Record<string, ClipEditState>;
  isPreparingClip: boolean;
  isAutoTracking: boolean;

  selectShort: (clip: ViralClipRecommendation) => Promise<void>;
  updateActiveClipTrim: (trimStart: number, trimEnd: number) => void;
  updateActiveClipTitle: (title: string) => void;
  toggleActiveTopHook: (show: boolean) => void;
  updateActiveHookStyle: (style: {
    hookSize?: 'sm' | 'md' | 'lg';
    hookTextColor?: string | null;
    hookBgColor?: string | null;
  }) => void;
  updateActivePanKeyframes: (kfs: PanKeyframe[]) => void;
  setFramingLayoutMode: (mode: 'single' | 'split' | 'trio_rotate') => void;
  setSplitPans: (topPan: number, bottomPan: number) => void;
  swapSplitPans: () => void;
  setSplitZoom: (zoom: number) => void;
  setTrioPans: (primaryPan: number, leftPan: number, rightPan: number) => void;
  setCleanSpeakerMode: (clean: boolean) => void;
  autoTrackActiveClipFaces: () => Promise<void>;
}

export const createClipSlice: SliceCreator<ClipSlice> = (set, get) => ({
  currentMedia: null,
  transcript: null,
  detectedNiche: '',
  recommendedClips: [],
  activeClipId: null,
  clipEditsById: {},
  isPreparingClip: false,
  isAutoTracking: false,

  selectShort: async (clip) => {
    const { currentMedia, selectedPreset, clipEditsById, activeClipId, isRendering } = get();
    if (!currentMedia || !selectedPreset || isRendering) return;

    stopSfxAudioPreview();

    const targetClipId = resolveClipId(currentMedia.id, clip);
    if (targetClipId === activeClipId && clipEditsById[targetClipId]?.videoUrl) return;

    if (clipSwitchAbortController) {
      clipSwitchAbortController.abort();
      clipSwitchAbortController = null;
    }

    const previousClipId = activeClipId;

    const cached = clipEditsById[targetClipId];
    if (cached && cached.videoUrl) {
      set({
        activeClipId: targetClipId,
        currentPlaySec: 0,
        selectedBeatIdx: 0,
        isPreparingClip: false,
        errorMessage: null,
      });
      return;
    }

    const controller = new AbortController();
    clipSwitchAbortController = controller;
    // Safe 60s timeout guard so active FFmpeg trimming / face-tracking on large videos is never cut off
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    set({
      isPreparingClip: true,
      errorMessage: null,
    });

    try {
      const data = await prepareClip(
        {
          media_id: currentMedia.id,
          start_time: clip.start_time,
          end_time: clip.end_time,
          preset_id: selectedPreset.id,
          custom_title: cached?.title || clip.title || '',
          motion_events: cached?.motionEvents || clip.motion_events || [],
          crop_focus: 'auto',
          pan_keyframes:
            cached?.panKeyframes && cached.panKeyframes.length > 0
              ? cached.panKeyframes
              : undefined,
        },
        controller.signal
      );

      clearTimeout(timeoutId);

      if (!data.success || !data.clip_manifest?.video_url) {
        throw new Error('Failed to prepare selected short.');
      }

      const m = data.clip_manifest;
      const newEdit: ClipEditState = {
        clipId: m.clip_id,
        startTime: clip.start_time,
        endTime: clip.end_time,
        trimStart: cached?.trimStart ?? 0,
        trimEnd: cached?.trimEnd ?? +(clip.end_time - clip.start_time).toFixed(2),
        title: cached?.title || clip.title || m.title || '',
        showTopHook: cached?.showTopHook ?? true,
        reasoning: clip.reasoning || cached?.reasoning || '',
        motionEvents: cached?.motionEvents?.length
          ? cached.motionEvents
          : clip.motion_events || m.motion_events || [],
        panKeyframes:
          m.pan_keyframes && m.pan_keyframes.length > 0
            ? m.pan_keyframes
            : [{ t: 0, pan: 50 }],
        words: m.words || [],
        videoUrl: m.video_url,
        framingLayout: cached?.framingLayout || m.framing_layout || 'single',
        splitTopPan: cached?.splitTopPan ?? m.split_top_pan ?? 22,
        splitBottomPan: cached?.splitBottomPan ?? m.split_bottom_pan ?? 78,
        cleanSpeakerMode: cached?.cleanSpeakerMode ?? m.clean_speaker_mode ?? false,
      };

      set((state) => ({
        isPreparingClip: false,
        activeClipId: m.clip_id,
        currentPlaySec: 0,
        selectedBeatIdx: 0,
        clipEditsById: {
          ...state.clipEditsById,
          [m.clip_id]: newEdit,
          [targetClipId]: newEdit,
        },
      }));
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        set({
          isPreparingClip: false,
          activeClipId: previousClipId,
          errorMessage: 'Short preparation timed out. Click again to retry.',
        });
        return;
      }
      set({
        isPreparingClip: false,
        activeClipId: previousClipId,
        errorMessage: err?.message || 'Unable to prepare selected short.',
      });
    }
  },

  updateActiveClipTrim: (trimStart, trimEnd) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      const safeStart = Math.max(0, Math.min(trimStart, trimEnd - 0.5));
      const safeEnd = Math.max(safeStart + 0.5, trimEnd);
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: {
            ...clip,
            trimStart: safeStart,
            trimEnd: safeEnd,
          },
        },
      };
    });
  },

  updateActiveClipTitle: (title) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: { ...clip, title },
        },
      };
    });
  },

  toggleActiveTopHook: (showTopHook) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: { ...clip, showTopHook },
        },
      };
    });
  },

  updateActiveHookStyle: (hookStyle) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: {
            ...clip,
            ...(hookStyle.hookSize !== undefined ? { hookSize: hookStyle.hookSize } : {}),
            ...(hookStyle.hookTextColor !== undefined ? { hookTextColor: hookStyle.hookTextColor } : {}),
            ...(hookStyle.hookBgColor !== undefined ? { hookBgColor: hookStyle.hookBgColor } : {}),
          },
        },
      };
    });
  },

  updateActivePanKeyframes: (panKeyframes) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: { ...clip, panKeyframes },
        },
      };
    });
  },

  setFramingLayoutMode: (framingLayout) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: {
            ...clip,
            framingLayout,
            splitTopPan: clip.splitTopPan ?? 22,
            splitBottomPan: clip.splitBottomPan ?? 78,
            splitZoom: clip.splitZoom ?? 1.55,
            trioLeftPan: clip.trioLeftPan ?? 18,
            trioRightPan: clip.trioRightPan ?? 82,
          },
        },
      };
    });
  },

  setSplitZoom: (splitZoom) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: { ...clip, splitZoom },
        },
      };
    });
  },

  setTrioPans: (primaryPan, leftPan, rightPan) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: {
            ...clip,
            splitTopPan: primaryPan,
            trioLeftPan: leftPan,
            trioRightPan: rightPan,
          },
        },
      };
    });
  },

  setCleanSpeakerMode: (cleanSpeakerMode) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: {
            ...clip,
            cleanSpeakerMode,
          },
        },
      };
    });
  },

  setSplitPans: (splitTopPan, splitBottomPan) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: { ...clip, splitTopPan, splitBottomPan },
        },
      };
    });
  },

  swapSplitPans: () => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      const top = clip.splitTopPan ?? 22;
      const bottom = clip.splitBottomPan ?? 78;
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: { ...clip, splitTopPan: bottom, splitBottomPan: top },
        },
      };
    });
  },

  autoTrackActiveClipFaces: async () => {
    const { currentMedia, activeClipId, clipEditsById, isRendering } = get();
    if (!currentMedia || !activeClipId || isRendering) return;
    const clip = clipEditsById[activeClipId];
    if (!clip) return;

    set({ isAutoTracking: true, errorMessage: null });
    try {
      const data = await autoTrackPan(currentMedia.id, clip.startTime, clip.endTime);
      if (Array.isArray(data.pan_keyframes) && data.pan_keyframes.length > 0) {
        get().updateActivePanKeyframes(data.pan_keyframes);
      }
    } catch (err: any) {
      set({ errorMessage: err?.message || 'Face tracking analysis failed.' });
    } finally {
      set({ isAutoTracking: false });
    }
  },
});
