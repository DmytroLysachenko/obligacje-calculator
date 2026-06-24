import { BaseApiClient, StandardizedIndicator, fetchWithTimeout } from './base';
import { buildNbpReferenceFallbackIndicators } from '@/shared/lib/nbp-reference-fallback';

interface NbpGoldPrice {
  data: string;
  cena: number;
}

interface NbpRateItem {
  obowiazuje_od: string;
  oprocentowanie: string;
}

export class NbpApiClient extends BaseApiClient {
  private baseUrl = 'https://api.nbp.pl/api';

  async fetchLatestData(): Promise<StandardizedIndicator[]> {
    const [gold, rateHistory] = await Promise.all([
      this.fetchGoldPrice(),
      this.fetchReferenceRateHistory(),
    ]);
    return [gold, rateHistory[0] ?? { name: 'nbp_reference_rate', value: 3.75, date: new Date().toISOString().split('T')[0] }];
  }

  async fetchHistoricalData(startDate: string): Promise<StandardizedIndicator[]> {
    // NBP gold history is intentionally bounded here; broader paging belongs in the sync layer.
    const response = await fetchWithTimeout(`${this.baseUrl}/cenyzlota/last/100?format=json`);
    if (!response.ok) throw new Error(`NBP API error: ${response.statusText}`);

    const data: NbpGoldPrice[] = await response.json();

    return data
      .filter((item) => item.data >= startDate)
      .map((item) => ({
        name: 'gold_price',
        value: item.cena,
        date: item.data,
      }));
  }

  private async fetchGoldPrice(): Promise<StandardizedIndicator> {
    const response = await fetchWithTimeout(`${this.baseUrl}/cenyzlota?format=json`);
    if (!response.ok) throw new Error(`NBP API error: ${response.statusText}`);
    const data: NbpGoldPrice[] = await response.json();
    return {
      name: 'gold_price',
      value: data[0].cena,
      date: data[0].data,
    };
  }

  async fetchReferenceRateHistory(): Promise<StandardizedIndicator[]> {
    try {
      const response = await fetchWithTimeout('https://api.nbp.pl/api/statystyka/stopy/ref?format=json');
      if (!response.ok) {
        return buildNbpReferenceFallbackIndicators();
      }

      const data = (await response.json()) as NbpRateItem[];
      return data.map((item) => ({
        name: 'nbp_reference_rate',
        value: parseFloat(item.oprocentowanie.replace(',', '.')),
        date: item.obowiazuje_od,
        metadata: {
          source: 'official-api',
          sourceLabel: 'NBP official API',
        },
      }));
    } catch {
      return buildNbpReferenceFallbackIndicators();
    }
  }
}
