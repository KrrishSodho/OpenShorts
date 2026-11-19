import { SliceCreator } from '../types';

export interface UiSlice {
  currentPlaySec: number;
  errorMessage: string | null;

  setCurrentPlaySec: (sec: number) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  currentPlaySec: 0,
  errorMessage: null,

  setCurrentPlaySec: (currentPlaySec) => set({ currentPlaySec }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
});
