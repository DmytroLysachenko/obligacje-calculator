'use client';

import { useState, useMemo } from 'react';
import { BondType, RegularInvestmentInputs, InvestmentFrequency, TaxStrategy } from '../../bond-core/types';
import { calculateRegularInvestment } from '../../bond-core/utils/calculations';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { addYears } from 'date-fns';

const DEFAULT_BOND = BondType.EDO;
const def = BOND_DEFINITIONS[DEFAULT_BOND];
const today = new Date();

const DEFAULT_INPUTS: RegularInvestmentInputs = {
  bondType: DEFAULT_BOND,
  contributionAmount: 1000,
  frequency: InvestmentFrequency.MONTHLY,
  totalHorizon: 10,
  firstYearRate: def.firstYearRate,
  expectedInflation: 3.5,
  margin: def.margin,
  duration: def.duration,
  earlyWithdrawalFee: def.earlyWithdrawalFee,
  taxRate: 19,
  isCapitalized: def.isCapitalized,
  payoutFrequency: def.payoutFrequency,
  purchaseDate: today.toISOString(),
  withdrawalDate: addYears(today, 10).toISOString(),
  isRebought: false,
  rebuyDiscount: def.rebuyDiscount,
  taxStrategy: TaxStrategy.STANDARD,
};

export function useLadder() {
  const [inputs, setInputs] = useState<RegularInvestmentInputs>(DEFAULT_INPUTS);

  const results = useMemo(() => {
    return calculateRegularInvestment(inputs);
  }, [inputs]);

  const updateInput = (key: keyof RegularInvestmentInputs, value: string | number | boolean | undefined) => {
    setInputs((prev) => {
      const newInputs = { ...prev, [key]: value };
      if (key === 'totalHorizon') {
        newInputs.withdrawalDate = addYears(new Date(prev.purchaseDate), Number(value)).toISOString();
      }
      return newInputs;
    });
  };

  const setBondType = (type: BondType) => {
    const def = BOND_DEFINITIONS[type];
    setInputs((prev) => ({
      ...prev,
      bondType: type,
      duration: def.duration,
      firstYearRate: def.firstYearRate,
      margin: def.margin,
      earlyWithdrawalFee: def.earlyWithdrawalFee,
      isCapitalized: def.isCapitalized,
      payoutFrequency: def.payoutFrequency,
      rebuyDiscount: def.rebuyDiscount,
    }));
  };

  return {
    inputs,
    results,
    updateInput,
    setBondType,
    definitions: BOND_DEFINITIONS,
  };
}
