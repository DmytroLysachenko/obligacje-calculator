import { ApiResponse } from '../types/api';

export interface CalculationClientErrorPayload {
  error?: string;
  details?: unknown;
}

export class CalculationClientError extends Error {
  details?: unknown;
  code?: string;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'CalculationClientError';
    this.code = code;
    this.details = details;
  }
}

export async function postCalculation<TResponse>(
  url: string, 
  payload: unknown, 
  signal?: AbortSignal
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  const result: ApiResponse<TResponse> = await response.json();

  if (!response.ok || result.error) {
    throw new CalculationClientError(
      result.error?.message ?? 'Calculation failed', 
      result.error?.code,
      result.error?.details
    );
  }

  return result.data as TResponse;
}
