/**
 * Bond offer ingestion helper.
 * Still HTML-based, but tuned to official offer + monthly communication pages.
 */

export interface ScrapedBondRate {
  symbol: string;
  firstYearRate: number;
  margin: number;
  seriesCode?: string;
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

const POLISH_MONTH_SLUGS = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'wrzesnia',
  'pazdziernika',
  'listopada',
  'grudnia',
];

function buildMonthlyCommunicationUrl(referenceDate = new Date()) {
  const monthSlug = POLISH_MONTH_SLUGS[referenceDate.getMonth()];
  const year = referenceDate.getFullYear();
  return `https://www.obligacjeskarbowe.pl/komunikaty/z-dniem-1-${monthSlug}-${year}-r-rozpoczyna-sie-sprzedaz-obligacji/`;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function parseOfferFromCommunication(
  html: string,
  fallback: ScrapedBondRate,
): ScrapedBondRate | null {
  const blockRegex = new RegExp(
    `<li><strong>[^<]*\\((${fallback.symbol}\\d{4})\\)<\\/a>\\)<\\/strong>[\\s\\S]*?wynosi\\s*<strong>(\\d+,\\d+)%<\\/strong>[\\s\\S]*?(?:mar(?:zy|\\u017cy)\\s*<strong>(\\d+,\\d+)%<\\/strong>)?`,
    'i',
  );
  const match = html.match(blockRegex);

  if (!match) {
    return null;
  }

  return {
    symbol: fallback.symbol,
    seriesCode: match[1],
    firstYearRate: parseFloat(match[2].replace(',', '.')),
    margin: match[3] ? parseFloat(match[3].replace(',', '.')) : fallback.margin,
  };
}

function parseOfferFromGenericOfferPage(
  html: string,
  fallback: ScrapedBondRate,
): ScrapedBondRate | null {
  const rateRegex = new RegExp(
    `${fallback.symbol}[\\s\\S]{0,220}?((?:\\d+,\\d+)|(?:\\d+))\\s?%`,
    'i',
  );
  const rateMatch = html.match(rateRegex);

  if (!rateMatch) {
    return null;
  }

  return {
    symbol: fallback.symbol,
    firstYearRate: parseFloat(rateMatch[1].replace(',', '.')),
    margin: fallback.margin,
  };
}

export async function scrapeCurrentBondRates(): Promise<ScrapedBondRate[]> {
  try {
    const [offerPageHtml, communicationHtml] = await Promise.all([
      fetchHtml('https://www.obligacjeskarbowe.pl/oferta-obligacji/').catch(() => ''),
      fetchHtml(buildMonthlyCommunicationUrl()).catch(() => ''),
    ]);

    const rates = OFFICIAL_FALLBACK_RATES.map((fallback) => {
      return (
        parseOfferFromCommunication(communicationHtml, fallback)
        ?? parseOfferFromGenericOfferPage(offerPageHtml, fallback)
        ?? fallback
      );
    });

    return rates;
  } catch (error) {
    console.error('Error scraping bonds:', error);
    return OFFICIAL_FALLBACK_RATES;
  }
}
