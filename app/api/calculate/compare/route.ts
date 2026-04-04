import { NextRequest, NextResponse } from 'next/server';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const envelope = await calculationService.calculate({
      kind: ScenarioKind.BOND_COMPARISON,
      payload: body,
    });
    return NextResponse.json(createSuccessResponse(envelope));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Validation failed', 'VALIDATION_ERROR', error.issues), 
        { status: 400 }
      );
    }
    console.error('Comparison calculation failed:', error);
    return NextResponse.json(
      createErrorResponse('Calculation failed', 'INTERNAL_ERROR'), 
      { status: 500 }
    );
  }
}
