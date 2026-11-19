export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function requestJson<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  const mergedHeaders: Record<string, string> = {};

  if (!isFormData) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  if (options?.headers) {
    if (typeof Headers !== 'undefined' && options.headers instanceof Headers) {
      options.headers.forEach((val, key) => {
        mergedHeaders[key] = val;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, val]) => {
        mergedHeaders[key] = val;
      });
    } else {
      Object.assign(mergedHeaders, options.headers);
    }
  }

  const res = await fetch(endpoint, {
    ...options,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    let errDetail = `HTTP ${res.status} ${res.statusText}`;
    let errData: unknown;
    try {
      const text = await res.text();
      if (text) {
        try {
          errData = JSON.parse(text);
          if (typeof errData === 'object' && errData !== null && 'detail' in errData) {
            errDetail = String((errData as { detail: unknown }).detail);
          }
        } catch {
          errDetail = text;
        }
      }
    } catch {
      // Body reading failed
    }
    throw new ApiError(errDetail, res.status, errData);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const rawText = await res.text();
  if (!rawText || !rawText.trim()) {
    return {} as T;
  }

  return JSON.parse(rawText) as T;
}
