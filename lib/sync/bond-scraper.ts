/**
 * Bond offer ingestion helper.
 * Prefers the Ministry of Finance current offer page, then falls back to
 * obligacjeskarbowe.pl HTML, and only then to curated official constants.
 */
import { fetchSyncText } from './http-gateway';
import { createSyncLogger } from './sync-logger';

const logger = createSyncLogger('BondScraper');

export interface ScrapedBondRate {
  symbol: string;
  firstYearRate: number;
  margin: number;
  seriesCode?: string;
  source: 'gov.pl' | 'obligacjeskarbowe.pl' | 'curated-fallback';
}

type BondOfferFallback = Omit<ScrapedBondRate, 'source'>;

const CURRENT_GOV_OFFER_URL = 'https://www.gov.pl/web/finanse/biezaca-oferta2';
const OBLIGACJE_OFFER_URL = 'https://www.obligacjeskarbowe.pl/oferta-obligacji/';
const FIXED_RATE_BOND_SYMBOLS = new Set(['OTS', 'TOS']);

const OFFICIAL_FALLBACK_RATES: ScrapedBondRate[] = [
  { symbol: 'OTS', firstYearRate: 2.0, margin: 0, source: 'curated-fallback' },
  { symbol: 'ROR', firstYearRate: 4.0, margin: 0, source: 'curated-fallback' },
  { symbol: 'DOR', firstYearRate: 4.15, margin: 0.15, source: 'curated-fallback' },
  { symbol: 'TOS', firstYearRate: 4.4, margin: 0, source: 'curated-fallback' },
  { symbol: 'COI', firstYearRate: 4.75, margin: 1.5, source: 'curated-fallback' },
  { symbol: 'EDO', firstYearRate: 5.35, margin: 2.0, source: 'curated-fallback' },
  { symbol: 'ROS', firstYearRate: 5.0, margin: 2.0, source: 'curated-fallback' },
  { symbol: 'ROD', firstYearRate: 5.6, margin: 2.5, source: 'curated-fallback' },
];

async function fetchHtml(url: string) {
  return fetchSyncText(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36',
    },
  });
}

function parsePercent(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMarkup(section: string) {
  return section
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&oacute;/g, 'o')
    .replace(/&aogon;/g, 'a')
    .replace(/&eogon;/g, 'e')
    .replace(/&lstrok;/g, 'l')
    .replace(/&zdot;/g, 'z')
    .replace(/&amp;/g, '&');
}

function extractSection(html: string, symbol: string) {
  const matches = html.matchAll(new RegExp(`${symbol}\\d{4}`, 'gi'));

  for (const match of matches) {
    const index = match.index;
    if (index === undefined) continue;

    // The page also lists expiring series in explanatory prose. Only a series
    // inside its own offer heading is a current offer we can safely ingest.
    const headingStart = html.lastIndexOf('<h4', index);
    const headingEnd = headingStart >= 0 ? html.indexOf('</h4>', headingStart) : -1;
    if (headingStart < 0 || headingEnd < index) continue;

    const nextHeading = html.indexOf('<h4', headingEnd + 5);
    return html.slice(headingStart, nextHeading >= 0 ? nextHeading : html.length);
  }

  return null;
}

function parseFirstYearRate(section: string) {
  const normalized = normalizeMarkup(section);
  const patterns = [
    /pierwszym miesiecznym[\s\S]{0,120}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
    /pierwszym miesiacu oprocentowanie wynosi[\s\S]{0,120}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
    /pierwszym roku[\s\S]{0,120}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
    /pierwszym,?\s*(?:miesiecznym|rocznym)[\s\S]{0,160}?(?:wynosi|jest rowne)[\s\S]{0,80}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
    /oprocentowaniu stalym wynoszacym[\s\S]{0,80}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
    /wynosi[\s\S]{0,80}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return parsePercent(match[1], Number.NaN);
    }
  }

  return null;
}

function parseMargin(section: string) {
  const normalized = normalizeMarkup(section);
  const patterns = [
    /marzy[\s\S]{0,60}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%/i,
    /inflacj[\s\S]{0,80}?\+\s*<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return parsePercent(match[1], Number.NaN);
    }
  }

  return null;
}

export function parseOfferFromGovPage(
  html: string,
  fallback: BondOfferFallback,
): ScrapedBondRate | null {
  const section = extractSection(html, fallback.symbol);
  if (!section) {
    return null;
  }

  const seriesMatch = section.match(new RegExp(`(${fallback.symbol}\\d{4})`, 'i'));

  const firstYearRate = parseFirstYearRate(section);
  const margin = parseMargin(section);

  if (
    firstYearRate === null ||
    !seriesMatch ||
    (margin === null && !FIXED_RATE_BOND_SYMBOLS.has(fallback.symbol))
  ) {
    return null;
  }

  return {
    symbol: fallback.symbol,
    firstYearRate,
    // Fixed-rate series have no margin in the official copy.
    margin: margin ?? 0,
    seriesCode: seriesMatch?.[1],
    source: 'gov.pl',
  };
}

function parseOfferFromObligacjePage(
  html: string,
  fallback: BondOfferFallback,
): ScrapedBondRate | null {
  const section = extractSection(html, fallback.symbol);
  if (!section) {
    return null;
  }

  const seriesMatch = section.match(new RegExp(`(${fallback.symbol}\\d{4})`, 'i'));

  const firstYearRate = parseFirstYearRate(section);
  const margin = parseMargin(section);

  if (
    firstYearRate === null ||
    !seriesMatch ||
    (margin === null && !FIXED_RATE_BOND_SYMBOLS.has(fallback.symbol))
  ) {
    return null;
  }

  return {
    symbol: fallback.symbol,
    firstYearRate,
    margin: margin ?? 0,
    seriesCode: seriesMatch?.[1],
    source: 'obligacjeskarbowe.pl',
  };
}

export async function scrapeCurrentBondRates(): Promise<ScrapedBondRate[]> {
  try {
    const [govOfferHtml, obligacjeOfferHtml] = await Promise.all([
      fetchHtml(CURRENT_GOV_OFFER_URL).catch(() => ''),
      fetchHtml(OBLIGACJE_OFFER_URL).catch(() => ''),
    ]);

    return OFFICIAL_FALLBACK_RATES.map(
      (fallback) =>
        parseOfferFromGovPage(govOfferHtml, fallback) ??
        parseOfferFromObligacjePage(obligacjeOfferHtml, fallback) ??
        fallback,
    );
  } catch (error) {
    logger.error('Error scraping bonds', error);
    return OFFICIAL_FALLBACK_RATES;
  }
}
