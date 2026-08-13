import {
  createCurrencyFormatter,
  createDateFormatter,
  createNumberFormatter,
  createPercentageFormatter,
} from './formatters';

export type FinancialLocale = 'pl' | 'en';

export function formatCurrency(value: number, locale: FinancialLocale, currency = 'PLN') {
  return createCurrencyFormatter(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, locale: FinancialLocale, fractionDigits = 2) {
  return createPercentageFormatter(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value / 100);
}

export function formatCompactNumber(value: number, locale: FinancialLocale) {
  return createNumberFormatter(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatIsoDate(value: string, locale: FinancialLocale) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  )
    return value;

  return createDateFormatter(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
