import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, language: string = 'pl') {
  return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
    style: 'currency',
    currency: 'PLN',
  }).format(value);
}

export function formatPercentage(value: number) {
  return `${value.toFixed(2)}%`;
}
