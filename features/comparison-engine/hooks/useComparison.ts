'use client';

import { useState, useCallback } from 'react';
import { BondInputs, BondType, TaxStrategy, CalculationResult } from '../../bond-core/types';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { addMonths } from 'date-fns';
import { useQuerySync } from '@/shared/hooks/useQuerySync';

const createDefaultInputs = (type: BondType): BondInputs => {
  const def = BOND_DEFINITIONS[type];
  const today = new Date();
  return {
    bondType: type,
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
    withdrawalDate: addMonths(today, Math.round(def.duration * 12)).toISOString(),
    isRebought: false,
    rebuyDiscount: def.rebuyDiscount,
    taxStrategy: TaxStrategy.STANDARD,
  };
};

export function useComparison() {
  const [inputsA, setInputsA] = useState<BondInputs>(createDefaultInputs(BondType.COI));
  const [inputsB, setInputsB] = useState<BondInputs>(createDefaultInputs(BondType.EDO));
  const [resultsA, setResultsA] = useState<CalculationResult | null>(null);
  const [resultsB, setResultsB] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isDirty, setIsDirty] = useState(true);

  // Sync state with URL using prefixes to avoid collisions
  const combinedState = {
    ...Object.fromEntries(Object.entries(inputsA).map(([k, v]) => [`a_${k}`, v])),
    ...Object.fromEntries(Object.entries(inputsB).map(([k, v]) => [`b_${k}`, v])),
  };

  useQuerySync(combinedState, (initial) => {
    const newA: Partial<BondInputs> = {};
    const newB: Partial<BondInputs> = {};
    
    Object.entries(initial).forEach(([key, val]) => {
      if (key.startsWith('a_')) {
        const inputKey = key.replace('a_', '') as keyof BondInputs;
        (newA as Record<string, unknown>)[inputKey] = val;
      }
      if (key.startsWith('b_')) {
        const inputKey = key.replace('b_', '') as keyof BondInputs;
        (newB as Record<string, unknown>)[inputKey] = val;
      }
    });

    if (Object.keys(newA).length > 0) setInputsA(prev => ({ ...prev, ...newA }));
    if (Object.keys(newB).length > 0) setInputsB(prev => ({ ...prev, ...newB }));
  });

  const calculate = useCallback(async () => {
    setIsCalculating(true);
    setIsDirty(false);
    try {
      const [resA, resB] = await Promise.all([
        fetch('/api/calculate/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputsA),
        }),
        fetch('/api/calculate/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputsB),
        })
      ]);
      
      if (!resA.ok || !resB.ok) throw new Error('Comparison calculation failed');
      
      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
      setResultsA(dataA);
      setResultsB(dataB);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [inputsA, inputsB]);

  // Initial calculation - REMOVED to prevent excessive requests on remount
  // useEffect(() => {
  //   calculate();
  // }, []);

  const updateInputA = (key: keyof BondInputs, value: string | number | boolean | number[] | undefined) => {
    setIsDirty(true);
    setInputsA(prev => ({ ...prev, [key]: value }));
  };

  const updateInputB = (key: keyof BondInputs, value: string | number | boolean | number[] | undefined) => {
    setIsDirty(true);
    setInputsB(prev => ({ ...prev, [key]: value }));
  };

  const setBondTypeA = (type: BondType) => {
    setIsDirty(true);
    const def = BOND_DEFINITIONS[type];
    setInputsA(prev => ({
      ...prev,
      bondType: type,
      duration: def.duration,
      firstYearRate: def.firstYearRate,
      margin: def.margin,
      earlyWithdrawalFee: def.earlyWithdrawalFee,
      isCapitalized: def.isCapitalized,
      payoutFrequency: def.payoutFrequency,
      rebuyDiscount: def.rebuyDiscount,
      withdrawalDate: addMonths(new Date(prev.purchaseDate), Math.round(def.duration * 12)).toISOString(),
    }));
  };

  const setBondTypeB = (type: BondType) => {
    setIsDirty(true);
    const def = BOND_DEFINITIONS[type];
    setInputsB(prev => ({
      ...prev,
      bondType: type,
      duration: def.duration,
      firstYearRate: def.firstYearRate,
      margin: def.margin,
      earlyWithdrawalFee: def.earlyWithdrawalFee,
      isCapitalized: def.isCapitalized,
      payoutFrequency: def.payoutFrequency,
      rebuyDiscount: def.rebuyDiscount,
      withdrawalDate: addMonths(new Date(prev.purchaseDate), Math.round(def.duration * 12)).toISOString(),
    }));
  };

  return {
    inputsA, inputsB,
    resultsA, resultsB,
    isCalculating,
    isDirty,
    calculate,
    updateInputA, updateInputB,
    setBondTypeA, setBondTypeB,
    definitions: BOND_DEFINITIONS
  };
}
