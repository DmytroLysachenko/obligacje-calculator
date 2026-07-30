import { z } from 'zod';

import { BondType } from '@/features/bond-core/types';
import { IsoCalendarDateSchema } from '@/features/bond-core/types/iso-calendar-date';

export const ImportedLotSchema = z
  .object({
    bondType: z.enum(BondType),
    purchaseDate: IsoCalendarDateSchema,
    amount: z
      .union([z.string(), z.number()])
      .refine(
        (value) =>
          /^\d+(\.\d{1,2})?$/.test(String(value)) &&
          Number(value) > 0 &&
          Number(value) <= 10_000_000,
      ),
    isRebought: z.boolean().optional(),
    notes: z.string().trim().max(2_000).optional(),
  })
  .strict();

export const ImportPayloadSchema = z
  .object({
    portfolio: z
      .object({
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(2_000).optional(),
        lots: z.array(ImportedLotSchema).min(1).max(500),
      })
      .strict(),
  })
  .strict();
