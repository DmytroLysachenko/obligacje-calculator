const locales = ['pl', 'en'] as const;

export type Language = (typeof locales)[number];

export const defaultLocale: Language = 'pl';

export function isSupportedLocale(value: string | undefined | null): value is Language {
  return Boolean(value && locales.includes(value as Language));
}
