import { NextRequest, NextResponse } from 'next/server';
import { calculateBondInvestment } from '@/features/bond-core/utils/calculations';
import { BondInputs } from '@/features/bond-core/types';

export async function POST(req: NextRequest) {
  try {
    const inputs: BondInputs = await req.json();
    
    // Validate inputs (basic)
    if (!inputs.bondType || !inputs.initialInvestment) {
      return NextResponse.json({ error: 'Missing required inputs' }, { status: 400 });
    }

    const result = calculateBondInvestment(inputs);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}
