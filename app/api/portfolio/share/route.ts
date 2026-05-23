import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/server/http/api-handler';
import {
  PortfolioServiceError,
  toggleOwnerPortfolioSharing,
} from '@/lib/server/portfolio/service';
import { createDomainErrorResponse, createValidationErrorResponse } from '@/lib/server/http/responses';
import { getPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';

export const POST = apiHandler(async (req: NextRequest) => {
  const { owner } = await getPortfolioRouteContext();
  const {portfolioId, isPublic} = await req.json();

  if (!portfolioId) {
    return createValidationErrorResponse('Portfolio ID is required');
  }

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

