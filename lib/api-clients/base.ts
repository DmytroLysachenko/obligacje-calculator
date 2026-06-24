import { fetchSyncResponse } from '@/lib/sync/http-gateway';

export interface StandardizedIndicator {
  name: string;
  value: number;
  date: string; // YYYY-MM-DD
  metadata?: Record<string, unknown>;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
  return fetchSyncResponse(url, { ...options, timeoutMs });
}

export abstract class BaseApiClient {
  abstract fetchLatestData(): Promise<StandardizedIndicator[]>;
  abstract fetchHistoricalData(startDate: string): Promise<StandardizedIndicator[]>;
}
