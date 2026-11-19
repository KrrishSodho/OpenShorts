import { SubtitleConfig } from '../../types';
import { SliceCreator } from '../types';

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  style: 'tape_crimson',
  fontSize: 'md',
  position: 'bottom',
  maxWordsPerPhrase: 3,
  uppercase: true,
  highlightColor: 'yellow',
};

export interface CaptionSlice {
  subtitleConfig: SubtitleConfig;
  setSubtitleConfig: (patch: Partial<SubtitleConfig>) => void;
  updateClipWordText: (wordIndex: number, newWord: string) => void;
}

export const createCaptionSlice: SliceCreator<CaptionSlice> = (set, get) => ({
  subtitleConfig: DEFAULT_SUBTITLE_CONFIG,

  setSubtitleConfig: (patch) => {
    if (get().isRendering) return;
    set((state) => ({
      subtitleConfig: { ...state.subtitleConfig, ...patch },
    }));
  },

  updateClipWordText: (wordIndex, newWord) => {
    const { activeClipId, isRendering } = get();
    if (!activeClipId || isRendering) return;
    get().pushUndoSnapshot();
    set((state) => {
      const clip = state.clipEditsById[activeClipId];
      if (!clip) return state;
      const nextWords = clip.words.map((w, idx) =>
        idx === wordIndex ? { ...w, word: newWord } : w
      );
      return {
        clipEditsById: {
          ...state.clipEditsById,
          [activeClipId]: { ...clip, words: nextWords },
        },
      };
    });
  },
});
