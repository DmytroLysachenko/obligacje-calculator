import { bondDefinitionRepository } from '@/lib/data/market-data';
import { errorJson, okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('BondDefinitionsApi');

export async function GET() {
  try {
    const definitions = await bondDefinitionRepository.getDefinitionsMap();
    return okJson(definitions);
  } catch (error) {
    logger.error('Failed to fetch bond definitions', error);
    return errorJson('Failed to fetch definitions', 'INTERNAL_ERROR', undefined, { status: 500 });
  }
}
