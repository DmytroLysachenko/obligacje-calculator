import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { bondSeriesClient, BondSeriesMetadata } from '@/shared/lib/bond-series-client';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import {
  loadPersistedCalculatorState,
  savePersistedCalculatorState,
} from '@/shared/lib/calculator-persistence';
import {
  preserveStableState,
  restoreVersionedEnvelope,
  stripDisplayOnlyInputs,
} from '@/shared/lib/calculator-state';
import { getHorizonMonths, getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';
import { applyMacroDefaultsToBaseline } from '@/shared/lib/macro-assumption-defaults';

import { MODEL_VERSION } from '../../bond-core/model-version';
import { BondInputs, BondType } from '../../bond-core/types';
import { ScenarioKind, SingleBondCalculationEnvelope } from '../../bond-core/types/scenarios';
import {
  applyDefinitionToInputs,
  applyReverseSavingsGoal,
  buildFallbackInputs,
  getReverseCalculationTestInputs,
  normalizeSingleCalculatorInputs,
} from '../lib/single-calculator-state';

const STORAGE_KEY = 'obligacje.single-calculator.v1';

interface PersistedSingleCalculatorState {
  inputs: BondInputs;
  envelope: SingleBondCalculationEnvelope | null;
  selectedSeriesId: string | null;
  lastCommittedInputs: BondInputs | null;
  isDirty: boolean;
}

export function useBondCalculator(initialInputs?: BondInputs) {
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const fallbackInputs = useMemo(() => buildFallbackInputs(), []);
  const [inputs, setInputs] = useState<BondInputs>(initialInputs ?? fallbackInputs);
  const [envelope, setEnvelope] = useState<SingleBondCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(initialInputs ? false : true);
  const [availableSeries, setAvailableSeries] = useState<BondSeriesMetadata[]>([]);
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

  const applyMacroDefaults = useEffectEvent(
    (defaults: { expectedInflation: number; expectedNbpRate: number }) => {
      setInputs((previous) => {
        const next = {
          ...previous,
          expectedInflation: defaults.expectedInflation,
          expectedNbpRate: defaults.expectedNbpRate,
        };

        return preserveStableState(previous, next);
      });
    },
  );

  const reconcilePersistedMacroDefaults = useEffectEvent(
    (defaults: { expectedInflation: number; expectedNbpRate: number }) => {
      setInputs((previous) => {
        const next = applyMacroDefaultsToBaseline(previous, defaults);
        return preserveStableState(previous, next);
      });
    },
  );

  useEffect(() => {
    if (!definitions || !definitions[inputs.bondType]) {
      return;
    }

    const definition = definitions[inputs.bondType];
    const timer = window.setTimeout(() => {
      setInputs((previous) => {
        const next = applyDefinitionToInputs(previous, definition, selectedSeriesId);
        return preserveStableState(previous, next);
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
        const restoredEnvelope = restoreVersionedEnvelope(restoredState.envelope, MODEL_VERSION);
        restoredFromPersistence.current = true;
        setInputs(stripDisplayOnlyInputs(restoredState.inputs) ?? fallbackInputs);
        setEnvelope(restoredEnvelope);
        setSelectedSeriesId(restoredState.selectedSeriesId ?? null);
        setLastCommittedInputs(
          restoredEnvelope
            ? stripDisplayOnlyInputs(restoredState.lastCommittedInputs ?? null)
            : null,
        );
        setIsDirty(restoredEnvelope ? (restoredState.isDirty ?? true) : true);
      }

      setIsPersistenceReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fallbackInputs, initialInputs]);

  useEffect(() => {
    if (
      !macroDefaults ||
      initialInputs ||
      !isPersistenceReady ||
      hasTouchedMacroAssumptions.current
    ) {
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

  const calculate = useCallback(
    async (currentInputs: BondInputs) => {
      try {
        await Promise.resolve(); // Defer state updates to avoid synchronous setState in effect
        setIsDirty(false);
        clearError();
        let finalInputs = { ...currentInputs };

        if (currentInputs.calculatorMode === 'reverse' && currentInputs.savingsGoal) {
          const simEnvelope = await post<SingleBondCalculationEnvelope>(
            getCalculationEndpoint(ScenarioKind.SINGLE_BOND),
            getReverseCalculationTestInputs(currentInputs),
            { preferWorker: true },
          );
          finalInputs = applyReverseSavingsGoal(currentInputs, simEnvelope.result.netPayoutValue);
        }

        const data = await post<SingleBondCalculationEnvelope>(
          getCalculationEndpoint(ScenarioKind.SINGLE_BOND),
          finalInputs,
          { preferWorker: true },
        );
        setEnvelope(data);
        setLastCommittedInputs(finalInputs);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.name === 'AbortError' || error.message === 'Calculation aborted')
        ) {
          return;
        }
        console.error('Calculation error:', error);
      }
    },
    [clearError, post],
  );

  const fetchSeries = useCallback(async (symbol: BondType) => {
    try {
      await Promise.resolve();
      setAvailableSeries(await bondSeriesClient.listBySymbol(symbol));
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
  }, [
    envelope,
    initialInputs,
    inputs,
    isDirty,
    isPersistenceReady,
    lastCommittedInputs,
    selectedSeriesId,
  ]);

  const results = envelope?.result || null;

  const normalizeInputs = useCallback(
    (base: BondInputs, nextPartial?: Partial<BondInputs>) =>
      normalizeSingleCalculatorInputs(base, nextPartial),
    [],
  );

  const updateInput = (key: string, value: unknown) => {
    setIsDirty(true);
    if (
      key === 'expectedInflation' ||
      key === 'expectedNbpRate' ||
      key === 'customInflation' ||
      key === 'customNbpRate' ||
      key === 'inflationScenario'
    ) {
      hasTouchedMacroAssumptions.current = true;
    }
    if (key === 'selectedSeriesId') {
      const seriesId = value as string | null;
      setSelectedSeriesId(seriesId);
      if (seriesId === 'current' && definitions) {
        const def = definitions[inputs.bondType];
        setInputs((prev) => ({
          ...prev,
          firstYearRate: def.firstYearRate,
          margin: def.margin,
        }));
        return;
      }
      const series = availableSeries.find((s) => s.id === seriesId);
      if (series) {
        setInputs((prev) => ({
          ...prev,
          firstYearRate: Number(series.firstYearRate),
          margin: Number(series.baseMargin),
          purchaseDate: series.emissionMonth,
          withdrawalDate: getWithdrawalDateFromMonths(
            series.emissionMonth,
            prev.investmentHorizonMonths ?? Math.round(prev.duration * 12),
          ),
        }));
      }
      return;
    }

    setInputs((prev) =>
      normalizeInputs(prev, { [key as keyof BondInputs]: value } as Partial<BondInputs>),
    );
  };

  const replaceInputs = useCallback(
    (nextInputs: BondInputs) => {
      setIsDirty(true);
      setSelectedSeriesId(nextInputs.selectedSeriesId ?? 'current');
      setInputs(normalizeInputs(nextInputs, nextInputs));
    },
    [normalizeInputs],
  );

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
