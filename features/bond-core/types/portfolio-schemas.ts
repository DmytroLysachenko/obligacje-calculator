import { z } from 'zod';

import { IsoCalendarDateSchema } from './iso-calendar-date';

export const PortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const InvestmentLotSchema = z.object({
  portfolioId: z.string().uuid(),
  bondType: z.string(),
  purchaseDate: IsoCalendarDateSchema,
  amount: z.number().positive(),
  selectedSeriesId: z.string().uuid().nullable().optional(),
  isRebought: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});
