import { SyncProvider, SyncRecord } from "../types";

interface NbpGoldData {
  data: string;
  cena: number;
}

export class NbpSyncProvider implements SyncProvider {
  name = "NBP API";
  private baseUrl = "https://api.nbp.pl/api";

  async fetchData(startDate: string, endDate: string): Promise<SyncRecord[]> {
    const results: SyncRecord[] = [];

    try {
      const goldData = await this.fetchNbpSeries<NbpGoldData[]>(`${this.baseUrl}/cenyzlota/${startDate}/${endDate}`);
      results.push(...goldData.map((d: NbpGoldData) => ({
        indicatorName: 'gold_price',
        date: d.data,
        value: d.cena
      })));
    } catch (error) {
      console.warn("[NBP Provider] Failed to fetch gold price series:", error);
    }

    return results;
  }

  private async fetchNbpSeries<T>(url: string): Promise<T | []> {
    const response = await fetch(`${url}?format=json`);
    if (!response.ok) return [];
    return await response.json();
  }
}
