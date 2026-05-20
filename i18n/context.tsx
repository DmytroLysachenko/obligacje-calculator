'use client';

import {createContext, useContext} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {defaultLocale, type Language, isSupportedLocale} from './config';

type TranslationVariables = Record<string, string | number>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: TranslationVariables, language?: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const locale = useLocale();
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

  return (
    <LanguageContext.Provider value={{language, setLanguage, t}}>
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
