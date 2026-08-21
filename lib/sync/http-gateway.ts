export interface SyncHttpRequestOptions extends RequestInit {
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  maxBytes?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const ALLOWED_HOSTS = new Set([
  'api.nbp.pl',
  'query1.finance.yahoo.com',
  'stat.gov.pl',
  'www.gov.pl',
  'www.obligacjeskarbowe.pl',
]);
const DEFAULT_HEADERS = {
  'User-Agent': 'obligacje-calculator/1.0',
  Accept: 'application/json',
};

function sanitizeExternalUrl(url: URL) {
  return `${url.protocol}//${url.host}${url.pathname}`;
}

function validateExternalUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('External fetch URL is invalid.');
  }

  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`External fetch target is not permitted: ${sanitizeExternalUrl(url)}`);
  }
  return url;
}

async function readBoundedResponse(response: Response, maxBytes: number) {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > maxBytes) {
    throw new Error('External response exceeds configured byte limit.');
  }
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('External response exceeds configured byte limit.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export async function fetchSyncResponse(rawUrl: string, options: SyncHttpRequestOptions = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    throwOnHttpError = true,
    maxBytes = DEFAULT_MAX_RESPONSE_BYTES,
    headers,
    ...requestOptions
  } = options;
  const url = validateExternalUrl(rawUrl);
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError('maxBytes must be a positive safe integer.');
  }
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
      redirect: 'error',
    });

    if (throwOnHttpError && !response.ok) {
      throw new Error(
        `External fetch failed: ${response.status} ${response.statusText} for ${sanitizeExternalUrl(url)}`,
      );
    }

    const body = await readBoundedResponse(response, maxBytes);
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSyncJson<T>(url: string, options?: SyncHttpRequestOptions): Promise<T> {
  const response = await fetchSyncResponse(url, options);
  const contentType = response.headers.get('content-type') ?? '';
  if (!/^application\/(?:json|[a-z0-9!#$&^_.+-]+\+json)(?:\s*;|$)/i.test(contentType)) {
    throw new Error('External response must use a JSON content type.');
  }
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
