'use client';

import {createContext, useContext} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {defaultLocale, type Language, isSupportedLocale} from './config';

type TranslationVariables = Record<string, string | number>;

interface AppLocaleContextType {
  locale: Language;
  setLocale: (locale: Language) => void;
}

const AppLocaleContext = createContext<AppLocaleContextType | undefined>(undefined);

export function AppLocaleProvider({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const nextIntlLocale = useLocale();
  const locale = isSupportedLocale(nextIntlLocale) ? nextIntlLocale : defaultLocale;

  const setLocale = (nextLocale: Language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('app-language', nextLocale);
      document.cookie = `app-language=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    }

    router.refresh();
  };

  return (
    <AppLocaleContext.Provider value={{locale, setLocale}}>
      {children}
    </AppLocaleContext.Provider>
  );
}

export function useAppLocale() {
  const context = useContext(AppLocaleContext);

  if (!context) {
    throw new Error('useAppLocale must be used within an AppLocaleProvider');
  }

  return context;
}

export function useAppI18n() {
  const {locale, setLocale} = useAppLocale();
  const translator = useTranslations();

  const t = (key: string, variables?: TranslationVariables) =>
    translator(key as never, variables as never);

  return {locale, setLocale, t};
}
