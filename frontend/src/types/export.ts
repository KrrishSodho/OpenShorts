import { SubtitleStyleId } from './captions';

export interface ExportHistoryItem {
  renderId: string;
  version: number;
  clipId: string;
  title: string;
  subtitleStyle: SubtitleStyleId;
  presetName: string;
  downloadUrl: string;
  filename: string;
  createdAt: string;
  thumbnailUrl?: string | null;
  fileSizeBytes?: number;
  durationSec?: number;
}

export interface RenderStatusResponse {
  render_id: string;
  status: 'rendering' | 'completed' | 'cancelled' | 'failed';
  progress: number;
  step: string;
  eta_sec: number;
  elapsed_sec?: number;
  download_url?: string | null;
  filename?: string | null;
  thumbnail_url?: string | null;
  file_size_bytes?: number;
  duration_sec?: number;
  error?: string | null;
}
