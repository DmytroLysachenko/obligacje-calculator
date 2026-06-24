export interface SyncHttpRequestOptions extends RequestInit {
  timeoutMs?: number;
  throwOnHttpError?: boolean;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_HEADERS = {
  'User-Agent': 'obligacje-calculator/1.0',
  Accept: 'application/json',
};

export async function fetchSyncResponse(url: string, options: SyncHttpRequestOptions = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    throwOnHttpError = true,
    headers,
    ...requestOptions
  } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
      signal: controller.signal,
    });

    if (throwOnHttpError && !response.ok) {
      throw new Error(
        `External fetch failed: ${response.status} ${response.statusText} for ${url}`,
      );
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSyncJson<T>(url: string, options?: SyncHttpRequestOptions): Promise<T> {
  const response = await fetchSyncResponse(url, options);
  return (await response.json()) as T;
}

export async function fetchSyncText(url: string, options?: SyncHttpRequestOptions) {
  const response = await fetchSyncResponse(url, options);
  return await response.text();
}

export async function fetchSyncArrayBuffer(url: string, options?: SyncHttpRequestOptions) {
  const response = await fetchSyncResponse(url, options);
  return await response.arrayBuffer();
}
