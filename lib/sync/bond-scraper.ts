/**
 * Bond offer ingestion helper.
 * Still HTML-based, but tuned to the official offer page and current May 2026 rates.
 */

export interface ScrapedBondRate {
  symbol: string;
  firstYearRate: number;
  margin: number;
}

const OFFICIAL_FALLBACK_RATES: ScrapedBondRate[] = [
  { symbol: 'OTS', firstYearRate: 2.0, margin: 0 },
  { symbol: 'ROR', firstYearRate: 4.0, margin: 0 },
  { symbol: 'DOR', firstYearRate: 4.15, margin: 0.15 },
  { symbol: 'TOS', firstYearRate: 4.4, margin: 0 },
  { symbol: 'COI', firstYearRate: 4.75, margin: 1.5 },
  { symbol: 'EDO', firstYearRate: 5.35, margin: 2.0 },
  { symbol: 'ROS', firstYearRate: 5.0, margin: 2.0 },
  { symbol: 'ROD', firstYearRate: 5.6, margin: 2.5 },
];

export async function scrapeCurrentBondRates(): Promise<ScrapedBondRate[]> {
  const url = 'https://www.obligacjeskarbowe.pl/oferta-obligacji/';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch bond site: ${response.status}`);
    }

    const html = await response.text();
    const rates = OFFICIAL_FALLBACK_RATES.flatMap((item) => {
      const rateRegex = new RegExp(
        `(\\d+,\\d+)\\s?%[^<\\n\\r]{0,120}\\(symbol:?\\s*${item.symbol}\\)|${item.symbol}[^<\\n\\r]{0,140}(\\d+,\\d+)\\s?%`,
        'i',
      );
      const match = html.match(rateRegex);
      const rawRate = match?.[1] || match?.[2];

      if (!rawRate) {
        return [];
      }

      return [
        {
          symbol: item.symbol,
          firstYearRate: parseFloat(rawRate.replace(',', '.')),
          margin: item.margin,
        },
      ];
    });

    return rates.length > 0 ? rates : OFFICIAL_FALLBACK_RATES;
  } catch (error) {
    console.error('Error scraping bonds:', error);
    return OFFICIAL_FALLBACK_RATES;
  }
}
