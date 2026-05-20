import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { pickLanguageValue } from '@/i18n/locale-utils';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
export function formatCurrency(value: number, language: string = 'pl') {
    return new Intl.NumberFormat(pickLanguageValue(language, {
        pl: 'pl-PL',
        en: 'en-GB'
    }), {
        style: 'currency',
        currency: 'PLN',
    }).format(value);
}
export function formatPercentage(value: number) {
    return `${value.toFixed(2)}%`;
}
