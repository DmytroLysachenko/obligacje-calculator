import { NextRequest, NextResponse } from 'next/server';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { createErrorResponse, createSuccessResponse } from '@/shared/types/api';
import { createSharedSingleScenario } from '@/lib/server/shared-scenarios/service';

export async function POST(req: NextRequest) {
  try {
    await ensurePortfolioSchemaCompat();
    const body = await req.json();
    const shareSnapshot = await createSharedSingleScenario({
      inputs: body.inputs,
      description: body.description,
      origin: req.nextUrl.origin,
    });

    return NextResponse.json(
      createSuccessResponse(shareSnapshot),
    );
  } catch (error) {
    console.error('Failed to create single-scenario share snapshot:', error);
    return NextResponse.json(
      createErrorResponse('Failed to create scenario share link', 'INTERNAL_ERROR'),
      { status: 500 },
    );
  }
}

