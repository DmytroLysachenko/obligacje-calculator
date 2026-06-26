import { z } from 'zod';

export const finiteNumber = (label: string) =>
  z.number().finite({ message: `${label} must be a finite number` });

export const percent = (label: string, min: number, max: number) =>
  finiteNumber(label).min(min).max(max);

export const money = (label: string, min: number, max = 100_000_000_000) =>
  finiteNumber(label).min(min).max(max);

export const horizonMonths = (max: number) =>
  finiteNumber('investmentHorizonMonths').int().min(1).max(max);

export const HistoricalDataMapSchema = z
  .record(
    z.string(),
    z.object({
      inflation: percent('historical inflation', -20, 100).optional(),
      nbpRate: percent('historical NBP rate', -10, 100).optional(),
    }),
  )
  .optional();

export const DateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date string',
});

export const DateRangeInputsSchema = z.object({
  purchaseDate: DateStringSchema,
  withdrawalDate: DateStringSchema,
});

export const withDateOrderValidation = <
  T extends z.ZodRawShape & { purchaseDate: z.ZodType<string>; withdrawalDate: z.ZodType<string> },
>(
  schema: z.ZodObject<T>,
) =>
  schema.refine(
    (value) => {
      const dates = value as { purchaseDate: string; withdrawalDate: string };
      return new Date(dates.withdrawalDate).getTime() >= new Date(dates.purchaseDate).getTime();
    },
    {
      message: 'withdrawalDate must be on or after purchaseDate',
      path: ['withdrawalDate'],
    },
  );

export const customPathSchema = (label: string, min: number, max: number) =>
  z
    .array(percent(label, min, max))
    .max(600)
    .optional();

export function validatePathLengths(
  value: {
    customInflation?: number[];
    customNbpRate?: number[];
  },
  horizonYears: number | undefined,
  ctx: z.RefinementCtx,
) {
  if (!horizonYears) {
    return;
  }

  const expectedLength = Math.max(1, Math.ceil(horizonYears));
  for (const [field, path] of [
    ['customInflation', value.customInflation],
    ['customNbpRate', value.customNbpRate],
  ] as const) {
    if (path && path.length !== expectedLength) {
      ctx.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} length must match the scenario horizon in years`,
      });
    }
  }
}
