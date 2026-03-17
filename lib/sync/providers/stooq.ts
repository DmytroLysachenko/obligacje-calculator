import { SyncProvider, SyncRecord } from "../types";

export class StooqSyncProvider implements SyncProvider {
  name = "Stooq (Market Data)";
  private baseUrl = "https://stooq.com/q/d/l/";

  async fetchData(startDate: string, endDate: string): Promise<SyncRecord[]> {
    const results: SyncRecord[] = [];
    const symbols = ["^SPX", "GC.F"]; // S&P 500, Gold Futures

    for (const symbol of symbols) {
      try {
        const data = await this.fetchSymbol(symbol);
        const filtered = data.filter(d => 
          (d.date >= startDate && d.date <= endDate)
        );
        results.push(...filtered);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[Stooq Provider] Failed for ${symbol}:`, error);
      }
    }

    return results;
  }

  private async fetchSymbol(symbol: string): Promise<SyncRecord[]> {
    const response = await fetch(`${this.baseUrl}?s=${symbol}&i=m`);
    if (!response.ok) return [];
    
    const csvText = await response.text();
    const lines = csvText.split("\n").slice(1);
    const indicatorName = symbol === "^SPX" ? "sp500" : (symbol === "GC.F" ? "gold_futures" : symbol.toLowerCase());

    return lines
      .map(line => {
        const parts = line.split(",");
        if (parts.length < 5) return null;
        const [date, , , , close] = parts;
        return {
          indicatorName,
          date: date.trim(), 
          value: parseFloat(close)
        };
      })
      .filter((r): r is SyncRecord => r !== null && !isNaN(r.value));
  }
}
