'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import en from './translations/en.json';
import pl from './translations/pl.json';
import { normalizeTranslations, resolveTranslationValue } from './translation-utils';

export const translations = {
  en: normalizeTranslations(en),
  pl: normalizeTranslations(pl),
};

export type Language = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
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
    let text = resolveTranslationValue(translations, language, key);

    if (variables) {
      Object.entries(variables).forEach(([name, value]) => {
        text = text.replace(new RegExp(`{{${name}}}`, 'g'), String(value));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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
