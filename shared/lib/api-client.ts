import { ApiResponse } from '@/shared/types/api';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface ApiRequestOptions {
  signal?: AbortSignal;
  headers?: HeadersInit;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.error) {
    throw new ApiClientError(
      payload.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload.error?.code,
      payload.error?.details,
    );
  }

  return payload.data as T;
}

export async function apiGet<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: options.headers,
    signal: options.signal,
  });

  return parseApiResponse<T>(response);
}

export async function apiGetWithResponse<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<{ data: T; response: Response }> {
  const response = await fetch(url, {
    method: 'GET',
    headers: options.headers,
    signal: options.signal,
  });

  return {
    data: await parseApiResponse<T>(response),
    response,
  };
}

export async function apiPost<T>(
  url: string,
  payload: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  return parseApiResponse<T>(response);
}

export async function apiPatch<T>(
  url: string,
  payload: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  return parseApiResponse<T>(response);
}

export async function apiDelete<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: options.headers,
    signal: options.signal,
  });

  return parseApiResponse<T>(response);
}
