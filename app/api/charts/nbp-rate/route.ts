import { getFallbackNbpSeries, getNbpChartSeries } from '@/lib/data/chart-series';
import { okJson } from '@/lib/server/http/responses';

export async function GET() {
  try {
    const response = await getNbpChartSeries();
    return okJson(response);
  } catch (error) {
    console.error('Failed to fetch NBP data:', error);
    return okJson(getFallbackNbpSeries());
  }
}
