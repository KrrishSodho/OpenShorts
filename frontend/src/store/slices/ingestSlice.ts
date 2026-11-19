import { triggerIngest, uploadMediaFile, cancelJob, loadRecentEpisode } from '../../api';
import { JobResultPayload, ViralClipRecommendation, ClipEditState } from '../../types';
import { PipelineState, SliceCreator } from '../types';
import { stopSfxAudioPreview } from '../../utils/audioPreview';

export interface IngestSlice {
  pipelineState: PipelineState;
  activeJobId: string | null;
  jobProgress: number;
  jobStep: string;
  isLoadModalOpen: boolean;

  setLoadModalOpen: (open: boolean) => void;
  startYoutubeIngest: (url: string, customScript?: string) => Promise<void>;
  startLocalPathIngest: (path: string, customScript?: string) => Promise<void>;
  startFileUploadIngest: (file: File) => Promise<void>;
  loadExistingEpisode: (mediaId: string) => Promise<void>;
  cancelIngestJob: () => Promise<void>;
  setJobProgressState: (progress: number, step: string) => void;
  completeIngestJob: (result: JobResultPayload) => void;
  failIngestJob: (error: string) => void;
}

function resolveClipId(mediaId: string, clip: ViralClipRecommendation): string {
  if (clip.clip_id) return clip.clip_id;
  return `${mediaId}_${Math.round(clip.start_time * 10)}_${Math.round(clip.end_time * 10)}`;
}

export const createIngestSlice: SliceCreator<IngestSlice> = (set, get) => ({
  pipelineState: 'IDLE',
  activeJobId: null,
  jobProgress: 0,
  jobStep: '',
  isLoadModalOpen: false,

  setLoadModalOpen: (open) => {
    if (get().isRendering) return;
    set({ isLoadModalOpen: open });
  },

  startYoutubeIngest: async (url, customScript) => {
    const { selectedPreset, isRendering } = get();
    if (isRendering) return;
    stopSfxAudioPreview();
    set({
      errorMessage: null,
      pipelineState: 'PROCESSING',
      jobProgress: 5,
      jobStep: 'Queueing YouTube download: 5%',
      activeJobId: null,
      currentMedia: null,
      activeClipId: null,
      clipEditsById: {},
      recommendedClips: [],
      transcript: null,
      currentPlaySec: 0,
      selectedBeatIdx: 0,
      isPreparingClip: false,
    });
    try {
      const data = await triggerIngest({
        url: url.trim(),
        custom_script: customScript?.trim() || undefined,
        preset_id: selectedPreset?.id,
        variation_seed: Math.floor(Math.random() * 900000) + 1000,
      });
      set({
        activeJobId: data.job_id,
        jobProgress: 10,
        jobStep: 'Downloading from YouTube: 10%',
      });
    } catch (err: any) {
      set({
        pipelineState: 'ERROR',
        errorMessage: err?.message || 'Unable to start YouTube ingestion.',
      });
    }
  },

  startLocalPathIngest: async (path, customScript) => {
    const { selectedPreset, isRendering } = get();
    if (isRendering) return;
    stopSfxAudioPreview();
    set({
      errorMessage: null,
      pipelineState: 'PROCESSING',
      jobProgress: 5,
      jobStep: 'Loading local video file: 5%',
      activeJobId: null,
      currentMedia: null,
      activeClipId: null,
      clipEditsById: {},
      recommendedClips: [],
      transcript: null,
      currentPlaySec: 0,
      selectedBeatIdx: 0,
      isPreparingClip: false,
    });
    try {
      const data = await triggerIngest({
        local_path: path.trim(),
        custom_script: customScript?.trim() || undefined,
        preset_id: selectedPreset?.id,
        variation_seed: Math.floor(Math.random() * 900000) + 1000,
      });
      set({
        activeJobId: data.job_id,
        jobProgress: 15,
        jobStep: 'Extracting audio from video: 15%',
      });
    } catch (err: any) {
      set({
        pipelineState: 'ERROR',
        errorMessage: err?.message || 'Unable to load local video file.',
      });
    }
  },

  startFileUploadIngest: async (file) => {
    if (get().isRendering) return;
    stopSfxAudioPreview();
    set({
      errorMessage: null,
      pipelineState: 'PROCESSING',
      jobProgress: 5,
      jobStep: `Streaming ${file.name} to server...`,
      activeJobId: null,
      currentMedia: null,
      activeClipId: null,
      clipEditsById: {},
      recommendedClips: [],
      transcript: null,
      currentPlaySec: 0,
      selectedBeatIdx: 0,
      isPreparingClip: false,
    });
    try {
      const data = await uploadMediaFile(file);
      set({
        activeJobId: data.job_id,
        jobProgress: 12,
        jobStep: 'Extracting 16kHz audio: 12%',
      });
    } catch (err: any) {
      set({
        pipelineState: 'ERROR',
        errorMessage: err?.message || 'Unable to upload local video file.',
      });
    }
  },

  cancelIngestJob: async () => {
    const { activeJobId } = get();
    if (activeJobId) {
      try {
        await cancelJob(activeJobId);
      } catch (e) {
        console.warn('Failed to cancel job:', e);
      }
    }
    set({
      pipelineState: 'IDLE',
      activeJobId: null,
      jobProgress: 0,
      jobStep: '',
    });
  },

  loadExistingEpisode: async (mediaId: string) => {
    const { isRendering, completeIngestJob } = get();
    if (isRendering) return;
    stopSfxAudioPreview();
    set({
      errorMessage: null,
      pipelineState: 'PROCESSING',
      jobProgress: 50,
      jobStep: 'Loading saved episode & viral shorts: 50%',
      activeJobId: null,
      currentMedia: null,
      activeClipId: null,
      clipEditsById: {},
      recommendedClips: [],
      transcript: null,
      currentPlaySec: 0,
      selectedBeatIdx: 0,
      isPreparingClip: false,
    });
    try {
      const result = await loadRecentEpisode(mediaId);
      completeIngestJob(result);
    } catch (err: any) {
      set({
        pipelineState: 'ERROR',
        errorMessage: err?.message || 'Failed loading saved episode.',
      });
    }
  },

  setJobProgressState: (jobProgress, jobStep) => set({ jobProgress, jobStep }),

  completeIngestJob: (result) => {
    const {
      media,
      transcript,
      niche,
      viral_title,
      best_clip,
      motion_events,
      recommended_clips,
      clip_manifest,
    } = result;

    const firstClipId = clip_manifest.clip_id;
    const initialEdits: Record<string, ClipEditState> = {};

    const primaryEdit: ClipEditState = {
      clipId: firstClipId,
      startTime: best_clip.start_time,
      endTime: best_clip.end_time,
      title: viral_title || clip_manifest.title || '',
      showTopHook: true,
      reasoning: best_clip.reasoning || '',
      motionEvents: motion_events || clip_manifest.motion_events || [],
      panKeyframes:
        clip_manifest.pan_keyframes && clip_manifest.pan_keyframes.length > 0
          ? clip_manifest.pan_keyframes
          : [{ t: 0, pan: 50 }],
      words: clip_manifest.words || [],
      videoUrl: clip_manifest.video_url,
      framingLayout: clip_manifest.framing_layout || 'single',
      splitTopPan: clip_manifest.split_top_pan ?? 22,
      splitBottomPan: clip_manifest.split_bottom_pan ?? 78,
      splitZoom: clip_manifest.split_zoom ?? 1.55,
      trioLeftPan: clip_manifest.trio_left_pan ?? 18,
      trioRightPan: clip_manifest.trio_right_pan ?? 82,
      cleanSpeakerMode: clip_manifest.clean_speaker_mode ?? false,
    };
    initialEdits[firstClipId] = primaryEdit;

    (recommended_clips || []).forEach((rc, idx) => {
      const cid = resolveClipId(media.id, rc);
      if (idx === 0 || cid === firstClipId) {
        initialEdits[cid] = {
          ...primaryEdit,
          clipId: cid,
        };
      } else {
        initialEdits[cid] = {
          clipId: cid,
          startTime: rc.start_time,
          endTime: rc.end_time,
          title: rc.title || '',
          showTopHook: true,
          reasoning: rc.reasoning || '',
          motionEvents: rc.motion_events || [],
          panKeyframes: rc.pan_keyframes || [],
          words: [],
          videoUrl: '',
          cleanSpeakerMode: false,
        };
      }
    });

    try {
      localStorage.setItem('viral_studio_last_session', JSON.stringify(result));
    } catch {
      // ignore localStorage quota
    }

    set({
      pipelineState: 'READY',
      activeJobId: null,
      isLoadModalOpen: false,
      currentMedia: media,
      transcript,
      detectedNiche: niche || '',
      recommendedClips: recommended_clips || [],
      activeClipId: firstClipId,
      clipEditsById: initialEdits,
      currentPlaySec: 0,
      isPreparingClip: false,
      errorMessage: null,
    });
  },

  failIngestJob: (error) =>
    set({
      pipelineState: 'ERROR',
      activeJobId: null,
      errorMessage: error,
    }),
});
