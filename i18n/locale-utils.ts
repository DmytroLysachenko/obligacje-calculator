import type { Locale } from 'date-fns';
import { enGB, pl as plDateFns } from 'date-fns/locale';

import type { Language } from './index';

const intlLocaleByLanguage: Record<Language, string> = {
  en: 'en-GB',
  pl: 'pl-PL',
};

const metadataLocaleByLanguage: Record<Language, string> = {
  en: 'en_US',
  pl: 'pl_PL',
};

const dateFnsLocaleByLanguage: Record<Language, Locale> = {
  en: enGB,
  pl: plDateFns,
};

export function getIntlLocale(language: Language | string) {
  return intlLocaleByLanguage[language as Language] ?? intlLocaleByLanguage.en;
}

export function getMetadataLocale(language: Language | string) {
  return metadataLocaleByLanguage[language as Language] ?? metadataLocaleByLanguage.en;
}

export function getDateFnsLocale(language: Language | string) {
  return dateFnsLocaleByLanguage[language as Language] ?? dateFnsLocaleByLanguage.en;
}

export function isPolishLanguage(language: Language | string) {
  return language === 'pl';
}

export function pickLanguageValue<T>(language: Language | string, values: Record<Language, T>) {
  return values[language as Language] ?? values.en;
}
