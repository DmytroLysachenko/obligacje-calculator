export * from './context';

import en from './translations/en.json';
import pl from './translations/pl.json';

export const translations = {
  en,
  pl,
};

export type Language = keyof typeof translations;

// Simple server-side t function (defaults to en)
export function t(key: string, variables?: Record<string, string | number>, lang: Language = 'en'): string {
  const keys = key.split('.');
  let current: unknown = translations[lang];

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      current = translations.en;
      for (const fallbackKey of keys) {
        if (current && typeof current === 'object' && fallbackKey in current) {
          current = (current as Record<string, unknown>)[fallbackKey];
        } else {
          return key;
        }
      }
      break;
    }
  }

  let text = typeof current === 'string' ? current : key;

  if (variables) {
    Object.entries(variables).forEach(([name, value]) => {
      text = text.replace(new RegExp(`{{${name}}}`, 'g'), String(value));
    });
  }

  return text;
}
