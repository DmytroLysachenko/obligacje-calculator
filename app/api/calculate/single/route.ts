import { NextRequest, NextResponse } from 'next/server';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { BondInputsSchema } from '@/features/bond-core/types/schemas';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/api-handler';

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const validatedBody = BondInputsSchema.parse(body);

  const envelope = await calculationService.calculate({
    kind: ScenarioKind.SINGLE_BOND,
    payload: validatedBody,
  });
  
  return NextResponse.json(createSuccessResponse(envelope));
});
