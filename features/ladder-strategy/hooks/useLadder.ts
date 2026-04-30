'use client';

import { useState, useCallback } from 'react';
import { BondType, RegularInvestmentInputs, InvestmentFrequency, TaxStrategy } from '../../bond-core/types';
import { RegularInvestmentCalculationEnvelope } from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { getHorizonMonths, getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';

const DEFAULT_BOND = BondType.EDO;
const def = BOND_DEFINITIONS[DEFAULT_BOND];
const today = new Date();
const purchaseDate = toDateString(today);
const defaultHorizonYears = 10;
const defaultHorizonMonths = defaultHorizonYears * 12;

const DEFAULT_INPUTS: RegularInvestmentInputs = {
  bondType: DEFAULT_BOND,
  contributionAmount: 1000,
  frequency: InvestmentFrequency.MONTHLY,
  investmentHorizonMonths: defaultHorizonYears * 12,
  firstYearRate: def.firstYearRate,
  expectedInflation: 3.5,
  margin: def.margin,
  duration: def.duration,
  earlyWithdrawalFee: def.earlyWithdrawalFee,
  taxRate: 19,
  isCapitalized: def.isCapitalized,
  payoutFrequency: def.payoutFrequency,
  purchaseDate,
  withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, defaultHorizonMonths),
  isRebought: false,
  rebuyDiscount: def.rebuyDiscount,
  taxStrategy: TaxStrategy.STANDARD,
  timingMode: 'general',
};

export function useLadder() {
  const [inputs, setInputs] = useState<RegularInvestmentInputs>(DEFAULT_INPUTS);
  const [envelope, setEnvelope] = useState<RegularInvestmentCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const { isCalculating, post } = useCalculationRequest();

  // Derived results for compatibility
  const results = envelope?.result || null;

  const calculate = useCallback(async () => {
    try {
      const data = await post<RegularInvestmentCalculationEnvelope>('/api/calculate/regular', inputs, { preferWorker: true });
      setEnvelope(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Ladder calculation error:', error);
    }
  }, [inputs, post]);

  const updateInput = (key: keyof RegularInvestmentInputs, value: string | number | boolean | undefined) => {
    setIsDirty(true);
    setInputs((prev) => {
      const newInputs = { ...prev, [key]: value };
      if (key === 'investmentHorizonMonths') {
        const months = Number(value);
        newInputs.investmentHorizonMonths = months;
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, months);
      }
      if (key === 'purchaseDate') {
        const months = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(String(value), months);
      }
      if (key === 'withdrawalDate') {
        const months = getHorizonMonths(prev.purchaseDate, String(value));
        newInputs.investmentHorizonMonths = months;
        newInputs.timingMode = 'exact';
      }
      if (key === 'timingMode' && value === 'general') {
        const months = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        newInputs.investmentHorizonMonths = months;
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, months);
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
    envelope,
    warnings: envelope?.warnings || [],
    assumptions: envelope?.assumptions || [],
    dataFreshness: envelope?.dataFreshness,
    isDirty,
    isCalculating,
    calculate,
    updateInput,
    setBondType,
    definitions: BOND_DEFINITIONS,
  };
}
