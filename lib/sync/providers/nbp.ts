import { addYears, format, isBefore, min, parseISO } from 'date-fns';

import { fetchSyncResponse } from '../http-gateway';
import { createSyncLogger } from '../sync-logger';
import { SyncProvider, SyncRecord } from '../types';

interface NbpGoldData {
  data: string;
  cena: number;
}

export class NbpSyncProvider implements SyncProvider {
  name = 'NBP Gold API';
  seriesSlug = 'gold-usd';
  private baseUrl = 'https://api.nbp.pl/api';
  private readonly logger = createSyncLogger('NbpProvider');

  async fetchData(startDate: string, endDate: string): Promise<SyncRecord[]> {
    const results: SyncRecord[] = [];
    const end = parseISO(endDate);
    let currentStart = parseISO(startDate);

    while (isBefore(currentStart, end)) {
      const currentEnd = min([addYears(currentStart, 1), end]);
      const startStr = format(currentStart, 'yyyy-MM-dd');
      const endStr = format(currentEnd, 'yyyy-MM-dd');

      try {
        const goldData = await this.fetchNbpSeries<NbpGoldData[]>(
          `${this.baseUrl}/cenyzlota/${startStr}/${endStr}`,
        );
        if (goldData && goldData.length > 0) {
          results.push(
            ...goldData.map((d: NbpGoldData) => ({
              seriesSlug: 'gold-usd',
              date: d.data,
              value: d.cena,
            })),
          );
        }
      } catch (error) {
        this.logger.warn(`Failed gold chunk ${startStr}-${endStr}`, error);
      }

      currentStart = addYears(currentStart, 1);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return results;
  }

  private async fetchNbpSeries<T>(url: string): Promise<T | []> {
    const response = await fetchSyncResponse(`${url}?format=json`, { throwOnHttpError: false });
    if (!response.ok) return [];
    return await response.json();
  }
}
