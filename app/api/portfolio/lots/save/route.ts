import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createPortfolioLotWithBuyTransaction } from '@/lib/server/portfolio/commands';
import { errorJson, okJson } from '@/lib/server/http/responses';
import { apiHandler } from '@/lib/server/http/api-handler';
import {
  portfolioDomainErrorResponse,
  withAuthenticatedPortfolioOwner,
} from '@/lib/server/portfolio/http';
import { readJsonBody } from '@/lib/server/http/read-json-body';

const SavePortfolioLotPayloadSchema = z.object({
  portfolioId: z.string().uuid(),
  bondType: z.string().min(1),
  purchaseDate: z.string().min(1),
  amount: z.number().positive(),
  isRebought: z.boolean().optional(),
  notes: z.string().optional(),
});

export const POST = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(async (owner) => {
    try {
      const { portfolioId, bondType, purchaseDate, amount, isRebought, notes } = await readJsonBody(
        req,
        SavePortfolioLotPayloadSchema,
      );

      const result = await createPortfolioLotWithBuyTransaction(owner.ownerId, {
        portfolioId,
        bondType,
        purchaseDate,
        amount,
        isRebought,
        notes,
      });

      return okJson(result);
    } catch (error) {
      const response = portfolioDomainErrorResponse(error);
      if (response) return response;

      console.error('Failed to save lot transactionally:', error);
      return errorJson('Internal error', 'INTERNAL_ERROR', undefined, { status: 500 });
    }
  });
});
