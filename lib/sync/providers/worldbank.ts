import { SyncProvider, SyncRecord } from "../types";

interface WorldBankRecord {
  date: string;
  value: string | number | null;
}

export class WorldBankSyncProvider implements SyncProvider {
  name = "World Bank (Inflation)";
  private baseUrl = "https://api.worldbank.org/v2/country/POL/indicator/FP.CPI.TOTL.ZG?format=json";

  async fetchData(startDate: string, endDate: string): Promise<SyncRecord[]> {
    const startYear = startDate.substring(0, 4);
    const endYear = endDate.substring(0, 4);
    
    const response = await fetch(`${this.baseUrl}&date=${startYear}:${endYear}&per_page=100`);
    if (!response.ok) return [];
    
    const json = await response.json();
    const data = json[1] as WorldBankRecord[];
    if (!data) return [];

    return data
      .map((item: WorldBankRecord) => {
        if (item.value === null) return null;
        return {
          indicatorName: 'inflation_pl',
          date: `${item.date}-01-01`, 
          value: typeof item.value === 'string' ? parseFloat(item.value) : item.value
        };
      })
      .filter((r): r is SyncRecord => r !== null);
  }
}
