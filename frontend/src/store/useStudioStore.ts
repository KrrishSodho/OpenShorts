import { create } from 'zustand';
import { StudioStore } from './types';
import { createMediaSlice } from './slices/mediaSlice';
import { createIngestSlice } from './slices/ingestSlice';
import { createClipSlice } from './slices/clipSlice';
import { createMotionSlice } from './slices/motionSlice';
import { createCaptionSlice, DEFAULT_SUBTITLE_CONFIG } from './slices/captionSlice';
import { createExportSlice } from './slices/exportSlice';
import { createUiSlice } from './slices/uiSlice';
import { createHistorySlice } from './slices/historySlice';

export { DEFAULT_SUBTITLE_CONFIG };
export type { PipelineState, StudioStore, StudioState, StudioActions } from './types';

export const useStudioStore = create<StudioStore>((...a) => ({
  ...createMediaSlice(...a),
  ...createIngestSlice(...a),
  ...createClipSlice(...a),
  ...createMotionSlice(...a),
  ...createCaptionSlice(...a),
  ...createExportSlice(...a),
  ...createUiSlice(...a),
  ...createHistorySlice(...a),
}));
