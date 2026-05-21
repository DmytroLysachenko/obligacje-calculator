import { NextRequest, NextResponse } from 'next/server';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import {
  applyPortfolioOwnerCookie,
  resolvePortfolioOwner,
} from '@/lib/server/portfolio/access';
import { apiHandler } from '@/lib/server/http/api-handler';
import { createSuccessResponse } from '@/shared/types/api';
import {
  createPortfolioLot,
  deleteOwnerLot,
  listPortfolioLots,
  PortfolioServiceError,
} from '@/lib/server/portfolio/service';
import { createDomainErrorResponse, createValidationErrorResponse } from '@/lib/server/http/responses';

export const GET = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const url = new URL(req.url);
  const portfolioId = url.searchParams.get('portfolioId');

  if (!portfolioId) {
    return createValidationErrorResponse('Portfolio ID is required', 'MISSING_PARAM');
  }

  try {
    const lots = await listPortfolioLots(owner.ownerId, portfolioId);
    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(lots)), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    throw error;
  }
});

export const POST = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const body = await req.json();
  const validated = InvestmentLotSchema.parse(body);

  try {
    const newLot = await createPortfolioLot(owner.ownerId, validated);
    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(newLot)), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    throw error;
  }
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return createValidationErrorResponse('Lot ID is required', 'MISSING_PARAM');
  }

  try {
    await deleteOwnerLot(owner.ownerId, id);
    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse({success: true})), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    throw error;
  }
});

