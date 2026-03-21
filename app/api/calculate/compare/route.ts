import { NextRequest, NextResponse } from 'next/server';
import { calculateBondInvestment } from '@/features/bond-core/utils/calculations';
import { BondType, BondInputs, TaxStrategy } from '@/features/bond-core/types';
import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      bondTypes, 
      initialInvestment, 
      purchaseDate, 
      withdrawalDate, 
      expectedInflation, 
      expectedNbpRate,
      taxStrategy,
      reinvest = true
    } = body;

    if (!bondTypes || !Array.isArray(bondTypes)) {
      return NextResponse.json({ error: 'Missing bondTypes array' }, { status: 400 });
    }

    const results = bondTypes.map((type: BondType) => {
      const def = BOND_DEFINITIONS[type];
      const inputs: BondInputs = {
        bondType: type,
        initialInvestment,
        firstYearRate: def.firstYearRate,
        expectedInflation,
        expectedNbpRate: expectedNbpRate || 5.25,
        margin: def.margin,
        duration: def.duration,
        earlyWithdrawalFee: def.earlyWithdrawalFee,
        taxRate: 19,
        isCapitalized: def.isCapitalized,
        payoutFrequency: def.payoutFrequency,
        purchaseDate,
        withdrawalDate,
        isRebought: false,
        rebuyDiscount: def.rebuyDiscount,
        taxStrategy: taxStrategy || TaxStrategy.STANDARD,
      };

      return {
        type,
        name: def.fullName.en, // Or handle locale
        results: calculateBondInvestment({ ...inputs, rollover: reinvest })
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Comparison calculation failed:', error);
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
  }
}
