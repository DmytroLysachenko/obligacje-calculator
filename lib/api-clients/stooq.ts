import { BaseApiClient, StandardizedIndicator } from "./base";

export class StooqApiClient extends BaseApiClient {
  // Stooq provides CSV format for historical data
  private baseUrl = "https://stooq.com/q/d/l/";

  async fetchLatestData(): Promise<StandardizedIndicator[]> {
    // Stooq doesn't have a clean "latest JSON" endpoint for free, 
    // so we usually fetch the last month of the CSV
    return this.fetchHistoricalData("");
  }

  async fetchHistoricalData(symbol: string = "^SPX"): Promise<StandardizedIndicator[]> {
    const response = await fetch(`${this.baseUrl}?s=${symbol}&i=m`);
    const csvText = await response.text();
    
    const lines = csvText.split("\n").slice(1); // skip header
    const results: StandardizedIndicator[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const [date, , , , close] = line.split(",");
      results.push({
        name: symbol === "^SPX" ? "sp500" : symbol,
        value: parseFloat(close),
        date: date.trim(),
      });
    }

    return results;
  }
}
