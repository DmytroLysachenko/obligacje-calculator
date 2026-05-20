import { pickLanguageValue } from '@/i18n/locale-utils';
export function formatBondDuration(durationYears: number, language: 'pl' | 'en'): string {
    if (durationYears < 1) {
        const months = Math.round(durationYears * 12);
        return `${months} ${formatMonthLabel(months, language)}`;
    }
    const roundedYears = Number.isInteger(durationYears)
        ? durationYears.toFixed(0)
        : durationYears.toFixed(2).replace(/\.?0+$/, '');
    return `${roundedYears} ${pickLanguageValue(language, {
        pl: 'Lata',
        en: pluralizeYear(Number(roundedYears))
    })}`;
}
function formatMonthLabel(months: number, language: 'pl' | 'en'): string {
    if (language === 'en') {
        return months === 1 ? 'month' : 'months';
    }
    if (months === 1) {
        return 'Miesiac';
    }
    const mod10 = months % 10;
    const mod100 = months % 100;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
        return 'Miesiace';
    }
    return 'Miesiecy';
}
function pluralizeYear(years: number): string {
    return years === 1 ? 'Year' : 'Years';
}
