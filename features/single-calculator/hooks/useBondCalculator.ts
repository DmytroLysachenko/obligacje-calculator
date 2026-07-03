import { useCallback, useMemo, useRef, useState } from 'react';

import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { BondSeriesMetadata } from '@/shared/lib/bond-series-client';
import { logClientError } from '@/shared/lib/client-logger';

import { BondInputs, BondType } from '../../bond-core/types';
import { SingleBondCalculationEnvelope } from '../../bond-core/types/scenarios';
import { isCalculationAbort, runSingleBondCalculation } from '../lib/single-calculator-actions';
import {
  getInitialSingleCalculatorClientState,
  resolveSingleCalculatorFieldUpdate,
  resolveSingleCalculatorReplacementInputs,
  resolveSingleCalculatorSelectedSeriesUpdate,
} from '../lib/single-calculator-client-state';
import { buildFallbackInputs, resolveBondTypeInputUpdate } from '../lib/single-calculator-state';

import { useBondCalculatorEffects } from './useBondCalculatorEffects';

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

  useBondCalculatorEffects({
    inputs,
    envelope,
    selectedSeriesId,
    lastCommittedInputs,
    isDirty,
    isCalculating,
    isPersistenceReady,
    initialInputs,
    fallbackInputs,
    definitions,
    macroDefaults,
    calculate,
    hasRestoredStateRef: hasRestoredState,
    hasAutoCalculatedSharedScenarioRef: hasAutoCalculatedSharedScenario,
    restoredFromPersistenceRef: restoredFromPersistence,
    hasTouchedMacroAssumptionsRef: hasTouchedMacroAssumptions,
    setInputs,
    setEnvelope,
    setSelectedSeriesId,
    setLastCommittedInputs,
    setIsDirty,
    setIsPersistenceReady,
    setAvailableSeries,
  });

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
