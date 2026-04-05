import { SyncProvider, SyncRecord } from "../types";

export class StooqSyncProvider implements SyncProvider {
  name = 'Stooq Market Data';
  seriesSlug = 'sp500';
  private baseUrl = "https://stooq.com/q/d/l/";

  async fetchData(startDate: string, endDate: string): Promise<SyncRecord[]> {
    const results: SyncRecord[] = [];
    const symbols = [
      { symbol: "^SPX", slug: "sp500" },
      { symbol: "GC.F", slug: "gold-usd" },
      { symbol: "PLOPLN3M", slug: "wibor-3m" },
      { symbol: "PLOPLN6M", slug: "wibor-6m" },
      { symbol: "CPIP.PL", slug: "pl-cpi" }
    ];

    for (const item of symbols) {
      try {
        const data = await this.fetchSymbol(item.symbol, item.slug);
        const filtered = data.filter(d => 
          (d.date >= startDate && d.date <= endDate)
        );
        results.push(...filtered);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[Stooq Provider] Failed for ${item.symbol}:`, error);
      }
    }

    return results;
  }

  private async fetchSymbol(symbol: string, seriesSlug: string): Promise<SyncRecord[]> {
    const url = `${this.baseUrl}?s=${symbol}&i=m`;
    console.log(`[Stooq Provider] Fetching ${symbol} from ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) {
      console.error(`[Stooq Provider] Fetch failed for ${symbol}: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const csvText = await response.text();
    console.log(`[Stooq Provider] Received CSV for ${symbol}, length: ${csvText.length}`);
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
      console.warn(`[Stooq Provider] CSV for ${symbol} has no data lines`);
      return [];
    }

    const header = lines[0].toLowerCase().split(",");
    const dateIdx = header.indexOf("date");
    const closeIdx = header.indexOf("close");

    if (dateIdx === -1 || closeIdx === -1) {
      console.error(`[Stooq Provider] Missing columns in CSV for ${symbol}. Header: ${lines[0]}`);
      return [];
    }

    const records = lines.slice(1)
      .map(line => {
        const parts = line.split(",");
        if (parts.length < 2) return null;
        
        const dateStr = parts[dateIdx]?.trim();
        const closeStr = parts[closeIdx]?.trim();
        
        if (!dateStr || !closeStr || isNaN(parseFloat(closeStr))) return null;

        // Stooq dates are YYYYMMDD in daily/monthly CSV, or YYYY-MM-DD
        let formattedDate = dateStr;
        if (dateStr.length === 8 && !dateStr.includes('-')) {
          formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        }

        return {
          seriesSlug,
          date: formattedDate, 
          value: parseFloat(closeStr)
        };
      })
      .filter((r): r is SyncRecord => r !== null);
      
    console.log(`[Stooq Provider] Parsed ${records.length} records for ${symbol}`);
    return records;
  }
}
