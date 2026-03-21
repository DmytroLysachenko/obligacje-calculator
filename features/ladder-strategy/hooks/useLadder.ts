'use client';

import { useState, useCallback, useEffect } from 'react';
import { BondType, RegularInvestmentInputs, InvestmentFrequency, TaxStrategy, RegularInvestmentResult } from '../../bond-core/types';
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
  const [results, setResults] = useState<RegularInvestmentResult | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculate = useCallback(async () => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/calculate/regular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      
      if (!response.ok) throw new Error('Calculation failed');
      
      const data = await response.json();
      setResults(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Ladder calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [inputs]);

  // Initial calculation - REMOVED to prevent excessive requests on remount
  // useEffect(() => {
  //   calculate();
  // }, []);

  const updateInput = (key: keyof RegularInvestmentInputs, value: string | number | boolean | undefined) => {
    setIsDirty(true);
    setInputs((prev) => {
      const newInputs = { ...prev, [key]: value };
      if (key === 'totalHorizon') {
        newInputs.withdrawalDate = addYears(new Date(prev.purchaseDate), Number(value)).toISOString();
      }
      return newInputs;
    });
  };

  const setBondType = (type: BondType) => {
    setIsDirty(true);
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
    isDirty,
    isCalculating,
    calculate,
    updateInput,
    setBondType,
    definitions: BOND_DEFINITIONS,
  };
}
