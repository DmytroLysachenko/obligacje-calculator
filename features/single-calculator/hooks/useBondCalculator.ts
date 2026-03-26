import { useState, useCallback } from 'react';
import { BondInputs, BondType, TaxStrategy } from '../../bond-core/types';
import { SingleBondCalculationEnvelope } from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { addMonths, differenceInMonths } from 'date-fns';
import { useQuerySync } from '@/shared/hooks/useQuerySync';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { postCalculation } from '@/shared/lib/calculation-client';

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
  rollover: false,
};

const getHorizonMonths = (purchaseDate: string, withdrawalDate: string) => {
  const months = differenceInMonths(new Date(withdrawalDate), new Date(purchaseDate));
  return Math.max(0, months);
};

export function useBondCalculator() {
  const [inputs, setInputs] = useState<BondInputs>(DEFAULT_INPUTS);
  const [envelope, setEnvelope] = useState<SingleBondCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const { isCalculating, isError, run, clearError } = useCalculationRequest();

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
        const simEnvelope = await run(() =>
          postCalculation<SingleBondCalculationEnvelope>('/api/calculate/single', {
            ...currentInputs,
            initialInvestment: testBase,
          }),
        );
        const netMultiplier = simEnvelope.result.netPayoutValue / testBase;
        const bondPrice = currentInputs.isRebought ? (100 - (currentInputs.rebuyDiscount || 0)) : 100;
        const requiredInvestmentRaw = currentInputs.savingsGoal / netMultiplier;
        const requiredBonds = Math.ceil(requiredInvestmentRaw / bondPrice);
        finalInputs.initialInvestment = requiredBonds * bondPrice;
      }

      const data = await run(() => postCalculation<SingleBondCalculationEnvelope>('/api/calculate/single', finalInputs));
      setEnvelope(data);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  }, [clearError, inputs, run]);

  // Initial calculation - REMOVED to prevent excessive requests on remount
  // useEffect(() => {
  //   calculate();
  // }, []);

  const updateInput = (key: keyof BondInputs, value: string | number | boolean | number[] | undefined) => {
    setIsDirty(true);
    setInputs((prev) => {
      const newInputs = { ...prev, [key]: value };
      
      if (key === 'purchaseDate') {
        const horizonMonths = getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        const newPurchaseDate = new Date(value as string);
        newInputs.withdrawalDate = addMonths(newPurchaseDate, horizonMonths).toISOString();
      }

      return newInputs;
    });
  };

  const setBondType = (type: BondType) => {
    setIsDirty(true);
    const def = BOND_DEFINITIONS[type];
    const purchaseDate = new Date(inputs.purchaseDate);
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
      withdrawalDate: addMonths(purchaseDate, nextHorizonMonths).toISOString(),
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

