import { NextRequest } from 'next/server';
import { PortfolioSchema } from '@/features/bond-core/types/portfolio-schemas';
import { apiHandler } from '@/lib/server/http/api-handler';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { createDomainErrorResponse, createValidationErrorResponse, okJson } from '@/lib/server/http/responses';
import {
  getAuthenticatedPortfolioRouteContext,
  getPortfolioRouteContext,
  withPortfolioOwnerResponse,
} from '@/lib/server/portfolio/http';
import { PortfolioServiceError } from '@/lib/server/portfolio/errors';
import { listOwnerPortfolios } from '@/lib/server/portfolio/queries';
import { createOwnerPortfolio, deleteOwnerPortfolio } from '@/lib/server/portfolio/commands';

export const GET = apiHandler(async () => {
  const { owner } = await getPortfolioRouteContext();
  const portfolios = await listOwnerPortfolios(owner.ownerId);

  return withPortfolioOwnerResponse(okJson(portfolios), owner);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const validated = await readJsonBody(req, PortfolioSchema);
  const newPortfolio = await createOwnerPortfolio(owner.ownerId, validated);

  return withPortfolioOwnerResponse(okJson(newPortfolio), owner);
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return withPortfolioOwnerResponse(
      createValidationErrorResponse('Missing portfolio id.'),
      owner,
    );
  }

  try {
    const deletedPortfolio = await deleteOwnerPortfolio(owner.ownerId, id);

    return withPortfolioOwnerResponse(
      okJson(deletedPortfolio),
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

