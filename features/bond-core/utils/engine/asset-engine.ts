import { Decimal } from 'decimal.js';
import { BaseInstrumentInputs } from '../../types/instruments';
import { differenceInMonths, parseISO, addMonths } from 'date-fns';

export interface SimpleAssetInputs extends BaseInstrumentInputs {
  annualGrowthRate: number;
}

export interface SimpleAssetResult {
  initialInvestment: number;
  finalNominalValue: number;
  finalRealValue: number;
  totalProfit: number;
  timeline: {
    date: string;
    nominalValue: number;
    realValue: number;
  }[];
}

/**
 * Pure engine for simple percentage-based growth assets.
 */
export function calculateSimpleAsset(inputs: SimpleAssetInputs): SimpleAssetResult {
  const startDate = parseISO(inputs.purchaseDate);
  const endDate = parseISO(inputs.withdrawalDate);
  const totalMonths = differenceInMonths(endDate, startDate);
  
  const monthlyRate = new Decimal(inputs.annualGrowthRate).dividedBy(100).dividedBy(12);
  let currentValue = new Decimal(inputs.initialInvestment);
  
  const timeline = [];
  
  // Initial point
  timeline.push({
    date: inputs.purchaseDate,
    nominalValue: currentValue.toNumber(),
    realValue: currentValue.toNumber(),
  });

  for (let m = 1; m <= totalMonths; m++) {
    currentValue = currentValue.times(new Decimal(1).plus(monthlyRate));
    
    // Simplification: no inflation adjustment here yet, 
    // real-return module should be unified later.
    
    if (m % 12 === 0 || m === totalMonths) {
      timeline.push({
        date: addMonths(startDate, m).toISOString(),
        nominalValue: currentValue.toNumber(),
        realValue: currentValue.toNumber(), // Placeholder
      });
    }
  }

  return {
    initialInvestment: inputs.initialInvestment,
    finalNominalValue: currentValue.toNumber(),
    finalRealValue: currentValue.toNumber(), // Placeholder
    totalProfit: currentValue.minus(inputs.initialInvestment).toNumber(),
    timeline,
  };
}
