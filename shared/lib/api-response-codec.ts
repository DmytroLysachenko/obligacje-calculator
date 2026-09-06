import { ApiResponse } from '@/shared/types/api';

export class ApiEnvelopeError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiEnvelopeError';
  }
}

export async function decodeEnvelopeResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.error) {
    throw new ApiEnvelopeError(
      payload.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload.error?.code,
      payload.error?.details,
    );
  }

  return payload.data as T;
}

export async function decodeRawResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiEnvelopeError(`Request failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}
