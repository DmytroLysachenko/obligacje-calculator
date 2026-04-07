import { BaseApiClient, StandardizedIndicator, fetchWithTimeout } from "./base";

export class StooqApiClient extends BaseApiClient {
  private baseUrl = "https://stooq.com/q/d/l/";

  async fetchLatestData(): Promise<StandardizedIndicator[]> {
    // Fetch last 5 points to ensure we get at least one valid trading day
    return this.fetchHistoricalData(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  }

  async fetchHistoricalData(startDate: string, symbol: string = "^SPX"): Promise<StandardizedIndicator[]> {
    // i=d for daily, i=m for monthly. Monthly is better for long-term bond comparisons.
    const response = await fetchWithTimeout(`${this.baseUrl}?s=${symbol}&i=m`);
    if (!response.ok) throw new Error(`Stooq API error: ${response.statusText}`);
    
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/);
    
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase().split(",");
    const dateIdx = header.indexOf("date");
    const closeIdx = header.indexOf("close");

    if (dateIdx === -1 || closeIdx === -1) {
      throw new Error(`Stooq CSV format changed. Missing required columns. Found: ${lines[0]}`);
    }

    const results: StandardizedIndicator[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(",");
      const rawDate = columns[dateIdx];
      const rawClose = columns[closeIdx];

      if (!rawDate || !rawClose || isNaN(parseFloat(rawClose))) continue;

      // Only include data after or on startDate
      if (rawDate < startDate) continue;

      results.push({
        name: symbol === "^SPX" ? "sp500" : symbol,
        value: parseFloat(rawClose),
        date: rawDate.trim(),
      });
    }

    return results;
  }
}
