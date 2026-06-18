import { NextRequest, NextResponse } from 'next/server';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import { apiHandler } from '@/lib/server/http/api-handler';
import { createSuccessResponse } from '@/shared/types/api';
import { PortfolioServiceError } from '@/lib/server/portfolio/errors';
import { listPortfolioLots } from '@/lib/server/portfolio/queries';
import { createPortfolioLot, deleteOwnerLot } from '@/lib/server/portfolio/commands';
import { createDomainErrorResponse, createValidationErrorResponse } from '@/lib/server/http/responses';
import {
  getAuthenticatedPortfolioRouteContext,
  getPortfolioRouteContext,
  withPortfolioOwnerResponse,
} from '@/lib/server/portfolio/http';

export const GET = apiHandler(async (req: NextRequest) => {
  const { owner } = await getPortfolioRouteContext();
  const url = new URL(req.url);
  const portfolioId = url.searchParams.get('portfolioId');

  if (!portfolioId) {
    return createValidationErrorResponse('Portfolio ID is required', 'MISSING_PARAM');
  }

  try {
    const lots = await listPortfolioLots(owner.ownerId, portfolioId);
    return withPortfolioOwnerResponse(NextResponse.json(createSuccessResponse(lots)), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    throw error;
  }
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const body = await req.json();
  const validated = InvestmentLotSchema.parse(body);

  try {
    const newLot = await createPortfolioLot(owner.ownerId, validated);
    return withPortfolioOwnerResponse(NextResponse.json(createSuccessResponse(newLot)), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    throw error;
  }
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return createValidationErrorResponse('Lot ID is required', 'MISSING_PARAM');
  }

  try {
    await deleteOwnerLot(owner.ownerId, id);
    return withPortfolioOwnerResponse(NextResponse.json(createSuccessResponse({success: true})), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    throw error;
  }
});

