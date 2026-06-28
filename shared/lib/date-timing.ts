import { addMonths, differenceInCalendarMonths, format, parseISO } from 'date-fns';

export type TimingMode = 'general' | 'exact';

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function parseDateString(value: string): Date {
  return parseISO(value);
}

export function getHorizonMonths(purchaseDate: string, withdrawalDate: string): number {
  return Math.max(
    1,
    differenceInCalendarMonths(parseDateString(withdrawalDate), parseDateString(purchaseDate)),
  );
}

export function getWithdrawalDateFromMonths(purchaseDate: string, months: number): string {
  return toDateString(addMonths(parseDateString(purchaseDate), Math.max(1, Math.round(months))));
}

export function differenceInMonths(start: Date, end: Date): number {
  return differenceInCalendarMonths(end, start);
}
