import { useState, useCallback } from 'react';
import { RegularInvestmentInputs, BondType, InvestmentFrequency, TaxStrategy } from '../../bond-core/types';
import { RegularInvestmentCalculationEnvelope } from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { useQuerySync } from '@/shared/hooks/useQuerySync';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { getHorizonMonths, getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';

const DEFAULT_BOND = BondType.COI;
const def = BOND_DEFINITIONS[DEFAULT_BOND];
const today = new Date();
const purchaseDate = toDateString(today);
const defaultHorizonYears = 10;
const defaultHorizonMonths = defaultHorizonYears * 12;
const defaultWithdrawal = getWithdrawalDateFromMonths(purchaseDate, defaultHorizonMonths);

const DEFAULT_INPUTS: RegularInvestmentInputs = {
  bondType: DEFAULT_BOND,
  contributionAmount: 1000,
  frequency: InvestmentFrequency.MONTHLY,
  totalHorizon: defaultHorizonYears,
  firstYearRate: def.firstYearRate,
  expectedInflation: 3.5,
  expectedNbpRate: 5.25,
  margin: def.margin,
  duration: def.duration,
  earlyWithdrawalFee: def.earlyWithdrawalFee,
  taxRate: 19,
  isCapitalized: def.isCapitalized,
  payoutFrequency: def.payoutFrequency,
  purchaseDate,
  withdrawalDate: defaultWithdrawal,
  isRebought: false,
  rebuyDiscount: def.rebuyDiscount,
  taxStrategy: TaxStrategy.STANDARD,
  timingMode: 'general',
  investmentHorizonMonths: defaultHorizonMonths,
};

export function useRegularInvestmentCalculator() {
  const [inputs, setInputs] = useState<RegularInvestmentInputs>(DEFAULT_INPUTS);
  const [envelope, setEnvelope] = useState<RegularInvestmentCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true); // Default to true so first calculation happens
  const { isCalculating, isError, clearError, post } = useCalculationRequest();

  // Derived results for compatibility
  const results = envelope?.result || null;

  // Sync state with URL
  useQuerySync(inputs, (initial) => {
    setInputs(prev => ({ ...prev, ...initial }));
  });

  const calculate = useCallback(async (currentInputs = inputs) => {
    setIsDirty(false);
    try {
      clearError();
      const data = await post<RegularInvestmentCalculationEnvelope>('/api/calculate/regular', currentInputs, { preferWorker: true });
      setEnvelope(data);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  }, [clearError, inputs, post]);

  // Initial calculation - REMOVED to prevent excessive requests on remount
  // useEffect(() => {
  //   calculate();
  // }, []);

  const updateInput = (key: keyof RegularInvestmentInputs, value: string | number | boolean | undefined) => {
    setIsDirty(true);
    setInputs((prev) => {
      const newInputs = { ...prev, [key]: value };

      if (key === 'totalHorizon') {
        const months = Number(value) * 12;
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
        newInputs.totalHorizon = Math.max(1, Math.round(months / 12));
        newInputs.timingMode = 'exact';
      }

      if (key === 'investmentHorizonMonths') {
        const months = Number(value);
        newInputs.investmentHorizonMonths = months;
        newInputs.totalHorizon = Math.max(1, Math.round(months / 12));
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, months);
      }

      if (key === 'timingMode' && value === 'general') {
        const months = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        newInputs.investmentHorizonMonths = months;
        newInputs.totalHorizon = Math.max(1, Math.round(months / 12));
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
      isRebought: false,
    }));
  };

  return {
    inputs,
    results,
    envelope,
    warnings: envelope?.warnings || [],
    assumptions: envelope?.assumptions || [],
    dataFreshness: envelope?.dataFreshness,
    isCalculating,
    isError,
    isDirty,
    calculate,
    updateInput,
    setBondType,
    definitions: BOND_DEFINITIONS,
  };
}

