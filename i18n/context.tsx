'use client';

import {createContext, useContext} from 'react';
import {useLocale, useMessages, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import type {AbstractIntlMessages} from 'next-intl';
import {defaultLocale, type Language, isSupportedLocale} from './config';

type TranslationVariables = Record<string, string | number>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: TranslationVariables) => string;
  tx: <T = string>(key: string, variables?: TranslationVariables) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getMessageAtPath(messages: AbstractIntlMessages, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, messages);
}

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const locale = useLocale();
  const messages = useMessages();
  const translator = useTranslations();
  const language = isSupportedLocale(locale) ? locale : defaultLocale;

  const setLanguage = (nextLanguage: Language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('app-language', nextLanguage);
      document.cookie = `app-language=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    }

    router.refresh();
  };

  const t = (key: string, variables?: TranslationVariables) =>
    translator(key as never, variables as never);

  const tx = <T = string,>(key: string, variables?: TranslationVariables): T => {
    const raw = getMessageAtPath(messages, key);

    if (typeof raw === 'string') {
      return translator(key as never, variables as never) as T;
    }

    return raw as T;
  };

  return (
    <LanguageContext.Provider value={{language, setLanguage, t, tx}}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}
