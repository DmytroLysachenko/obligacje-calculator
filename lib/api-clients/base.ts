export interface StandardizedIndicator {
  name: string;
  value: number;
  date: string; // YYYY-MM-DD
  metadata?: Record<string, unknown>;
}

export abstract class BaseApiClient {
  abstract fetchLatestData(): Promise<StandardizedIndicator[]>;
  abstract fetchHistoricalData(startDate: string): Promise<StandardizedIndicator[]>;
}
