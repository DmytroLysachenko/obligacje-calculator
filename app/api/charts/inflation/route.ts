import { getFallbackInflationSeries, getInflationChartSeries } from '@/lib/data/chart-series';
import { apiHandler } from '@/lib/server/http/api-handler';
import { publicChartReadRateLimitPolicy } from '@/lib/server/http/rate-limiter';
import { okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('InflationChartApi');

export const GET = apiHandler(
  async () => {
    try {
      const response = await getInflationChartSeries();
      return okJson(response);
    } catch (error) {
      logger.error('Failed to fetch inflation data', error);
      return okJson(getFallbackInflationSeries());
    }
  },
  { rateLimitPolicy: publicChartReadRateLimitPolicy },
);
