import { z } from 'zod';

export const PortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const InvestmentLotSchema = z.object({
  portfolioId: z.string().uuid(),
  bondType: z.string(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  isRebought: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});
