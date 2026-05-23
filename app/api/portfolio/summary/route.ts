import { NextResponse } from 'next/server';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/server/http/api-handler';
import { summarizeOwnerPortfolios } from '@/lib/server/portfolio/service';
import { getPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';

export const GET = apiHandler(async () => {
  const { owner } = await getPortfolioRouteContext();
  const summary = await summarizeOwnerPortfolios(owner.ownerId);
  return withPortfolioOwnerResponse(NextResponse.json(createSuccessResponse(summary)), owner);
});

