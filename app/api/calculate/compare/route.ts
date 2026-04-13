import { NextRequest, NextResponse } from 'next/server';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { BondComparisonScenarioPayloadSchema } from '@/features/bond-core/types/schemas';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/api-handler';

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const validatedPayload = BondComparisonScenarioPayloadSchema.parse(body);

  const envelope = await calculationService.calculate({
    kind: ScenarioKind.BOND_COMPARISON,
    payload: validatedPayload,
  });
  return NextResponse.json(createSuccessResponse(envelope));
});
