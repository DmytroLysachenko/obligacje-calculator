import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/server/http/api-handler';
import { simulateOwnerPortfolio } from '@/lib/server/portfolio/queries';
import { okJson } from '@/lib/server/http/responses';
import {
  portfolioDomainErrorResponse,
  withAuthenticatedPortfolioOwner,
} from '@/lib/server/portfolio/http';
import { readJsonBody } from '@/lib/server/http/read-json-body';

const PortfolioSimulationPayloadSchema = z.object({
  portfolioId: z.string().uuid(),
  expectedInflation: z.number().optional(),
});

export const POST = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(async (owner) => {
    const { portfolioId, expectedInflation = 3.5 } = await readJsonBody(
      req,
      PortfolioSimulationPayloadSchema,
    );

    try {
      const result = await simulateOwnerPortfolio(owner.ownerId, portfolioId, {
        expectedInflation,
      });
      return okJson(result);
    } catch (error) {
      const response = portfolioDomainErrorResponse(error);
      if (response) return response;

      throw error;
    }
  });
});
