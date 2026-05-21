import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sharedSingleScenarios } from '@/db/schema';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { createErrorResponse, createSuccessResponse } from '@/shared/types/api';
import {
  buildSharedSingleScenarioPayload,
  serializeSharedSingleScenario,
} from '@/shared/lib/single-scenario-share';
import { BondInputsSchema } from '@/features/bond-core/types/schemas';

export async function POST(req: NextRequest) {
  try {
    await ensurePortfolioSchemaCompat();
    const body = await req.json();
    const validatedInputs = BondInputsSchema.parse(body.inputs);
    const normalizedPayload = buildSharedSingleScenarioPayload(
      validatedInputs,
      typeof body.description === 'string' ? body.description : undefined,
    );

    const [created] = await db
      .insert(sharedSingleScenarios)
      .values({
        title: normalizedPayload.title,
        description: normalizedPayload.description,
        scenarioKind: 'single-bond',
        payloadJson: serializeSharedSingleScenario(normalizedPayload),
        calculationVersion: 'single-bond-v2',
      })
      .returning({
        shareId: sharedSingleScenarios.shareId,
      });

    return NextResponse.json(
      createSuccessResponse({
        shareId: created.shareId,
        shareUrl: `${req.nextUrl.origin}/shared-scenarios/${created.shareId}`,
      }),
    );
  } catch (error) {
    console.error('Failed to create single-scenario share snapshot:', error);
    return NextResponse.json(
      createErrorResponse('Failed to create scenario share link', 'INTERNAL_ERROR'),
      { status: 500 },
    );
  }
}

