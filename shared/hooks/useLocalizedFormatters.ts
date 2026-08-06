'use client';

import { useMemo } from 'react';

import {
  createCurrencyFormatter,
  createDateFormatter,
  createNumberFormatter,
  createPercentageFormatter,
} from '@/shared/lib/formatters';

type Language = 'pl' | 'en';

export function useCurrencyFormatter(language: Language, options?: Intl.NumberFormatOptions) {
  return useMemo(() => createCurrencyFormatter(language, options), [language, options]);
}

export function useDateFormatter(language: Language, options?: Intl.DateTimeFormatOptions) {
  return useMemo(() => createDateFormatter(language, options), [language, options]);
}

export function usePercentFormatter(language: Language, options?: Intl.NumberFormatOptions) {
  return useMemo(() => createPercentageFormatter(language, options), [language, options]);
}

export function useNumberFormatter(language: Language, options?: Intl.NumberFormatOptions) {
  return useMemo(() => createNumberFormatter(language, options), [language, options]);
}
