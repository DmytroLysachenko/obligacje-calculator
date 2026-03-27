import { useState, useCallback } from 'react';
import { BondInputs, BondType, TaxStrategy } from '../../bond-core/types';
import { SingleBondCalculationEnvelope } from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { useQuerySync } from '@/shared/hooks/useQuerySync';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { getHorizonMonths, getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';

const DEFAULT_BOND = BondType.COI;
const def = BOND_DEFINITIONS[DEFAULT_BOND];
const today = new Date();
const purchaseDate = toDateString(today);
const defaultHorizonMonths = Math.round(def.duration * 12);
const defaultWithdrawal = getWithdrawalDateFromMonths(purchaseDate, defaultHorizonMonths);

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
  purchaseDate,
  withdrawalDate: defaultWithdrawal,
  isRebought: false,
  rebuyDiscount: def.rebuyDiscount,
  taxStrategy: TaxStrategy.STANDARD,
  showRealValue: false,
  rollover: false,
  timingMode: 'general',
  investmentHorizonMonths: defaultHorizonMonths,
};

export function useBondCalculator() {
  const [inputs, setInputs] = useState<BondInputs>(DEFAULT_INPUTS);
  const [envelope, setEnvelope] = useState<SingleBondCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
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
      const finalInputs = { ...currentInputs };

      if (currentInputs.calculatorMode === 'reverse' && currentInputs.savingsGoal) {
        const testBase = 10000;
        const simEnvelope = await post<SingleBondCalculationEnvelope>(
          '/api/calculate/single',
          {
            ...currentInputs,
            initialInvestment: testBase,
          },
          { preferWorker: true },
        );
        const netMultiplier = simEnvelope.result.netPayoutValue / testBase;
        const bondPrice = currentInputs.isRebought ? (100 - (currentInputs.rebuyDiscount || 0)) : 100;
        const requiredInvestmentRaw = currentInputs.savingsGoal / netMultiplier;
        const requiredBonds = Math.ceil(requiredInvestmentRaw / bondPrice);
        finalInputs.initialInvestment = requiredBonds * bondPrice;
      }

      const data = await post<SingleBondCalculationEnvelope>('/api/calculate/single', finalInputs, { preferWorker: true });
      setEnvelope(data);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  }, [clearError, inputs, post]);

  // Initial calculation - REMOVED to prevent excessive requests on remount
  // useEffect(() => {
  //   calculate();
  // }, []);

  const updateInput = (key: keyof BondInputs, value: string | number | boolean | number[] | undefined) => {
    setIsDirty(true);
    setInputs((prev) => {
      const newInputs = { ...prev, [key]: value };

      if (key === 'purchaseDate') {
        const horizonMonths = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(String(value), horizonMonths);
      }

      if (key === 'investmentHorizonMonths') {
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, Number(value));
      }

      if (key === 'withdrawalDate') {
        newInputs.investmentHorizonMonths = getHorizonMonths(prev.purchaseDate, String(value));
        newInputs.timingMode = 'exact';
      }

      if (key === 'timingMode' && value === 'general') {
        const horizonMonths = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        newInputs.investmentHorizonMonths = horizonMonths;
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, horizonMonths);
      }

      return newInputs;
    });
  };

  const setBondType = (type: BondType) => {
    setIsDirty(true);
    const def = BOND_DEFINITIONS[type];
    const previousHorizonMonths = getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);
    const fallbackHorizonMonths = Math.round(def.duration * 12);
    const nextHorizonMonths = Math.max(previousHorizonMonths, fallbackHorizonMonths);
    
    setInputs((prev) => ({
      ...prev,
      bondType: type,
      duration: def.duration,
      firstYearRate: def.firstYearRate,
      margin: def.margin,
      earlyWithdrawalFee: def.earlyWithdrawalFee,
      isCapitalized: def.isCapitalized,
      payoutFrequency: def.payoutFrequency,
      withdrawalDate: getWithdrawalDateFromMonths(prev.purchaseDate, nextHorizonMonths),
      rebuyDiscount: def.rebuyDiscount,
      isRebought: false,
      investmentHorizonMonths: nextHorizonMonths,
    }));
  };

  return {
    inputs,
    results,
    envelope,
    warnings: envelope?.warnings || [],
    assumptions: envelope?.assumptions || [],
    calculationNotes: envelope?.calculationNotes || [],
    dataQualityFlags: envelope?.dataQualityFlags || [],
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

