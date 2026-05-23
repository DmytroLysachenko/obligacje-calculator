import { NextRequest, NextResponse } from 'next/server';
import { PortfolioSchema } from '@/features/bond-core/types/portfolio-schemas';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/server/http/api-handler';
import { createDomainErrorResponse, createValidationErrorResponse } from '@/lib/server/http/responses';
import { getPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';
import {
  createOwnerPortfolio,
  deleteOwnerPortfolio,
  listOwnerPortfolios,
  PortfolioServiceError,
} from '@/lib/server/portfolio/service';

export const GET = apiHandler(async () => {
  const { owner } = await getPortfolioRouteContext();
  const portfolios = await listOwnerPortfolios(owner.ownerId);

  return withPortfolioOwnerResponse(NextResponse.json(createSuccessResponse(portfolios)), owner);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const { owner } = await getPortfolioRouteContext();
  const body = await req.json();
  const validated = PortfolioSchema.parse(body);
  const newPortfolio = await createOwnerPortfolio(owner.ownerId, validated);

  return withPortfolioOwnerResponse(NextResponse.json(createSuccessResponse(newPortfolio)), owner);
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const { owner } = await getPortfolioRouteContext();
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
      NextResponse.json(createSuccessResponse(deletedPortfolio)),
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

