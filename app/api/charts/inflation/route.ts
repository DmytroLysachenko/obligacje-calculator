import { getFallbackInflationSeries, getInflationChartSeries } from '@/lib/data/chart-series';
import { okJson } from '@/lib/server/http/responses';

export async function GET() {
  try {
    const response = await getInflationChartSeries();
    return okJson(response);
  } catch (error) {
    console.error('Failed to fetch inflation data:', error);
    return okJson(getFallbackInflationSeries());
  }
}
