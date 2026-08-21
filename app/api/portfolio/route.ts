import { NextRequest } from 'next/server';

import { PortfolioSchema } from '@/features/bond-core/types/portfolio-schemas';
import { apiHandler } from '@/lib/server/http/api-handler';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { createValidationErrorResponse, okJson } from '@/lib/server/http/responses';
import { portfolioApplication } from '@/lib/server/portfolio/application';
import {
  getPortfolioRouteContext,
  portfolioDomainErrorResponse,
  withAuthenticatedPortfolioOwner,
  withPortfolioOwnerResponse,
} from '@/lib/server/portfolio/http';

export const GET = apiHandler(async () => {
  const { owner } = await getPortfolioRouteContext();
  const portfolios = await portfolioApplication.listPortfolios(owner.ownerId);

  return withPortfolioOwnerResponse(okJson(portfolios), owner);
});

export const POST = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(req, async (owner) => {
    const validated = await readJsonBody(req, PortfolioSchema);
    const newPortfolio = await portfolioApplication.createPortfolio(owner.ownerId, validated);

    return okJson(newPortfolio);
  });
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(req, async (owner) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return createValidationErrorResponse('Missing portfolio id.');
    }

    try {
      const deletedPortfolio = await portfolioApplication.deletePortfolio(owner.ownerId, id);

      return okJson(deletedPortfolio);
    } catch (error) {
      const response = portfolioDomainErrorResponse(error);
      if (response) return response;

      throw error;
    }
  });
});
