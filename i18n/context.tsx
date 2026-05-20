'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import en from './translations/en.json';
import pl from './translations/pl.json';
import { normalizeTranslations, resolveTranslationNode, resolveTranslationValue } from './translation-utils';

export const translations = {
  en: normalizeTranslations(en),
  pl: normalizeTranslations(pl),
};

export type Language = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  tx: <T = string>(key: string, variables?: Record<string, string | number>) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ 
  children, 
  initialLanguage = 'en' 
}: { 
  children: ReactNode, 
  initialLanguage?: Language 
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.cookie = `app-language=${language}; path=/; max-age=31536000`;
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    return resolveTranslationValue(translations, language, key, variables);
  };

  const tx = <T = string,>(
    key: string,
    variables?: Record<string, string | number>,
  ): T => resolveTranslationNode(translations, language, key, variables) as T;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, tx }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
