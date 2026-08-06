import { getIntlLocale } from '@/i18n/locale-utils';

type Language = 'pl' | 'en';

export function createCurrencyFormatter(language: Language, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getIntlLocale(language), {
    style: 'currency',
    currency: 'PLN',
    ...options,
  });
}

export function createDateFormatter(language: Language, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(getIntlLocale(language), options);
}

export function createPercentageFormatter(language: Language, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getIntlLocale(language), {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
}

/** Formats UI quantities without silently inheriting the browser's locale. */
export function createNumberFormatter(language: Language, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getIntlLocale(language), options);
}
