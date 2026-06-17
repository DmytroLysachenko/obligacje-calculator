import { getMacroAssumptionDefaults } from '@/lib/data/market-data';
import { errorJson, okJson } from '@/lib/server/http/responses';

export async function GET() {
  try {
    const defaults = await getMacroAssumptionDefaults();
    return okJson(defaults);
  } catch (error) {
    console.error('Failed to fetch calculation defaults:', error);
    return errorJson('Failed to fetch calculation defaults', 'INTERNAL_ERROR', undefined, {status: 500});
  }
}
