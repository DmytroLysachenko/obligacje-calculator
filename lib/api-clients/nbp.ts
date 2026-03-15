import { BaseApiClient, StandardizedIndicator } from "./base";

interface NbpGoldPrice {
  data: string;
  cena: number;
}

export class NbpApiClient extends BaseApiClient {
  private baseUrl = "https://api.nbp.pl/api";

  async fetchLatestData(): Promise<StandardizedIndicator[]> {
    const goldPrice = await this.fetchGoldPrice();
    return [goldPrice];
  }

  async fetchHistoricalData(): Promise<StandardizedIndicator[]> {
    // For now implement gold as primary example
    const response = await fetch(`${this.baseUrl}/cenyzlota/last/100?format=json`);
    const data: NbpGoldPrice[] = await response.json();
    
    return data.map((item) => ({
      name: "gold_price",
      value: item.cena,
      date: item.data,
    }));
  }

  private async fetchGoldPrice(): Promise<StandardizedIndicator> {
    const response = await fetch(`${this.baseUrl}/cenyzlota?format=json`);
    const data: NbpGoldPrice[] = await response.json();
    return {
      name: "gold_price",
      value: data[0].cena,
      date: data[0].data,
    };
  }
}
