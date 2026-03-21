import { useState, useCallback, useEffect, useRef } from 'react';
import { RegularInvestmentInputs, BondType, InvestmentFrequency, TaxStrategy, RegularInvestmentResult } from '../../bond-core/types';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { addYears } from 'date-fns';
import { useQuerySync } from '@/shared/hooks/useQuerySync';

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
  expectedNbpRate: 5.25,
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
  taxStrategy: TaxStrategy.STANDARD,
};

export function useRegularInvestmentCalculator() {
  const [inputs, setInputs] = useState<RegularInvestmentInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<RegularInvestmentResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDirty, setIsDirty] = useState(true); // Default to true so first calculation happens

  // Sync state with URL
  useQuerySync(inputs, (initial) => {
    setInputs(prev => ({ ...prev, ...initial }));
  });

  const calculate = useCallback(async (currentInputs = inputs) => {
    setIsCalculating(true);
    setIsError(false);
    setIsDirty(false);
    try {
      const response = await fetch('/api/calculate/regular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInputs),
      });
      
      if (!response.ok) throw new Error('Calculation failed');
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Calculation error:', error);
      setIsError(true);
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
      
      // If totalHorizon changes, update withdrawal date
      if (key === 'totalHorizon') {
        const start = new Date(prev.purchaseDate);
        newInputs.withdrawalDate = addYears(start, Number(value)).toISOString();
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
      isRebought: false,
    }));
  };

  return {
    inputs,
    results,
    isCalculating,
    isError,
    isDirty,
    calculate,
    updateInput,
    setBondType,
    definitions: BOND_DEFINITIONS,
  };
}
