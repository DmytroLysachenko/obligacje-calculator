import { NextRequest } from 'next/server';
import { z } from 'zod';

import { apiHandler } from '@/lib/server/http/api-handler';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { errorJson, okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';
import { createPortfolioLotWithBuyTransaction } from '@/lib/server/portfolio/commands';
import {
  portfolioDomainErrorResponse,
  withAuthenticatedPortfolioOwner,
} from '@/lib/server/portfolio/http';

const logger = createServerLogger('PortfolioLotSaveApi');

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

      logger.error('Failed to save lot transactionally', error);
      return errorJson('Internal error', 'INTERNAL_ERROR', undefined, { status: 500 });
    }
  });
});
