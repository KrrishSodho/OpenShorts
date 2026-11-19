import { requestJson } from './client';
import { JobStatusResponse } from '../types';

export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  return requestJson<JobStatusResponse>(`/api/jobs/${jobId}`);
}

export async function cancelJob(jobId: string): Promise<{ success: boolean; job_id: string; status: string }> {
  return requestJson<{ success: boolean; job_id: string; status: string }>(`/api/jobs/${jobId}/cancel`, {
    method: 'POST',
  });
}
