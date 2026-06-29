import { getFallbackInflationSeries, getInflationChartSeries } from '@/lib/data/chart-series';
import { okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('InflationChartApi');

export async function GET() {
  try {
    const response = await getInflationChartSeries();
    return okJson(response);
  } catch (error) {
    logger.error('Failed to fetch inflation data', error);
    return okJson(getFallbackInflationSeries());
  }
}
