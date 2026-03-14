import { useState, useMemo } from 'react';
import { RegularInvestmentInputs, BondType, InvestmentFrequency } from '../../bond-core/types';
import { calculateRegularInvestment } from '../../bond-core/utils/calculations';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { addYears } from 'date-fns';

const DEFAULT_BOND = BondType.COI;
const def = BOND_DEFINITIONS[DEFAULT_BOND];
const today = new Date();
const defaultWithdrawal = addYears(today, 10);

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
  withdrawalDate: defaultWithdrawal.toISOString(),
  isRebought: false,
  rebuyDiscount: def.rebuyDiscount,
};

export function useRegularInvestmentCalculator() {
  const [inputs, setInputs] = useState<RegularInvestmentInputs>(DEFAULT_INPUTS);

  const results = useMemo(() => {
    return calculateRegularInvestment(inputs);
  }, [inputs]);

  const updateInput = (key: keyof RegularInvestmentInputs, value: string | number | boolean) => {
    setInputs((prev) => {
      const newInputs = { ...prev, [key]: value };
      
      // If totalHorizon changes, update withdrawal date
      if (key === 'totalHorizon') {
        const start = new Date(prev.purchaseDate);
        newInputs.withdrawalDate = addYears(start, Number(value)).toISOString();
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
      isRebought: false, // Reset to false on type change
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
