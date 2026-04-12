import { NextRequest, NextResponse } from 'next/server';
import { getBondDefinitionsMap } from '@/lib/data-access';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';

export async function GET(req: NextRequest) {
  try {
    const definitions = await getBondDefinitionsMap();
    return NextResponse.json(createSuccessResponse(definitions));
  } catch (error) {
    console.error('Failed to fetch bond definitions:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch definitions', 'INTERNAL_ERROR'), 
      { status: 500 }
    );
  }
}
