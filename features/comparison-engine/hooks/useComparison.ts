'use client';

import { useState, useCallback } from 'react';
import { BondInputs, BondType, TaxStrategy } from '../../bond-core/types';
import { BondComparisonCalculationEnvelope, SingleBondCalculationEnvelope } from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { addMonths, differenceInMonths } from 'date-fns';
import { useQuerySync } from '@/shared/hooks/useQuerySync';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { postCalculation } from '@/shared/lib/calculation-client';

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
    rollover: false,
  };
};

const getHorizonMonths = (purchaseDate: string, withdrawalDate: string) => {
  const months = differenceInMonths(new Date(withdrawalDate), new Date(purchaseDate));
  return Math.max(0, months);
};

export function useComparison() {
  const [inputsA, setInputsA] = useState<BondInputs>(createDefaultInputs(BondType.COI));
  const [inputsB, setInputsB] = useState<BondInputs>(createDefaultInputs(BondType.EDO));
  const [comparisonEnvelope, setComparisonEnvelope] = useState<BondComparisonCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const { isCalculating, run } = useCalculationRequest();

  const scenarioAResult = comparisonEnvelope?.result.find((item) => item.scenarioKey === 'scenarioA');
  const scenarioBResult = comparisonEnvelope?.result.find((item) => item.scenarioKey === 'scenarioB');
  const resultsA = scenarioAResult?.result || null;
  const resultsB = scenarioBResult?.result || null;
  const sharedWarnings = comparisonEnvelope?.warnings || [];
  const sharedAssumptions = comparisonEnvelope?.assumptions || [];
  const sharedNotes = comparisonEnvelope?.calculationNotes || [];
  const sharedFlags = comparisonEnvelope?.dataQualityFlags || [];
  const envelopeA: SingleBondCalculationEnvelope | null = resultsA
    ? {
        result: resultsA,
        warnings: sharedWarnings,
        assumptions: sharedAssumptions,
        calculationNotes: sharedNotes,
        dataQualityFlags: sharedFlags,
        dataFreshness: comparisonEnvelope?.dataFreshness ?? { status: 'unknown', usedFallback: false },
        calculationVersion: comparisonEnvelope?.calculationVersion ?? 'unknown',
      }
    : null;
  const envelopeB: SingleBondCalculationEnvelope | null = resultsB
    ? {
        result: resultsB,
        warnings: sharedWarnings,
        assumptions: sharedAssumptions,
        calculationNotes: sharedNotes,
        dataQualityFlags: sharedFlags,
        dataFreshness: comparisonEnvelope?.dataFreshness ?? { status: 'unknown', usedFallback: false },
        calculationVersion: comparisonEnvelope?.calculationVersion ?? 'unknown',
      }
    : null;

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
    setIsDirty(false);
    try {
      const envelope = await run(() =>
        postCalculation<BondComparisonCalculationEnvelope>('/api/calculate/compare', {
          mode: 'independent',
          scenarioA: inputsA,
          scenarioB: inputsB,
        }),
      );
      setComparisonEnvelope(envelope);
    } catch (error) {
      console.error('Comparison error:', error);
    }
  }, [inputsA, inputsB, run]);

  // Initial calculation - REMOVED to prevent excessive requests on remount
  // useEffect(() => {
  //   calculate();
  // }, []);

  const updateInputA = (key: keyof BondInputs, value: string | number | boolean | number[] | undefined) => {
    setIsDirty(true);
    setInputsA(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'purchaseDate') {
        const horizonMonths = getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        next.withdrawalDate = addMonths(new Date(value as string), horizonMonths).toISOString();
      }
      return next;
    });
  };

  const updateInputB = (key: keyof BondInputs, value: string | number | boolean | number[] | undefined) => {
    setIsDirty(true);
    setInputsB(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'purchaseDate') {
        const horizonMonths = getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        next.withdrawalDate = addMonths(new Date(value as string), horizonMonths).toISOString();
      }
      return next;
    });
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
      withdrawalDate: addMonths(
        new Date(prev.purchaseDate),
        Math.max(getHorizonMonths(prev.purchaseDate, prev.withdrawalDate), Math.round(def.duration * 12)),
      ).toISOString(),
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
      withdrawalDate: addMonths(
        new Date(prev.purchaseDate),
        Math.max(getHorizonMonths(prev.purchaseDate, prev.withdrawalDate), Math.round(def.duration * 12)),
      ).toISOString(),
    }));
  };

  return {
    inputsA, inputsB,
    resultsA, resultsB,
    envelopeA, envelopeB,
    warningsA: envelopeA?.warnings || [],
    warningsB: envelopeB?.warnings || [],
    isCalculating,
    isDirty,
    calculate,
    updateInputA, updateInputB,
    setBondTypeA, setBondTypeB,
    definitions: BOND_DEFINITIONS
  };
}

