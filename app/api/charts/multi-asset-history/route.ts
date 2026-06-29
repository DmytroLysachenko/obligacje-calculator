import { getMultiAssetHistory } from '@/lib/data/market-data';
import { createFallbackMultiAssetHistory } from '@/lib/data/multi-asset-history';
import { okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('MultiAssetHistoryApi');

export async function GET() {
  try {
    const history = await getMultiAssetHistory();
    return okJson(history);
  } catch (error) {
    logger.error('Failed to fetch multi-asset history', error);
    return okJson(createFallbackMultiAssetHistory(), { status: 200 });
  }
}
