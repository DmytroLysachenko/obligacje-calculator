import { useState, useCallback, useEffect, useRef } from 'react';
import { BondInputs, BondType, TaxStrategy, CalculationResult } from '../../bond-core/types';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { addMonths } from 'date-fns';
import { useQuerySync } from '@/shared/hooks/useQuerySync';

const DEFAULT_BOND = BondType.COI;
const def = BOND_DEFINITIONS[DEFAULT_BOND];
const today = new Date();
const defaultWithdrawal = addMonths(today, Math.round(def.duration * 12));

const DEFAULT_INPUTS: BondInputs = {
  bondType: DEFAULT_BOND,
  initialInvestment: 10000,
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
  showRealValue: false,
};

export function useBondCalculator() {
  const [inputs, setInputs] = useState<BondInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDirty, setIsDirty] = useState(true);

  // Sync state with URL
  useQuerySync(inputs, (initial) => {
    setInputs(prev => ({ ...prev, ...initial }));
  });

  const calculate = useCallback(async (currentInputs = inputs) => {
    setIsCalculating(true);
    setIsError(false);
    setIsDirty(false);
    try {
      const response = await fetch('/api/calculate/single', {
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

  const updateInput = (key: keyof BondInputs, value: string | number | boolean | undefined) => {
    setIsDirty(true);
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
    setIsDirty(true);
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
