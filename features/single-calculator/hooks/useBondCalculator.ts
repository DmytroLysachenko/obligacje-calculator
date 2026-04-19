import { useState, useCallback, useEffect, useRef } from 'react';
import { BondInputs, BondType, TaxStrategy, InterestPayout } from '../../bond-core/types';
import { SingleBondCalculationEnvelope } from '../../bond-core/types/scenarios';
import { useQuerySync } from '@/shared/hooks/useQuerySync';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getHorizonMonths, getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';
import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';

const DEFAULT_BOND = BondType.COI;
const today = new Date();
const purchaseDate = toDateString(today);

// Fallback values used only until DB definitions are loaded
const FALLBACK_INPUTS: BondInputs = {
  bondType: DEFAULT_BOND,
  initialInvestment: 10000,
  firstYearRate: 5.00,
  expectedInflation: 3.5,
  expectedNbpRate: 5.25,
  margin: 1.25,
  duration: 4,
  earlyWithdrawalFee: 0.70,
  taxRate: 19,
  isCapitalized: true,
  payoutFrequency: InterestPayout.MATURITY,
  purchaseDate,
  withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, 48),
  isRebought: false,
  rebuyDiscount: 0,
  taxStrategy: TaxStrategy.STANDARD,
  showRealValue: false,
  rollover: false,
  timingMode: 'general',
  investmentHorizonMonths: 48,
};

interface BondSeries {
  id: string;
  seriesCode: string;
  firstYearRate: string | number;
  baseMargin: string | number;
  emissionMonth: string;
}

export function useBondCalculator() {
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const [inputs, setInputs] = useState<BondInputs>(FALLBACK_INPUTS);
  const [envelope, setEnvelope] = useState<SingleBondCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const [availableSeries, setAvailableSeries] = useState<BondSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const definitionsAppliedFor = useRef<string | null>(null);
  
  const { isCalculating, isError, clearError, post } = useCalculationRequest();

  const debouncedInputs = useDebounce(inputs, 500);

  // Sync inputs with loaded definitions
  useEffect(() => {
    if (definitions && definitions[inputs.bondType] && definitionsAppliedFor.current !== inputs.bondType) {
      const def = definitions[inputs.bondType];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputs(prev => ({
        ...prev,
        firstYearRate: prev.firstYearRate === FALLBACK_INPUTS.firstYearRate ? def.firstYearRate : prev.firstYearRate,
        margin: prev.margin === FALLBACK_INPUTS.margin ? def.margin : prev.margin,
        duration: def.duration,
        earlyWithdrawalFee: def.earlyWithdrawalFee,
        isCapitalized: def.isCapitalized,
        payoutFrequency: def.payoutFrequency,
        rebuyDiscount: def.rebuyDiscount,
        nominalValue: def.nominalValue,
        isInflationIndexed: def.isInflationIndexed,
      }));
      definitionsAppliedFor.current = inputs.bondType;
    }
  }, [definitions, inputs.bondType]);

  const calculate = useCallback(async (currentInputs: BondInputs) => {
    try {
      await Promise.resolve(); // Defer state updates to avoid synchronous setState in effect
      setIsDirty(false);
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
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Calculation aborted')) {
        return;
      }
      console.error('Calculation error:', error);
    }
  }, [clearError, post]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculate(debouncedInputs);
    }, 0);
    return () => clearTimeout(timer);
  }, [debouncedInputs, calculate]);

  const fetchSeries = useCallback(async (symbol: BondType) => {
    try {
      await Promise.resolve();
      const response = await fetch(`/api/calculate/bond-series?symbol=${symbol}`);
      const data = await response.json();
      setAvailableSeries(data.result || []);
    } catch (error) {
      console.error('Failed to fetch series:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSeries(inputs.bondType);
    }, 0);
    return () => clearTimeout(timer);
  }, [inputs.bondType, fetchSeries]);

  // Derived results for compatibility
  const results = envelope?.result || null;

  // Sync state with URL
  useQuerySync(inputs, (initial) => {
    setInputs(prev => ({ ...prev, ...initial }));
  });

  const updateInput = (key: string, value: unknown) => {
    setIsDirty(true);
    if (key === 'selectedSeriesId') {
      const seriesId = value as string | null;
      setSelectedSeriesId(seriesId);
      if (seriesId === 'current' && definitions) {
        const def = definitions[inputs.bondType];
        setInputs(prev => ({
          ...prev,
          firstYearRate: def.firstYearRate,
          margin: def.margin,
        }));
        return;
      }
      const series = availableSeries.find(s => s.id === seriesId);
      if (series) {
        setInputs(prev => ({
          ...prev,
          firstYearRate: Number(series.firstYearRate),
          margin: Number(series.baseMargin),
          purchaseDate: series.emissionMonth,
          withdrawalDate: getWithdrawalDateFromMonths(series.emissionMonth, prev.investmentHorizonMonths ?? Math.round(prev.duration * 12)),
        }));
      }
      return;
    }

    setInputs((prev) => {
      const newInputs = { ...prev, [key as keyof BondInputs]: value };

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
    if (!definitions) return;
    setIsDirty(true);
    setSelectedSeriesId('current');
    const def = definitions[type];
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
      nominalValue: def.nominalValue,
      isInflationIndexed: def.isInflationIndexed,
    }));
  };

  return {
    inputs,
    results,
    envelope,
    availableSeries,
    selectedSeriesId,
    warnings: envelope?.warnings || [],
    assumptions: envelope?.assumptions || [],
    calculationNotes: envelope?.calculationNotes || [],
    dataQualityFlags: envelope?.dataQualityFlags || [],
    dataFreshness: envelope?.dataFreshness,
    isCalculating,
    isError,
    isDirty,
    calculate: () => calculate(inputs),
    updateInput,
    setBondType,
    definitions,
    isLoadingDefs,
  };
}
