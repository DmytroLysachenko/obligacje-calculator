import { NextResponse } from 'next/server';
import { getMacroAssumptionDefaults } from '@/lib/data/market-data';
import { createErrorResponse, createSuccessResponse } from '@/shared/types/api';

export async function GET() {
  try {
    const defaults = await getMacroAssumptionDefaults();
    return NextResponse.json(createSuccessResponse(defaults));
  } catch (error) {
    console.error('Failed to fetch calculation defaults:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch calculation defaults', 'INTERNAL_ERROR'),
      { status: 500 },
    );
  }
}
