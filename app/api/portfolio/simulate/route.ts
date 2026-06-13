import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/server/http/api-handler';
import {
  PortfolioServiceError,
  simulateOwnerPortfolio,
} from '@/lib/server/portfolio/service';
import { createDomainErrorResponse } from '@/lib/server/http/responses';
import { getAuthenticatedPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';
import { readJsonBody } from '@/lib/server/http/read-json-body';

const PortfolioSimulationPayloadSchema = z.object({
  portfolioId: z.string().uuid(),
  expectedInflation: z.number().optional(),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const { portfolioId, expectedInflation = 3.5 } = await readJsonBody(
    req,
    PortfolioSimulationPayloadSchema,
  );

  try {
    const result = await simulateOwnerPortfolio(owner.ownerId, portfolioId, {expectedInflation});
    return withPortfolioOwnerResponse(NextResponse.json(createSuccessResponse(result)), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return withPortfolioOwnerResponse(
        createDomainErrorResponse(error),
        owner,
      );
    }

    throw error;
  }
});

