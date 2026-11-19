import { ClipEditState } from '../../types';
import { SliceCreator } from '../types';

const MAX_HISTORY = 30;

export interface HistorySlice {
  undoStack: ClipEditState[];
  redoStack: ClipEditState[];
  canUndo: boolean;
  canRedo: boolean;
  pushUndoSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

export const createHistorySlice: SliceCreator<HistorySlice> = (set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  pushUndoSnapshot: () => {
    const { activeClipId, clipEditsById, isRendering } = get();
    if (!activeClipId || isRendering) return;
    const current = clipEditsById[activeClipId];
    if (!current) return;

    // Deep clone snapshot to prevent mutating reference
    const snapshot: ClipEditState = JSON.parse(JSON.stringify(current));
    set((state) => {
      const nextUndo = [snapshot, ...state.undoStack].slice(0, MAX_HISTORY);
      return {
        undoStack: nextUndo,
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  undo: () => {
    const { activeClipId, clipEditsById, undoStack, redoStack, isRendering } = get();
    if (!activeClipId || isRendering || undoStack.length === 0) return;
    const current = clipEditsById[activeClipId];
    if (!current) return;

    const [targetState, ...restUndo] = undoStack;
    const currentSnapshot: ClipEditState = JSON.parse(JSON.stringify(current));

    set({
      undoStack: restUndo,
      redoStack: [currentSnapshot, ...redoStack].slice(0, MAX_HISTORY),
      canUndo: restUndo.length > 0,
      canRedo: true,
      clipEditsById: {
        ...clipEditsById,
        [activeClipId]: targetState,
      },
    });
  },

  redo: () => {
    const { activeClipId, clipEditsById, undoStack, redoStack, isRendering } = get();
    if (!activeClipId || isRendering || redoStack.length === 0) return;
    const current = clipEditsById[activeClipId];
    if (!current) return;

    const [targetState, ...restRedo] = redoStack;
    const currentSnapshot: ClipEditState = JSON.parse(JSON.stringify(current));

    set({
      undoStack: [currentSnapshot, ...undoStack].slice(0, MAX_HISTORY),
      redoStack: restRedo,
      canUndo: true,
      canRedo: restRedo.length > 0,
      clipEditsById: {
        ...clipEditsById,
        [activeClipId]: targetState,
      },
    });
  },
});
