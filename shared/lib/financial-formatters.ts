export type FinancialLocale = 'pl' | 'en';

const localeTag: Record<FinancialLocale, string> = { pl: 'pl-PL', en: 'en-GB' };

export function formatCurrency(value: number, locale: FinancialLocale, currency = 'PLN') {
  return new Intl.NumberFormat(localeTag[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, locale: FinancialLocale, fractionDigits = 2) {
  return new Intl.NumberFormat(localeTag[locale], {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value / 100);
}

export function formatCompactNumber(value: number, locale: FinancialLocale) {
  return new Intl.NumberFormat(localeTag[locale], {
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
  ) return value;

  return new Intl.DateTimeFormat(localeTag[locale], {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(date);
}
