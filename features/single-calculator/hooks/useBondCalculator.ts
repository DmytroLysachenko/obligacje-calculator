import { useState, useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { BondInputs, BondType, TaxStrategy, InterestPayout } from '../../bond-core/types';
import { SingleBondCalculationEnvelope } from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { getHorizonMonths, getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';
import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { loadPersistedCalculatorState, savePersistedCalculatorState } from '@/shared/lib/calculator-persistence';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { applyMacroDefaultsToBaseline } from '@/shared/lib/macro-assumption-defaults';

const DEFAULT_BOND = BondType.EDO;
const STORAGE_KEY = 'obligacje.single-calculator.v1';

function buildFallbackInputs(): BondInputs {
  const purchaseDate = toDateString(new Date());

  return {
    bondType: DEFAULT_BOND,
    initialInvestment: 10000,
    firstYearRate: 5.35,
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    margin: 2.0,
    duration: 10,
    earlyWithdrawalFee: 2.0,
    taxRate: 19,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    purchaseDate,
    withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, 120),
    isRebought: false,
    rebuyDiscount: 0,
    taxStrategy: TaxStrategy.STANDARD,
    showRealValue: false,
    rollover: false,
    timingMode: 'general',
    investmentHorizonMonths: 120,
  };
}

interface PersistedSingleCalculatorState {
  inputs: BondInputs;
  envelope: SingleBondCalculationEnvelope | null;
  selectedSeriesId: string | null;
  lastCommittedInputs: BondInputs | null;
  isDirty: boolean;
}

interface BondSeries {
  id: string;
  seriesCode: string;
  firstYearRate: string | number;
  baseMargin: string | number;
  emissionMonth: string;
}

function withoutDisplayOnlyInputs(inputs: BondInputs | null): BondInputs | null {
  if (!inputs) {
    return null;
  }

  const calculationInputs = { ...inputs };
  delete calculationInputs.chartStep;

  return calculationInputs;
}

function applyDefinitionToInputs(
  previous: BondInputs,
  definition: typeof BOND_DEFINITIONS[BondType],
  selectedSeriesId: string | null,
): BondInputs {
  const shouldUseCurrentOffer = !selectedSeriesId || selectedSeriesId === 'current';

  return {
    ...previous,
    firstYearRate: shouldUseCurrentOffer ? definition.firstYearRate : previous.firstYearRate,
    margin: shouldUseCurrentOffer ? definition.margin : previous.margin,
    duration: definition.duration,
    earlyWithdrawalFee: definition.earlyWithdrawalFee,
    isCapitalized: definition.isCapitalized,
    payoutFrequency: definition.payoutFrequency,
    rebuyDiscount: definition.rebuyDiscount,
    nominalValue: definition.nominalValue,
    isInflationIndexed: definition.isInflationIndexed,
  };
}

export function useBondCalculator(initialInputs?: BondInputs) {
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const fallbackInputs = buildFallbackInputs();
  const [inputs, setInputs] = useState<BondInputs>(
    initialInputs ?? fallbackInputs,
  );
  const [envelope, setEnvelope] = useState<SingleBondCalculationEnvelope | null>(
    null,
  );
  const [isDirty, setIsDirty] = useState(
    initialInputs ? false : true,
  );
  const [availableSeries, setAvailableSeries] = useState<BondSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(
    initialInputs?.selectedSeriesId ?? null,
  );
  const [lastCommittedInputs, setLastCommittedInputs] = useState<BondInputs | null>(
    initialInputs ?? null,
  );
  const [isPersistenceReady, setIsPersistenceReady] = useState(Boolean(initialInputs));
  const hasRestoredState = useRef(false);
  const hasAutoCalculatedSharedScenario = useRef(false);
  const restoredFromPersistence = useRef(false);
  const hasTouchedMacroAssumptions = useRef(false);
  
  const { isCalculating, isError, clearError, post } = useCalculationRequest();

  const applyMacroDefaults = useEffectEvent((defaults: { expectedInflation: number; expectedNbpRate: number }) => {
    setInputs((previous) => {
      const next = {
        ...previous,
        expectedInflation: defaults.expectedInflation,
        expectedNbpRate: defaults.expectedNbpRate,
      };

      return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
  });

  const reconcilePersistedMacroDefaults = useEffectEvent((defaults: { expectedInflation: number; expectedNbpRate: number }) => {
    setInputs((previous) => {
      const next = applyMacroDefaultsToBaseline(previous, defaults);
      return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
  });

  useEffect(() => {
    if (!definitions || !definitions[inputs.bondType]) {
      return;
    }

    const definition = definitions[inputs.bondType];
    const timer = window.setTimeout(() => {
      setInputs((previous) => {
        const next = applyDefinitionToInputs(previous, definition, selectedSeriesId);
        return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [definitions, inputs.bondType, selectedSeriesId]);

  useEffect(() => {
    if (initialInputs || hasRestoredState.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const restoredState =
        loadPersistedCalculatorState<PersistedSingleCalculatorState>(STORAGE_KEY);
      hasRestoredState.current = true;

      if (restoredState) {
        restoredFromPersistence.current = true;
        setInputs(withoutDisplayOnlyInputs(restoredState.inputs) ?? fallbackInputs);
        setEnvelope(restoredState.envelope ?? null);
        setSelectedSeriesId(restoredState.selectedSeriesId ?? null);
        setLastCommittedInputs(withoutDisplayOnlyInputs(restoredState.lastCommittedInputs ?? null));
        setIsDirty(restoredState.isDirty ?? true);
      }

      setIsPersistenceReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialInputs]);

  useEffect(() => {
    if (!macroDefaults || initialInputs || !isPersistenceReady || hasTouchedMacroAssumptions.current) {
      return;
    }

    if (restoredFromPersistence.current) {
      const timer = window.setTimeout(() => {
        reconcilePersistedMacroDefaults(macroDefaults);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    applyMacroDefaults(macroDefaults);
  }, [initialInputs, isPersistenceReady, macroDefaults]);

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
      setLastCommittedInputs(finalInputs);
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Calculation aborted')) {
        return;
      }
      console.error('Calculation error:', error);
    }
  }, [clearError, post]);

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

  useEffect(() => {
    if (!initialInputs || hasAutoCalculatedSharedScenario.current || isCalculating) {
      return;
    }

    hasAutoCalculatedSharedScenario.current = true;
    const timer = window.setTimeout(() => {
      void calculate(initialInputs);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [calculate, initialInputs, isCalculating]);

  useEffect(() => {
    if (initialInputs || !isPersistenceReady) {
      return;
    }

    savePersistedCalculatorState(STORAGE_KEY, {
      inputs,
      envelope,
      selectedSeriesId,
      lastCommittedInputs,
      isDirty,
    });
  }, [envelope, initialInputs, inputs, isDirty, isPersistenceReady, lastCommittedInputs, selectedSeriesId]);

  const results = envelope?.result || null;

  const normalizeInputs = useCallback((base: BondInputs, nextPartial?: Partial<BondInputs>) => {
    const merged = { ...base, ...nextPartial };

    if (nextPartial?.purchaseDate) {
      const horizonMonths = merged.investmentHorizonMonths ?? getHorizonMonths(base.purchaseDate, base.withdrawalDate);
      merged.withdrawalDate = getWithdrawalDateFromMonths(String(nextPartial.purchaseDate), horizonMonths);
    }

    if (nextPartial?.investmentHorizonMonths !== undefined) {
      merged.withdrawalDate = getWithdrawalDateFromMonths(merged.purchaseDate, Number(nextPartial.investmentHorizonMonths));
      const years = Math.max(1, Math.ceil(Number(nextPartial.investmentHorizonMonths) / 12));
      if (merged.customInflation) {
        merged.customInflation = Array.from(
          { length: years },
          (_, index) => merged.customInflation?.[index] ?? merged.expectedInflation,
        );
      }
      if (merged.customNbpRate) {
        merged.customNbpRate = Array.from(
          { length: years },
          (_, index) => merged.customNbpRate?.[index] ?? (merged.expectedNbpRate ?? 5.25),
        );
      }
    }

    if (nextPartial?.withdrawalDate) {
      merged.investmentHorizonMonths = getHorizonMonths(merged.purchaseDate, String(nextPartial.withdrawalDate));
      merged.timingMode = 'exact';
      const years = Math.max(1, Math.ceil(merged.investmentHorizonMonths / 12));
      if (merged.customInflation) {
        merged.customInflation = Array.from(
          { length: years },
          (_, index) => merged.customInflation?.[index] ?? merged.expectedInflation,
        );
      }
      if (merged.customNbpRate) {
        merged.customNbpRate = Array.from(
          { length: years },
          (_, index) => merged.customNbpRate?.[index] ?? (merged.expectedNbpRate ?? 5.25),
        );
      }
    }

    if (nextPartial?.timingMode === 'general') {
      const horizonMonths = merged.investmentHorizonMonths ?? getHorizonMonths(merged.purchaseDate, merged.withdrawalDate);
      merged.investmentHorizonMonths = horizonMonths;
      merged.withdrawalDate = getWithdrawalDateFromMonths(merged.purchaseDate, horizonMonths);
    }

    return merged;
  }, []);

  const updateInput = (key: string, value: unknown) => {
    setIsDirty(true);
    if (key === 'expectedInflation' || key === 'expectedNbpRate' || key === 'customInflation' || key === 'customNbpRate' || key === 'inflationScenario') {
      hasTouchedMacroAssumptions.current = true;
    }
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

    setInputs((prev) => normalizeInputs(prev, { [key as keyof BondInputs]: value } as Partial<BondInputs>));
  };

  const replaceInputs = useCallback((nextInputs: BondInputs) => {
    setIsDirty(true);
    setSelectedSeriesId(nextInputs.selectedSeriesId ?? 'current');
    setInputs(normalizeInputs(nextInputs, nextInputs));
  }, [normalizeInputs]);

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
    replaceInputs,
    setBondType,
    definitions,
    isLoadingDefs,
    lastCommittedInputs,
    isPersistenceReady,
  };
}
