import { NextRequest, NextResponse } from 'next/server';
import { calculateRegularInvestment } from '@/features/bond-core/utils/calculations';
import { RegularInvestmentInputsSchema } from '@/features/bond-core/types/schemas';
import { z } from 'zod';
import { getHistoricalDataMap } from '@/lib/data-access';
import { subMonths, format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedInputs = RegularInvestmentInputsSchema.parse(body);

    // Pre-fetch historical data from DB
    const startDate = new Date(validatedInputs.purchaseDate);
    // Look back at least 2 months for lag
    const fromDate = format(subMonths(startDate, 3), 'yyyy-MM-01');
    const toDate = validatedInputs.withdrawalDate.substring(0, 10);
    
    const dbHistoricalData = await getHistoricalDataMap(fromDate, toDate);
    
    // Merge with inputs
    validatedInputs.historicalData = {
      ...dbHistoricalData,
      ...validatedInputs.historicalData
    };

    const result = calculateRegularInvestment(validatedInputs);
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}
