import { GusCpiApiClient, type GusCpiPoint } from '../../api-clients/gus-cpi';
import { SyncProvider, SyncRecord } from '../types';

export class GusSyncProvider implements SyncProvider {
  name = 'GUS CPI Archive';
  seriesSlug = 'pl-cpi';
  private client = new GusCpiApiClient();

  async fetchData(startDate: string, endDate: string): Promise<SyncRecord[]> {
    const points = await this.client.fetchHistoricalData(startDate, endDate);
    return points.map((point: GusCpiPoint) => ({
      seriesSlug: this.seriesSlug,
      date: point.date,
      value: point.value,
    }));
  }
}
