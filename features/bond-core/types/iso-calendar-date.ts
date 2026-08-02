import { z } from 'zod';

const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

declare const isoCalendarDate: unique symbol;

export type IsoCalendarDate = string & { readonly [isoCalendarDate]: true };

export function isIsoCalendarDate(value: string): boolean {
  const match = ISO_CALENDAR_DATE.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

export function parseIsoCalendarDate(value: string): IsoCalendarDate | null {
  return isIsoCalendarDate(value) ? (value as IsoCalendarDate) : null;
}

export const IsoCalendarDateSchema = z
  .string()
  .refine((value) => parseIsoCalendarDate(value) !== null, {
    message: 'Expected a real ISO calendar date (YYYY-MM-DD).',
  });
