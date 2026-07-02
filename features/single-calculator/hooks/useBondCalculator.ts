import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { BondSeriesMetadata } from '@/shared/lib/bond-series-client';
import {
  loadPersistedCalculatorState,
  savePersistedCalculatorState,
} from '@/shared/lib/calculator-persistence';
import { logClientError } from '@/shared/lib/client-logger';

import { BondInputs, BondType } from '../../bond-core/types';
import { SingleBondCalculationEnvelope } from '../../bond-core/types/scenarios';
import {
  fetchBondSeriesForSymbol,
  isCalculationAbort,
  runSingleBondCalculation,
} from '../lib/single-calculator-actions';
import {
  buildSingleCalculatorPersistenceSnapshot,
  getInitialSingleCalculatorClientState,
  resolveSingleCalculatorFieldUpdate,
  resolveSingleCalculatorReplacementInputs,
  resolveSingleCalculatorSelectedSeriesUpdate,
} from '../lib/single-calculator-client-state';
import {
  applySingleCalculatorMacroDefaults,
  type MacroDefaults,
  reconcilePersistedSingleCalculatorMacroDefaults,
  resolveDefinitionSyncedInputs,
} from '../lib/single-calculator-effect-state';
import {
  PersistedSingleCalculatorState,
  restoreSingleCalculatorState,
  SINGLE_CALCULATOR_STORAGE_KEY,
} from '../lib/single-calculator-persistence';
import { buildFallbackInputs, resolveBondTypeInputUpdate } from '../lib/single-calculator-state';

export function useBondCalculator(initialInputs?: BondInputs) {
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const fallbackInputs = useMemo(() => buildFallbackInputs(), []);
  const initialState = useMemo(
    () => getInitialSingleCalculatorClientState(initialInputs, fallbackInputs),
    [fallbackInputs, initialInputs],
  );
  const [inputs, setInputs] = useState<BondInputs>(initialState.inputs);
  const [envelope, setEnvelope] = useState<SingleBondCalculationEnvelope | null>(
    initialState.envelope,
  );
  const [isDirty, setIsDirty] = useState(initialState.isDirty);
  const [availableSeries, setAvailableSeries] = useState<BondSeriesMetadata[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(
    initialState.selectedSeriesId,
  );
  const [lastCommittedInputs, setLastCommittedInputs] = useState<BondInputs | null>(
    initialState.lastCommittedInputs,
  );
  const [isPersistenceReady, setIsPersistenceReady] = useState(initialState.isPersistenceReady);
  const hasRestoredState = useRef(false);
  const hasAutoCalculatedSharedScenario = useRef(false);
  const restoredFromPersistence = useRef(false);
  const hasTouchedMacroAssumptions = useRef(false);

  const { isCalculating, isError, clearError, post } = useCalculationRequest();

  const applyMacroDefaults = useEffectEvent((defaults: MacroDefaults) => {
    setInputs((previous) => {
      return applySingleCalculatorMacroDefaults(previous, defaults);
    });
  });

  const reconcilePersistedMacroDefaults = useEffectEvent((defaults: MacroDefaults) => {
    setInputs((previous) => {
      return reconcilePersistedSingleCalculatorMacroDefaults(previous, defaults);
    });
  });

  useEffect(() => {
    if (!definitions || !definitions[inputs.bondType]) {
      return;
    }

    const timer = window.setTimeout(() => {
      setInputs((previous) => {
        return resolveDefinitionSyncedInputs({
          previous,
          definitions,
          selectedSeriesId,
        });
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [definitions, inputs.bondType, selectedSeriesId]);

  useEffect(() => {
    if (initialInputs || hasRestoredState.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const restoredState = loadPersistedCalculatorState<PersistedSingleCalculatorState>(
        SINGLE_CALCULATOR_STORAGE_KEY,
      );
      hasRestoredState.current = true;

      const restored = restoreSingleCalculatorState(restoredState, fallbackInputs);
      if (restored) {
        restoredFromPersistence.current = restored.restoredFromPersistence;
        setInputs(restored.inputs);
        setEnvelope(restored.envelope);
        setSelectedSeriesId(restored.selectedSeriesId);
        setLastCommittedInputs(restored.lastCommittedInputs);
        setIsDirty(restored.isDirty);
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
        const { envelope: nextEnvelope, finalInputs } = await runSingleBondCalculation({
          inputs: currentInputs,
          post,
        });
        setEnvelope(nextEnvelope);
        setLastCommittedInputs(finalInputs);
      } catch (error) {
        if (isCalculationAbort(error)) {
          return;
        }
        logClientError('Calculation error:', error);
      }
    },
    [clearError, post],
  );

  const fetchSeries = useCallback(async (symbol: BondType) => {
    try {
      await Promise.resolve();
      setAvailableSeries(await fetchBondSeriesForSymbol(symbol));
    } catch (error) {
      logClientError('Failed to fetch series:', error);
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

    savePersistedCalculatorState(
      SINGLE_CALCULATOR_STORAGE_KEY,
      buildSingleCalculatorPersistenceSnapshot({
        inputs,
        envelope,
        selectedSeriesId,
        lastCommittedInputs,
        isDirty,
      }),
    );
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

  const updateInput = (key: string, value: unknown) => {
    setIsDirty(true);
    if (key === 'selectedSeriesId') {
      const seriesId = value as string | null;
      setSelectedSeriesId(seriesId);
      if (definitions) {
        setInputs((prev) => {
          const next = resolveSingleCalculatorSelectedSeriesUpdate({
            seriesId,
            previous: prev,
            definitions,
            availableSeries,
          });
          return next ?? prev;
        });
      }
      return;
    }

    setInputs((prev) => {
      const next = resolveSingleCalculatorFieldUpdate({
        key,
        value,
        previous: prev,
      });
      if (next.touchedMacroAssumptions) {
        hasTouchedMacroAssumptions.current = true;
      }
      return next.inputs;
    });
  };

  const replaceInputs = useCallback((nextInputs: BondInputs) => {
    setIsDirty(true);
    const replacement = resolveSingleCalculatorReplacementInputs(nextInputs);
    setSelectedSeriesId(replacement.selectedSeriesId);
    setInputs(replacement.inputs);
  }, []);

  const setBondType = (type: BondType) => {
    if (!definitions) return;
    setIsDirty(true);
    setSelectedSeriesId('current');
    setInputs((prev) => resolveBondTypeInputUpdate(prev, type, definitions[type]));
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
