import { bondDefinitionRepository } from '@/lib/data/market-data';
import { apiHandler } from '@/lib/server/http/api-handler';
import { defaultApiRateLimitPolicy } from '@/lib/server/http/rate-limiter';
import { okJson } from '@/lib/server/http/responses';

export const GET = apiHandler(
  async () => okJson(await bondDefinitionRepository.getDefinitionsMap()),
  { rateLimitPolicy: defaultApiRateLimitPolicy },
);
