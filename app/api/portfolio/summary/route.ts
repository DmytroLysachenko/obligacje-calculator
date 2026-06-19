import { apiHandler } from '@/lib/server/http/api-handler';
import { okJson } from '@/lib/server/http/responses';
import { summarizeOwnerPortfolios } from '@/lib/server/portfolio/queries';
import { getPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';

export const GET = apiHandler(async () => {
  const { owner } = await getPortfolioRouteContext();
  const summary = await summarizeOwnerPortfolios(owner.ownerId);
  return withPortfolioOwnerResponse(okJson(summary), owner);
});

