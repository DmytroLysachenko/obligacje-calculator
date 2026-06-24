'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { defaultLocale, type Language, isSupportedLocale } from './config';

type TranslationVariables = Record<string, string | number>;

interface AppLocaleContextType {
  locale: Language;
  setLocale: (locale: Language) => void;
}

const AppLocaleContext = createContext<AppLocaleContextType | undefined>(undefined);

export function AppLocaleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const nextIntlLocale = useLocale();
  const locale = isSupportedLocale(nextIntlLocale) ? nextIntlLocale : defaultLocale;

  const setLocale = useCallback(
    (nextLocale: Language) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('app-language', nextLocale);
        document.cookie = `app-language=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      }

      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>;
}

export function useAppLocale() {
  const context = useContext(AppLocaleContext);

  if (!context) {
    throw new Error('useAppLocale must be used within an AppLocaleProvider');
  }

  return context;
}

export function useAppI18n() {
  const { locale, setLocale } = useAppLocale();
  const translator = useTranslations();

  const t = useCallback(
    (key: string, variables?: TranslationVariables) => {
      try {
        return translator(key as never, variables as never);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[i18n] Failed to translate client key "${key}" for locale "${locale}".`,
            error,
          );
        }

        return key;
      }
    },
    [locale, translator],
  );

  return useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
}
