import { requestJson } from './client';
import { PresetConfig, JobResultPayload } from '../types';

export interface HealthResponse {
  status: string;
  engine: string;
  whisper_ready: boolean;
  ffmpeg_ready: boolean;
  gemini_configured: boolean;
}

export interface RecentEpisodeItem {
  id: string;
  title: string;
  duration: number;
  word_count: number;
  manifest_count: number;
  mtime: number;
  video_path?: string;
}

export interface IngestResponse {
  job_id: string;
  status: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>('/api/health');
}

export async function fetchRecentEpisodes(): Promise<RecentEpisodeItem[]> {
  const data = await requestJson<{ episodes: RecentEpisodeItem[] }>('/api/recent-episodes');
  return data.episodes || [];
}

export async function loadRecentEpisode(mediaId: string): Promise<JobResultPayload> {
  return requestJson<JobResultPayload>(`/api/load-episode/${mediaId}`, {
    method: 'POST',
  });
}

export async function fetchPresets(): Promise<PresetConfig[]> {
  const data = await requestJson<{ presets: PresetConfig[] }>('/api/presets');
  return data.presets || [];
}

export async function triggerIngest(payload: {
  url?: string;
  local_path?: string;
  custom_script?: string;
  use_sample?: boolean;
  preset_id?: string;
  variation_seed?: number;
}): Promise<IngestResponse> {
  return requestJson<IngestResponse>('/api/ingest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadMediaFile(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/ingest/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Upload failed with status ${res.status}`);
  }

  return (await res.json()) as IngestResponse;
}
