'use client';

import { useMemo } from 'react';
import { createCurrencyFormatter, createDateFormatter } from '@/shared/lib/formatters';

type Language = 'pl' | 'en';

export function useCurrencyFormatter(
  language: Language,
  options?: Intl.NumberFormatOptions,
) {
  return useMemo(() => createCurrencyFormatter(language, options), [language, options]);
}

export function useDateFormatter(
  language: Language,
  options?: Intl.DateTimeFormatOptions,
) {
  return useMemo(() => createDateFormatter(language, options), [language, options]);
}
