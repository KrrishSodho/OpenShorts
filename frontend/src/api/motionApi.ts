import { requestJson } from './client';
import { ClipManifest, MotionEvent, PanKeyframe } from '../types';

export interface PrepareClipPayload {
  media_id: string;
  start_time: number;
  end_time: number;
  preset_id: string;
  custom_title?: string;
  motion_events?: MotionEvent[];
  crop_focus?: string;
  pan_keyframes?: PanKeyframe[];
  framing_layout?: 'single' | 'split' | 'trio_rotate';
  split_top_pan?: number;
  split_bottom_pan?: number;
  split_zoom?: number;
  trio_left_pan?: number;
  trio_right_pan?: number;
  clean_speaker_mode?: boolean;
}

export interface PrepareClipResponse {
  success: boolean;
  clip_manifest: ClipManifest;
}

export interface AutoTrackResponse {
  pan_keyframes: PanKeyframe[];
}

export interface RemixMotionResponse {
  success: boolean;
  variation_seed: number;
  motion_events: MotionEvent[];
}

export async function prepareClip(
  payload: PrepareClipPayload,
  signal?: AbortSignal
): Promise<PrepareClipResponse> {
  return requestJson<PrepareClipResponse>('/api/prepare-clip', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}

export async function autoTrackPan(
  mediaId: string,
  startTime: number,
  endTime: number
): Promise<AutoTrackResponse> {
  return requestJson<AutoTrackResponse>('/api/auto-track-pan', {
    method: 'POST',
    body: JSON.stringify({
      media_id: mediaId,
      start_time: startTime,
      end_time: endTime,
    }),
  });
}

export async function remixMotion(payload: {
  media_id: string;
  start_time: number;
  end_time: number;
  viral_title: string;
  variation_seed?: number;
}): Promise<RemixMotionResponse> {
  return requestJson<RemixMotionResponse>('/api/remix-motion', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
