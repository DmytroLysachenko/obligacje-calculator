export interface StandardizedIndicator {
  name: string;
  value: number;
  date: string; // YYYY-MM-DD
  metadata?: Record<string, unknown>;
}

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export abstract class BaseApiClient {
  abstract fetchLatestData(): Promise<StandardizedIndicator[]>;
  abstract fetchHistoricalData(startDate: string): Promise<StandardizedIndicator[]>;
}
