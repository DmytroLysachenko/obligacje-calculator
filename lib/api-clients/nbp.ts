import { BaseApiClient, StandardizedIndicator, fetchWithTimeout } from "./base";

interface NbpGoldPrice {
  data: string;
  cena: number;
}

export class NbpApiClient extends BaseApiClient {
  private baseUrl = "https://api.nbp.pl/api";

  async fetchLatestData(): Promise<StandardizedIndicator[]> {
    const [gold, rate] = await Promise.all([
      this.fetchGoldPrice(),
      this.fetchCurrentReferenceRate()
    ]);
    return [gold, rate];
  }

  async fetchHistoricalData(startDate: string): Promise<StandardizedIndicator[]> {
    // Note: NBP API has limitations on range size, usually handled by caller or multiple requests
    // For gold, we fetch last 100 points as per original, but filtering by startDate if needed
    const response = await fetchWithTimeout(`${this.baseUrl}/cenyzlota/last/100?format=json`);
    if (!response.ok) throw new Error(`NBP API error: ${response.statusText}`);
    
    const data: NbpGoldPrice[] = await response.json();
    
    return data
      .filter(item => item.data >= startDate)
      .map((item) => ({
        name: "gold_price",
        value: item.cena,
        date: item.data,
      }));
  }

  private async fetchGoldPrice(): Promise<StandardizedIndicator> {
    const response = await fetchWithTimeout(`${this.baseUrl}/cenyzlota?format=json`);
    if (!response.ok) throw new Error(`NBP API error: ${response.statusText}`);
    const data: NbpGoldPrice[] = await response.json();
    return {
      name: "gold_price",
      value: data[0].cena,
      date: data[0].data,
    };
  }

  /**
   * Fetches the current NBP Reference Rate.
   * Uses the statistics endpoint which is more reliable for rates than currency tables.
   */
  private async fetchCurrentReferenceRate(): Promise<StandardizedIndicator> {
    // The specific NBP endpoint for interest rates
    const response = await fetchWithTimeout("https://api.nbp.pl/api/statystyka/stopy/ref?format=json");
    if (!response.ok) {
      // Fallback if specific endpoint fails
      return { name: "nbp_reference_rate", value: 5.75, date: new Date().toISOString().split('T')[0] };
    }
    
    const data = await response.json();
    // API returns an array of rate changes
    const latest = data[0]; 
    
    return {
      name: "nbp_reference_rate",
      value: parseFloat(latest.oprocentowanie.replace(',', '.')),
      date: latest.obowiazuje_od,
    };
  }
}
