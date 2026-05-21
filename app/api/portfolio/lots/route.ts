import { NextRequest, NextResponse } from 'next/server';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import {
  applyPortfolioOwnerCookie,
  resolvePortfolioOwner,
} from '@/lib/portfolio-access';
import { apiHandler } from '@/lib/api-handler';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import {
  createPortfolioLot,
  deleteOwnerLot,
  listPortfolioLots,
  PortfolioServiceError,
} from '@/lib/server/portfolio/service';

export const GET = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const url = new URL(req.url);
  const portfolioId = url.searchParams.get('portfolioId');

  if (!portfolioId) {
    return NextResponse.json(
      createErrorResponse('Portfolio ID is required', 'MISSING_PARAM'),
      {status: 400},
    );
  }

  try {
    const lots = await listPortfolioLots(owner.ownerId, portfolioId);
    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(lots)), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.code, error.details),
        {status: error.status},
      );
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
      return NextResponse.json(
        createErrorResponse(error.message, error.code, error.details),
        {status: error.status},
      );
    }

    throw error;
  }
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      createErrorResponse('Lot ID is required', 'MISSING_PARAM'),
      {status: 400},
    );
  }

  try {
    await deleteOwnerLot(owner.ownerId, id);
    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse({success: true})), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.code, error.details),
        {status: error.status},
      );
    }

    throw error;
  }
});
