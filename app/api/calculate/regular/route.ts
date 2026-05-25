import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { createCalculationRoute } from '@/lib/server/http/calculation-route';

export const POST = createCalculationRoute(ScenarioKind.REGULAR_INVESTMENT);
