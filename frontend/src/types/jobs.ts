import { MediaInfo, TranscriptData, TranscriptWord } from './media';
import { MotionEvent, PanKeyframe } from './motion';
import { PresetConfig } from './presets';

export interface ViralClipRecommendation {
  clip_id?: string;
  rank?: number;
  title: string;
  start_time: number;
  end_time: number;
  duration?: number;
  hook_sentence?: string;
  hook_score?: number;
  viral_score?: number;
  angle_tag?: string;
  topic_pill?: string;
  reasoning?: string;
  transcript_preview?: string;
  visual_keywords?: string[];
  spoken_keywords?: string[];
  suggested_pan_percent?: number;
  pan_keyframes?: PanKeyframe[];
  motion_events?: MotionEvent[];
}

export interface ClipEditState {
  clipId: string;
  startTime: number;
  endTime: number;
  trimStart?: number;
  trimEnd?: number;
  title: string;
  showTopHook: boolean;
  hookSize?: 'sm' | 'md' | 'lg';
  hookTextColor?: string | null;
  hookBgColor?: string | null;
  reasoning: string;
  motionEvents: MotionEvent[];
  panKeyframes: PanKeyframe[];
  words: TranscriptWord[];
  videoUrl: string;
  framingLayout?: 'single' | 'split' | 'trio_rotate';
  splitTopPan?: number;
  splitBottomPan?: number;
  splitZoom?: number;
  trioLeftPan?: number;
  trioRightPan?: number;
  cleanSpeakerMode?: boolean;
}

export interface ClipManifest {
  clip_id: string;
  title: string;
  viral_title?: string;
  duration: number;
  start_time: number;
  end_time: number;
  video_url: string;
  words: TranscriptWord[];
  pan_keyframes?: PanKeyframe[];
  motion_events: MotionEvent[];
  framing_layout?: 'single' | 'split' | 'trio_rotate';
  split_top_pan?: number;
  split_bottom_pan?: number;
  split_zoom?: number;
  trio_left_pan?: number;
  trio_right_pan?: number;
  clean_speaker_mode?: boolean;
  preset: PresetConfig;
  render_status: string;
}

export interface JobResultPayload {
  media: MediaInfo;
  transcript: TranscriptData;
  niche: string;
  viral_title: string;
  best_clip: {
    start_time: number;
    end_time: number;
    hook_score: number;
    reasoning: string;
  };
  motion_events: MotionEvent[];
  recommended_clips: ViralClipRecommendation[];
  clip_manifest: ClipManifest;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  step: string;
  error?: string | null;
  result?: JobResultPayload | null;
}
