export interface CalculationClientErrorPayload {
  error?: string;
  details?: unknown;
}

export class CalculationClientError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'CalculationClientError';
    this.details = details;
  }
}

export async function postCalculation<TResponse>(url: string, payload: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorPayload: CalculationClientErrorPayload | undefined;
    try {
      errorPayload = (await response.json()) as CalculationClientErrorPayload;
    } catch {
      errorPayload = undefined;
    }

    throw new CalculationClientError(errorPayload?.error ?? 'Calculation failed', errorPayload?.details);
  }

  return (await response.json()) as TResponse;
}
