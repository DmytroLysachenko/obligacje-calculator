import { NextRequest, NextResponse } from 'next/server';
import { PortfolioSchema } from '@/features/bond-core/types/portfolio-schemas';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/server/portfolio/access';
import { createErrorResponse, createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/server/http/api-handler';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import {
  createOwnerPortfolio,
  deleteOwnerPortfolio,
  listOwnerPortfolios,
  PortfolioServiceError,
} from '@/lib/server/portfolio/service';

export const GET = apiHandler(async () => {
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const portfolios = await listOwnerPortfolios(owner.ownerId);

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(portfolios)), owner);
});

export const POST = apiHandler(async (req: NextRequest) => {
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const body = await req.json();
  const validated = PortfolioSchema.parse(body);
  const newPortfolio = await createOwnerPortfolio(owner.ownerId, validated);

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(newPortfolio)), owner);
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return applyPortfolioOwnerCookie(
      NextResponse.json(createErrorResponse('Missing portfolio id.', 'VALIDATION_ERROR'), { status: 400 }),
      owner,
    );
  }

  try {
    const deletedPortfolio = await deleteOwnerPortfolio(owner.ownerId, id);

    return applyPortfolioOwnerCookie(
      NextResponse.json(createSuccessResponse(deletedPortfolio)),
      owner,
    );
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

