import { remixMotion } from '../../api';
import { MotionEvent } from '../../types';
import { SliceCreator } from '../types';

export interface MotionSlice {
  selectedBeatIdx: number;
  isRemixing: boolean;
  setSelectedBeatIdx: (idx: number) => void;
  updateActiveMotionEvents: (events: MotionEvent[]) => void;
  aiRemixActiveClipMotion: () => Promise<void>;
  clearAllMotionEvents: () => void;
}

export const createMotionSlice: SliceCreator<MotionSlice> = (set, get) => ({
  selectedBeatIdx: 0,
  isRemixing: false,

  setSelectedBeatIdx: (selectedBeatIdx: number) => {
    set({ selectedBeatIdx: Math.max(0, selectedBeatIdx) });
  },

  updateActiveMotionEvents: (motionEvents) => {
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
            motionEvents,
            cleanSpeakerMode: motionEvents.length === 0,
          },
        },
      };
    });
  },

  clearAllMotionEvents: () => {
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
            motionEvents: [],
            cleanSpeakerMode: true,
          },
        },
      };
    });
  },

  aiRemixActiveClipMotion: async () => {
    const { currentMedia, activeClipId, clipEditsById, isRendering } = get();
    if (!currentMedia || !activeClipId || isRendering) return;
    const clip = clipEditsById[activeClipId];
    if (!clip) return;

    set({ isRemixing: true, errorMessage: null });
    try {
      const data = await remixMotion({
        media_id: currentMedia.id,
        start_time: clip.startTime,
        end_time: clip.endTime,
        viral_title: clip.title,
        variation_seed: Math.floor(Math.random() * 900000) + 1000,
      });
      if (data.success && Array.isArray(data.motion_events)) {
        get().pushUndoSnapshot();
        set((state) => {
          const c = state.clipEditsById[activeClipId];
          if (!c) return state;
          return {
            clipEditsById: {
              ...state.clipEditsById,
              [activeClipId]: {
                ...c,
                motionEvents: data.motion_events,
                cleanSpeakerMode: false,
              },
            },
          };
        });
      }
    } catch (err: any) {
      set({ errorMessage: err?.message || 'AI Motion Remix failed.' });
    } finally {
      set({ isRemixing: false });
    }
  },
});
