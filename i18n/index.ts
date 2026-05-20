export * from './context';

import en from './translations/en.json';
import pl from './translations/pl.json';
import { normalizeTranslations, resolveTranslationNode, resolveTranslationValue } from './translation-utils';

export const translations = {
  en: normalizeTranslations(en),
  pl: normalizeTranslations(pl),
};

export type Language = keyof typeof translations;

// Simple server-side t function (defaults to en)
export function t(key: string, variables?: Record<string, string | number>, lang: Language = 'en'): string {
  return resolveTranslationValue(translations, lang, key, variables);
}

export function tx<T = string>(
  key: string,
  variables?: Record<string, string | number>,
  lang: Language = 'en',
): T {
  return resolveTranslationNode(translations, lang, key, variables) as T;
}
