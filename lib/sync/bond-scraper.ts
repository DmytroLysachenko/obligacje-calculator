/**
 * Bond offer ingestion helper.
 * Prefers the Ministry of Finance current offer page, then falls back to
 * obligacjeskarbowe.pl HTML, and only then to curated official constants.
 */
import { fetchSyncText } from './http-gateway';

export interface ScrapedBondRate {
  symbol: string;
  firstYearRate: number;
  margin: number;
  seriesCode?: string;
}

const CURRENT_GOV_OFFER_URL = 'https://www.gov.pl/web/finanse/biezaca-oferta2';
const OBLIGACJE_OFFER_URL = 'https://www.obligacjeskarbowe.pl/oferta-obligacji/';

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
  const match = new RegExp(`(${symbol}\\d{4})`, 'i').exec(html);
  if (!match || match.index < 0) {
    return null;
  }

  const index = match.index;
  const blockStartCandidates = [
    html.lastIndexOf('<h4', index),
    html.lastIndexOf('<tr', index),
    html.lastIndexOf('<li', index),
  ].filter((value) => value >= 0);

  const start = blockStartCandidates.length > 0 ? Math.max(...blockStartCandidates) : index;
  const nextSectionStarts = [
    html.indexOf('<h4', index + match[0].length),
    html.indexOf('</tr>', index + match[0].length),
    html.indexOf('</li>', index + match[0].length),
  ].filter((value) => value >= 0);
  const end = nextSectionStarts.length > 0 ? Math.min(...nextSectionStarts) : Math.min(html.length, index + 2200);

  return html.slice(start, end);
}

function parseFirstYearRate(section: string, fallback: ScrapedBondRate) {
  const normalized = normalizeMarkup(section);
  const patterns = [
    /pierwszym miesiecznym[\s\S]{0,120}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
    /pierwszym miesiacu oprocentowanie wynosi[\s\S]{0,120}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
    /pierwszym roku[\s\S]{0,120}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
    /oprocentowaniu stalym wynoszacym[\s\S]{0,80}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%?/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return parsePercent(match[1], fallback.firstYearRate);
    }
  }

  return fallback.firstYearRate;
}

function parseMargin(section: string, fallback: ScrapedBondRate) {
  const normalized = normalizeMarkup(section);
  const patterns = [
    /marzy[\s\S]{0,60}?<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%/i,
    /inflacj[\s\S]{0,80}?\+\s*<strong[^>]*>\s*(\d+(?:,\d+)?)\s*%/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return parsePercent(match[1], fallback.margin);
    }
  }

  return fallback.margin;
}

export function parseOfferFromGovPage(html: string, fallback: ScrapedBondRate): ScrapedBondRate | null {
  const section = extractSection(html, fallback.symbol);
  if (!section) {
    return null;
  }

  const seriesMatch = section.match(new RegExp(`(${fallback.symbol}\\d{4})`, 'i'));

  return {
    symbol: fallback.symbol,
    firstYearRate: parseFirstYearRate(section, fallback),
    margin: parseMargin(section, fallback),
    seriesCode: seriesMatch?.[1],
  };
}

export function parseOfferFromObligacjePage(
  html: string,
  fallback: ScrapedBondRate,
): ScrapedBondRate | null {
  const section = extractSection(html, fallback.symbol);
  if (!section) {
    return null;
  }

  const seriesMatch = section.match(new RegExp(`(${fallback.symbol}\\d{4})`, 'i'));

  return {
    symbol: fallback.symbol,
    firstYearRate: parseFirstYearRate(section, fallback),
    margin: parseMargin(section, fallback),
    seriesCode: seriesMatch?.[1],
  };
}

export async function scrapeCurrentBondRates(): Promise<ScrapedBondRate[]> {
  try {
    const [govOfferHtml, obligacjeOfferHtml] = await Promise.all([
      fetchHtml(CURRENT_GOV_OFFER_URL).catch(() => ''),
      fetchHtml(OBLIGACJE_OFFER_URL).catch(() => ''),
    ]);

    return OFFICIAL_FALLBACK_RATES.map((fallback) => (
      parseOfferFromGovPage(govOfferHtml, fallback)
      ?? parseOfferFromObligacjePage(obligacjeOfferHtml, fallback)
      ?? fallback
    ));
  } catch (error) {
    console.error('Error scraping bonds:', error);
    return OFFICIAL_FALLBACK_RATES;
  }
}
