import { NextRequest, NextResponse } from 'next/server';
import { calculateRegularInvestment } from '@/features/bond-core/utils/calculations';
import { RegularInvestmentInputs } from '@/features/bond-core/types';

export async function POST(req: NextRequest) {
  try {
    const inputs: RegularInvestmentInputs = await req.json();
    
    // Validate inputs (basic)
    if (!inputs.bondType || !inputs.contributionAmount) {
      return NextResponse.json({ error: 'Missing required inputs' }, { status: 400 });
    }

    const result = calculateRegularInvestment(inputs);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}
