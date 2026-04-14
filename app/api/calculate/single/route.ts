import { NextRequest, NextResponse } from 'next/server';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { BondInputsSchema } from '@/features/bond-core/types/schemas';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/api-handler';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculationCache = new Map<string, any>();
const MAX_CACHE_SIZE = 500;

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const validatedBody = BondInputsSchema.parse(body);

  const cacheKey = JSON.stringify(validatedBody);
  if (calculationCache.has(cacheKey)) {
    return NextResponse.json(createSuccessResponse(calculationCache.get(cacheKey)));
  }

  const envelope = await calculationService.calculate({
    kind: ScenarioKind.SINGLE_BOND,
    payload: validatedBody,
  });
  
  if (calculationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = calculationCache.keys().next().value;
    if (firstKey) calculationCache.delete(firstKey);
  }
  calculationCache.set(cacheKey, envelope);

  return NextResponse.json(createSuccessResponse(envelope));
});
