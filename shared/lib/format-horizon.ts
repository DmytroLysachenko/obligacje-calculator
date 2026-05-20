import { tx } from '@/i18n';

type Language = 'pl' | 'en';

type PluralForms = {
  one: string;
  few?: string;
  many: string;
};

function resolvePluralLabel(count: number, forms: PluralForms, language: Language) {
  if (language === 'en') {
    return count === 1 ? forms.one : forms.many;
  }

  if (count === 1) {
    return forms.one;
  }

  const mod10 = count % 10;
  const mod100 = count % 100;

  if (forms.few && mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return forms.few;
  }

  return forms.many;
}

export function formatHorizonMonths(months: number, language: Language): string {
  const roundedMonths = Math.max(1, Math.round(months));
  const monthForms = tx<PluralForms>('shared.format.month_forms', undefined, language);
  const yearForms = tx<PluralForms>('shared.format.year_forms', undefined, language);

  if (roundedMonths < 12) {
    return `${roundedMonths} ${resolvePluralLabel(roundedMonths, monthForms, language)}`;
  }

  if (roundedMonths % 12 === 0) {
    const years = roundedMonths / 12;
    return `${years} ${resolvePluralLabel(years, yearForms, language)}`;
  }

  return `${roundedMonths} ${resolvePluralLabel(roundedMonths, monthForms, language)}`;
}
