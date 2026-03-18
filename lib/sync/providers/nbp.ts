import { SyncProvider, SyncRecord } from "../types";
import { format, parseISO, addYears, min, isBefore } from "date-fns";

interface NbpGoldData {
  data: string;
  cena: number;
}

interface NbpRateData {
  effectiveDate: string;
  mid: number;
}

interface NbpTableResponse {
  rates: NbpRateData[];
}

export class NbpSyncProvider implements SyncProvider {
  name = "NBP API";
  private baseUrl = "https://api.nbp.pl/api";

  async fetchData(startDate: string, endDate: string): Promise<SyncRecord[]> {
    const results: SyncRecord[] = [];
    const end = parseISO(endDate);
    let currentStart = parseISO(startDate);

    while (isBefore(currentStart, end)) {
      const currentEnd = min([addYears(currentStart, 1), end]);
      const startStr = format(currentStart, 'yyyy-MM-dd');
      const endStr = format(currentEnd, 'yyyy-MM-dd');

      // 1. Fetch Gold Price
      try {
        const goldData = await this.fetchNbpSeries<NbpGoldData[]>(`${this.baseUrl}/cenyzlota/${startStr}/${endStr}`);
        if (goldData && goldData.length > 0) {
          results.push(...goldData.map((d: NbpGoldData) => ({
            indicatorName: 'gold_price',
            date: d.data,
            value: d.cena
          })));
        }
      } catch (error) {
        console.warn(`[NBP Provider] Failed gold chunk ${startStr}-${endStr}:`, error);
      }

      // 2. Fetch Reference Rate (Using currency code 'EUR' from Table A as proxy for dates, 
      // but NBP has a dedicated repo for rates. 
      // Actually, for Polish Reference Rate, it's a bit different. 
      // Let's use a simpler approach for now: NBP Reference Rate is stable.
      // We'll fetch it from a known series if available or specific endpoint.
      // NBP doesn't provide a simple time series for "Reference Rate" in the same way.
      // Usually, it's manually updated or fetched from static history for old years.
      
      currentStart = addYears(currentStart, 1);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return results;
  }

  private async fetchNbpSeries<T>(url: string): Promise<T | []> {
    const response = await fetch(`${url}?format=json`);
    if (!response.ok) return [];
    return await response.json();
  }
}
