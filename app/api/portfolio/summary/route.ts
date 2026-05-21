import { NextResponse } from 'next/server';
import { resolvePortfolioOwner, applyPortfolioOwnerCookie } from '@/lib/portfolio-access';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/api-handler';
import { ensurePortfolioSchemaCompat } from '@/lib/db-schema-compat';
import { summarizeOwnerPortfolios } from '@/lib/server/portfolio/service';

export const GET = apiHandler(async () => {
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const summary = await summarizeOwnerPortfolios(owner.ownerId);
  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(summary)), owner);
});
