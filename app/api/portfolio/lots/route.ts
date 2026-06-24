import { NextRequest } from 'next/server';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import { apiHandler } from '@/lib/server/http/api-handler';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { listPortfolioLots } from '@/lib/server/portfolio/queries';
import { createPortfolioLot, deleteOwnerLot } from '@/lib/server/portfolio/commands';
import { createValidationErrorResponse, okJson } from '@/lib/server/http/responses';
import {
  getPortfolioRouteContext,
  portfolioDomainErrorResponse,
  withAuthenticatedPortfolioOwner,
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
    return withPortfolioOwnerResponse(okJson(lots), owner);
  } catch (error) {
    const response = portfolioDomainErrorResponse(error);
    if (response) return response;

    throw error;
  }
});

export const POST = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(async (owner) => {
    const validated = await readJsonBody(req, InvestmentLotSchema);

    try {
      const newLot = await createPortfolioLot(owner.ownerId, validated);
      return okJson(newLot);
    } catch (error) {
      const response = portfolioDomainErrorResponse(error);
      if (response) return response;

      throw error;
    }
  });
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(async (owner) => {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return createValidationErrorResponse('Lot ID is required', 'MISSING_PARAM');
    }

    try {
      await deleteOwnerLot(owner.ownerId, id);
      return okJson({ success: true });
    } catch (error) {
      const response = portfolioDomainErrorResponse(error);
      if (response) return response;

      throw error;
    }
  });
});
