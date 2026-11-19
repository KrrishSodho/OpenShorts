import { requestJson } from './client';
import { RenderStatusResponse } from '../types';

export interface TriggerExportPayload {
  clip_id: string;
  input_props: Record<string, unknown>;
  fps?: number;
}

export interface TriggerExportResponse {
  success: boolean;
  render_id: string;
  status: string;
}

export async function triggerRenderExport(
  payload: TriggerExportPayload
): Promise<TriggerExportResponse> {
  return requestJson<TriggerExportResponse>('/api/render-export', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelRenderExport(renderId: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(`/api/render-cancel/${renderId}`, {
    method: 'POST',
  });
}

export async function fetchRenderStatus(renderId: string): Promise<RenderStatusResponse> {
  return requestJson<RenderStatusResponse>(`/api/render-status/${renderId}`);
}
