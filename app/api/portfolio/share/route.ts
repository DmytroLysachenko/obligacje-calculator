import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/server/http/api-handler';
import {
  PortfolioServiceError,
} from '@/lib/server/portfolio/errors';
import { toggleOwnerPortfolioSharing } from '@/lib/server/portfolio/commands';
import { createDomainErrorResponse } from '@/lib/server/http/responses';
import { getAuthenticatedPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';
import { readJsonBody } from '@/lib/server/http/read-json-body';

const PortfolioSharePayloadSchema = z.object({
  portfolioId: z.string().uuid(),
  isPublic: z.boolean().optional(),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const { portfolioId, isPublic } = await readJsonBody(req, PortfolioSharePayloadSchema);

  try {
    const result = await toggleOwnerPortfolioSharing(owner.ownerId, portfolioId, Boolean(isPublic));
    return withPortfolioOwnerResponse(
      NextResponse.json(createSuccessResponse(result)),
      owner,
    );
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

