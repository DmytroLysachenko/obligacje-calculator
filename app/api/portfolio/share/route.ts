import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/server/http/api-handler';
import { toggleOwnerPortfolioSharing } from '@/lib/server/portfolio/commands';
import { okJson } from '@/lib/server/http/responses';
import {
  portfolioDomainErrorResponse,
  withAuthenticatedPortfolioOwner,
} from '@/lib/server/portfolio/http';
import { readJsonBody } from '@/lib/server/http/read-json-body';

const PortfolioSharePayloadSchema = z.object({
  portfolioId: z.string().uuid(),
  isPublic: z.boolean().optional(),
});

export const POST = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(async (owner) => {
    const { portfolioId, isPublic } = await readJsonBody(req, PortfolioSharePayloadSchema);

    try {
      const result = await toggleOwnerPortfolioSharing(
        owner.ownerId,
        portfolioId,
        Boolean(isPublic),
      );
      return okJson(result);
    } catch (error) {
      const response = portfolioDomainErrorResponse(error);
      if (response) return response;

      throw error;
    }
  });
});
