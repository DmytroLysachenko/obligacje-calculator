import { NewEconomicIndicator } from "@/db/schema";

export interface StandardizedIndicator {
  name: string;
  value: number;
  date: string; // YYYY-MM-DD
  metadata?: Record<string, unknown>;
}

export abstract class BaseApiClient {
  abstract fetchLatestData(): Promise<StandardizedIndicator[]>;
  abstract fetchHistoricalData(startDate: string): Promise<StandardizedIndicator[]>;

  protected mapToDbSchema(indicators: StandardizedIndicator[]): NewEconomicIndicator[] {
    return indicators.map(ind => ({
      indicatorName: ind.name,
      value: ind.value,
      date: ind.date,
      metadata: ind.metadata,
    }));
  }
}
