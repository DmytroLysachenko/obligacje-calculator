import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '@/shared/types/api';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { apiHandler } from '@/lib/server/http/api-handler';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/server/portfolio/access';
import {
  PortfolioServiceError,
  toggleOwnerPortfolioSharing,
} from '@/lib/server/portfolio/service';
import { createDomainErrorResponse, createValidationErrorResponse } from '@/lib/server/http/responses';

export const POST = apiHandler(async (req: NextRequest) => {
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const {portfolioId, isPublic} = await req.json();

  if (!portfolioId) {
    return createValidationErrorResponse('Portfolio ID is required');
  }

  try {
    const result = await toggleOwnerPortfolioSharing(owner.ownerId, portfolioId, Boolean(isPublic));
    return applyPortfolioOwnerCookie(
      NextResponse.json(createSuccessResponse(result)),
      owner,
    );
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return applyPortfolioOwnerCookie(
        createDomainErrorResponse(error),
        owner,
      );
    }

    throw error;
  }
});

