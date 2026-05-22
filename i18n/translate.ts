import {createTranslator} from 'next-intl';
import {defaultLocale, type Language} from './config';
import en from './translations/en.json';
import pl from './translations/pl.json';

export type TranslationVariables = Record<string, string | number>;

const messagesByLocale = {
  en,
  pl
} as const;

function getTranslator(locale: Language = defaultLocale) {
  return createTranslator({
    locale,
    messages: messagesByLocale[locale]
  });
}

export function translateMessage(
  locale: Language = defaultLocale,
  key: string,
  variables?: TranslationVariables
): string {
  try {
    return getTranslator(locale)(key as never, variables as never);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] Failed to translate server key "${key}" for locale "${locale}".`, error);
    }

    return key;
  }
}
