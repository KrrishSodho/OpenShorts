import { StateCreator } from 'zustand';
import {
  MediaInfo,
  TranscriptData,
  ViralClipRecommendation,
  PresetConfig,
  MotionEvent,
  PanKeyframe,
  SubtitleConfig,
  ClipEditState,
  ExportHistoryItem,
  JobResultPayload,
} from '../types';

export type PipelineState = 'IDLE' | 'PROCESSING' | 'READY' | 'ERROR';

export interface StudioState {
  apiStatus: 'online' | 'connecting' | 'offline';
  presets: PresetConfig[];
  selectedPreset: PresetConfig | null;
  fps: 30 | 60;
  videoVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  masterMuted: boolean;
  themeAccentOverride: string | null;

  pipelineState: PipelineState;
  activeJobId: string | null;
  jobProgress: number;
  jobStep: string;
  errorMessage: string | null;
  isLoadModalOpen: boolean;

  currentMedia: MediaInfo | null;
  transcript: TranscriptData | null;
  detectedNiche: string;
  recommendedClips: ViralClipRecommendation[];
  activeClipId: string | null;
  isPreparingClip: boolean;
  isAutoTracking: boolean;
  isRemixing: boolean;
  selectedBeatIdx: number;

  clipEditsById: Record<string, ClipEditState>;
  subtitleConfig: SubtitleConfig;
  currentPlaySec: number;

  undoStack: ClipEditState[];
  redoStack: ClipEditState[];
  canUndo: boolean;
  canRedo: boolean;

  activeRenderId: string | null;
  isRendering: boolean;
  renderProgress: number;
  renderStep: string;
  renderEtaSec: number;
  renderElapsedSec: number;
  exportHistory: ExportHistoryItem[];
}

export interface StudioActions {
  initBackend: () => Promise<void>;
  setLoadModalOpen: (open: boolean) => void;
  setErrorMessage: (msg: string | null) => void;
  setSelectedPreset: (preset: PresetConfig) => void;
  setFps: (fps: 30 | 60) => void;
  setVideoVolume: (vol: number) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setSfxVolume: (vol: number) => void;
  setMasterMuted: (muted: boolean) => void;
  setThemeAccentOverride: (color: string | null) => void;
  setSubtitleConfig: (patch: Partial<SubtitleConfig>) => void;
  setCurrentPlaySec: (sec: number) => void;

  startYoutubeIngest: (url: string, customScript?: string) => Promise<void>;
  startLocalPathIngest: (path: string, customScript?: string) => Promise<void>;
  startFileUploadIngest: (file: File) => Promise<void>;
  loadExistingEpisode: (mediaId: string) => Promise<void>;
  cancelIngestJob: () => Promise<void>;
  setJobProgressState: (progress: number, step: string) => void;
  completeIngestJob: (result: JobResultPayload) => void;
  failIngestJob: (error: string) => void;

  selectShort: (clip: ViralClipRecommendation) => Promise<void>;
  setSelectedBeatIdx: (idx: number) => void;
  updateActiveClipTrim: (trimStart: number, trimEnd: number) => void;
  updateActiveClipTitle: (title: string) => void;
  toggleActiveTopHook: (show: boolean) => void;
  updateActiveHookStyle: (style: {
    hookSize?: 'sm' | 'md' | 'lg';
    hookTextColor?: string | null;
    hookBgColor?: string | null;
  }) => void;
  updateActiveMotionEvents: (events: MotionEvent[]) => void;
  updateActivePanKeyframes: (kfs: PanKeyframe[]) => void;
  setFramingLayoutMode: (mode: 'single' | 'split' | 'trio_rotate') => void;
  setSplitPans: (topPan: number, bottomPan: number) => void;
  swapSplitPans: () => void;
  setSplitZoom: (zoom: number) => void;
  setTrioPans: (primaryPan: number, leftPan: number, rightPan: number) => void;
  setCleanSpeakerMode: (clean: boolean) => void;
  updateClipWordText: (wordIndex: number, newWord: string) => void;
  autoTrackActiveClipFaces: () => Promise<void>;
  aiRemixActiveClipMotion: () => Promise<void>;
  clearAllMotionEvents: () => void;

  pushUndoSnapshot: () => void;
  undo: () => void;
  redo: () => void;

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

export type StudioStore = StudioState & StudioActions;

export type SliceCreator<T> = StateCreator<StudioStore, [], [], T>;
