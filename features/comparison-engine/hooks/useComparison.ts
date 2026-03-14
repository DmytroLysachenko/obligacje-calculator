'use client';

import { useState, useMemo } from 'react';
import { BondInputs, BondType, TaxStrategy } from '../../bond-core/types';
import { calculateBondInvestment } from '../../bond-core/utils/calculations';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { addMonths } from 'date-fns';

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

  const resultsA = useMemo(() => calculateBondInvestment(inputsA), [inputsA]);
  const resultsB = useMemo(() => calculateBondInvestment(inputsB), [inputsB]);

  const updateInputA = (key: keyof BondInputs, value: string | number | boolean | undefined) => {
    setInputsA(prev => ({ ...prev, [key]: value }));
  };

  const updateInputB = (key: keyof BondInputs, value: string | number | boolean | undefined) => {
    setInputsB(prev => ({ ...prev, [key]: value }));
  };

  const setBondTypeA = (type: BondType) => {
    const def = BOND_DEFINITIONS[type];
    const today = new Date();
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
    updateInputA, updateInputB,
    setBondTypeA, setBondTypeB,
    definitions: BOND_DEFINITIONS
  };
}
