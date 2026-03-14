import { useState, useMemo } from 'react';
import { BondInputs, BondType } from '../../bond-core/types';
import { calculateBondInvestment } from '../../bond-core/utils/calculations';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { addMonths } from 'date-fns';

const DEFAULT_BOND = BondType.COI;
const def = BOND_DEFINITIONS[DEFAULT_BOND];
const today = new Date();
const defaultWithdrawal = addMonths(today, Math.round(def.duration * 12));

const DEFAULT_INPUTS: BondInputs = {
  bondType: DEFAULT_BOND,
  initialInvestment: 10000,
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
};

export function useBondCalculator() {
  const [inputs, setInputs] = useState<BondInputs>(DEFAULT_INPUTS);

  const results = useMemo(() => {
    return calculateBondInvestment(inputs);
  }, [inputs]);

  const updateInput = (key: keyof BondInputs, value: string | number | boolean) => {
    setInputs((prev) => {
      const newInputs = { ...prev, [key]: value };
      
      // If purchase date changes, also update withdrawal date if it was at maturity
      if (key === 'purchaseDate') {
        const oldPurchaseDate = new Date(prev.purchaseDate);
        const oldMaturityDate = addMonths(oldPurchaseDate, Math.round(prev.duration * 12));
        const wasAtMaturity = prev.withdrawalDate === oldMaturityDate.toISOString();
        
        if (wasAtMaturity) {
          const newPurchaseDate = new Date(value as string);
          newInputs.withdrawalDate = addMonths(newPurchaseDate, Math.round(prev.duration * 12)).toISOString();
        }
      }

      return newInputs;
    });
  };

  const setBondType = (type: BondType) => {
    const def = BOND_DEFINITIONS[type];
    const purchaseDate = new Date(inputs.purchaseDate);
    const newMaturityDate = addMonths(purchaseDate, Math.round(def.duration * 12));
    
    setInputs((prev) => ({
      ...prev,
      bondType: type,
      duration: def.duration,
      firstYearRate: def.firstYearRate,
      margin: def.margin,
      earlyWithdrawalFee: def.earlyWithdrawalFee,
      isCapitalized: def.isCapitalized,
      payoutFrequency: def.payoutFrequency,
      withdrawalDate: newMaturityDate.toISOString(),
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
