import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/server/portfolio/access';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { apiHandler } from '@/lib/server/http/api-handler';
import {
  PortfolioServiceError,
  simulateOwnerPortfolio,
} from '@/lib/server/portfolio/service';

export const POST = apiHandler(async (req: NextRequest) => {
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const body = await req.json();
  const {portfolioId, expectedInflation = 3.5} = body;

  if (!portfolioId) {
    return NextResponse.json(createErrorResponse('Portfolio ID is required', 'VALIDATION_ERROR'), {status: 400});
  }

  try {
    const result = await simulateOwnerPortfolio(owner.ownerId, portfolioId, {expectedInflation});
    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(result)), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return applyPortfolioOwnerCookie(
        NextResponse.json(createErrorResponse(error.message, error.code, error.details), {status: error.status}),
        owner,
      );
    }

    throw error;
  }
});

