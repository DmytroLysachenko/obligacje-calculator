import { apiHandler } from '@/lib/server/http/api-handler';
import { okJson } from '@/lib/server/http/responses';
import { createPortfolioAccessPayload } from '@/lib/server/portfolio/access-payload';
import { withPortfolioRead } from '@/lib/server/portfolio/http';

export const GET = apiHandler(async () => {
  return withPortfolioRead((owner) => okJson(createPortfolioAccessPayload(owner)));
});
