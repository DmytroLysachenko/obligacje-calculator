export * from './context';

import en from './translations/en.json';
import pl from './translations/pl.json';
import { normalizeTranslations, resolveTranslationValue } from './translation-utils';

export const translations = {
  en: normalizeTranslations(en),
  pl: normalizeTranslations(pl),
};

export type Language = keyof typeof translations;

// Simple server-side t function (defaults to en)
export function t(key: string, variables?: Record<string, string | number>, lang: Language = 'en'): string {
  let text = resolveTranslationValue(translations, lang, key);

  if (variables) {
    Object.entries(variables).forEach(([name, value]) => {
      text = text.replace(new RegExp(`{{${name}}}`, 'g'), String(value));
    });
  }

  return text;
}
