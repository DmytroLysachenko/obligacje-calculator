import { NextRequest, NextResponse } from 'next/server';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';

const BondOptimizerSchema = z.object({
  initialInvestment: z.number().min(100),
  purchaseDate: z.string(),
  withdrawalDate: z.string().optional(),
  investmentHorizonMonths: z.number().min(1).optional(),
  expectedInflation: z.number(),
  expectedNbpRate: z.number().optional(),
  taxStrategy: z.string().optional(),
  includeFamilyBonds: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = BondOptimizerSchema.parse(body);

    const envelope = await calculationService.calculate({
      kind: ScenarioKind.BOND_OPTIMIZER,
      payload: validated as unknown as import('@/features/bond-core/types/scenarios').BondOptimizerPayload,
    });
    
    return NextResponse.json(createSuccessResponse(envelope));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Validation failed', 'VALIDATION_ERROR', error.issues), 
        { status: 400 }
      );
    }
    console.error('Optimization calculation failed:', error);
    return NextResponse.json(
      createErrorResponse('Calculation failed', 'INTERNAL_ERROR'), 
      { status: 500 }
    );
  }
}
