import { getMultiAssetHistory } from '@/lib/data/market-data';
import { createFallbackMultiAssetHistory } from '@/lib/data/multi-asset-history';
import { apiHandler } from '@/lib/server/http/api-handler';
import { publicChartReadRateLimitPolicy } from '@/lib/server/http/rate-limiter';
import { okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('MultiAssetHistoryApi');

export const GET = apiHandler(
  async () => {
    try {
      const history = await getMultiAssetHistory();
      return okJson(history);
    } catch (error) {
      logger.error('Failed to fetch multi-asset history', error);
      return okJson(createFallbackMultiAssetHistory(), { status: 200 });
    }
  },
  { rateLimitPolicy: publicChartReadRateLimitPolicy },
);
