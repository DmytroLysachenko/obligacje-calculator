import { getFallbackNbpSeries, getNbpChartSeries } from '@/lib/data/chart-series';
import { okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('NbpRateChartApi');

export async function GET() {
  try {
    const response = await getNbpChartSeries();
    return okJson(response);
  } catch (error) {
    logger.error('Failed to fetch NBP data', error);
    return okJson(getFallbackNbpSeries());
  }
}
