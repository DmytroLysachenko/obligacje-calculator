export * from './context';
export * from './config';

import {createTranslator} from 'next-intl';
import en from './translations/en.json';
import pl from './translations/pl.json';
import {defaultLocale, type Language} from './config';

type TranslationVariables = Record<string, string | number>;

const messagesByLocale = {
  en,
  pl
} as const;

function getTranslator(language: Language = defaultLocale) {
  return createTranslator({
    locale: language,
    messages: messagesByLocale[language]
  });
}

function getMessageAtPath(source: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, source);
}

export function t(
  key: string,
  variables?: TranslationVariables,
  lang: Language = defaultLocale
): string {
  return getTranslator(lang)(key as never, variables as never);
}

export function tx<T = string>(
  key: string,
  variables?: TranslationVariables,
  lang: Language = defaultLocale
): T {
  const messages = messagesByLocale[lang] ?? messagesByLocale[defaultLocale];
  const raw = getMessageAtPath(messages, key);

  if (typeof raw === 'string') {
    return getTranslator(lang)(key as never, variables as never) as T;
  }

  return raw as T;
}
