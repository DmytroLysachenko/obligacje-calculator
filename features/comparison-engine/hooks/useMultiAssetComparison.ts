import { useState, useMemo } from 'react';
import { calculateAssetGrowth } from '../../bond-core/utils/asset-calculations';
import { BondInputs, BondType } from '../../bond-core/types';
import { calculateBondInvestment } from '../../bond-core/utils/calculations';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';

export function useMultiAssetComparison() {
  const [initialSum, setInitialSum] = useState(10000);
  
  const sp500 = useMemo(() => calculateAssetGrowth(initialSum, 'sp500'), [initialSum]);
  const gold = useMemo(() => calculateAssetGrowth(initialSum, 'gold'), [initialSum]);
  const savings = useMemo(() => calculateAssetGrowth(initialSum, 'savings'), [initialSum]);
  
  // Benchmark Bond (EDO 10y)
  const bondResults = useMemo(() => {
    const def = BOND_DEFINITIONS[BondType.EDO];
    const inputs: BondInputs = {
      bondType: BondType.EDO,
      initialInvestment: initialSum,
      firstYearRate: def.firstYearRate,
      expectedInflation: 3.5, // Representative average
      margin: def.margin,
      duration: 10,
      earlyWithdrawalFee: def.earlyWithdrawalFee,
      taxRate: 19,
      isCapitalized: true,
      payoutFrequency: def.payoutFrequency,
      purchaseDate: new Date('2020-01-01').toISOString(),
      withdrawalDate: new Date('2030-01-01').toISOString(),
      isRebought: false,
      rebuyDiscount: def.rebuyDiscount,
      taxStrategy: 0 as any // STANDARD
    };
    return calculateBondInvestment(inputs);
  }, [initialSum]);

  // Transform bond results to match AssetResult format for the chart
  const bondsFormatted = useMemo(() => {
    return bondResults.timeline.map(p => ({
      date: `Year ${p.year}`,
      nominalValue: p.nominalValueAfterInterest,
      realValue: p.realValue,
      drawdown: 0 // Bonds don't have price drawdown in this model
    }));
  }, [bondResults]);

  return {
    initialSum,
    setInitialSum,
    assets: {
      sp500,
      gold,
      savings,
      bonds: bondsFormatted
    }
  };
}
