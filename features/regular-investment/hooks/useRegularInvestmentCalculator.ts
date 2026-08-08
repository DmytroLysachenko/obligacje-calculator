'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { useCalculatorWorkflow } from '@/shared/hooks/useCalculatorWorkflow';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import { createCalculationEnvelopeVersionValidator } from '@/shared/lib/calculation-envelope-version';
import { applyUntouchedMacroDefaults } from '@/shared/lib/calculator-session-persistence';
import { preserveStableState, stripDisplayOnlyInputs } from '@/shared/lib/calculator-state';
import { logClientError } from '@/shared/lib/client-logger';

import { MODEL_VERSION } from '../../bond-core/handlers';
import { BondType, RegularInvestmentInputs } from '../../bond-core/types';
import {
  RegularInvestmentCalculationEnvelope,
  ScenarioKind,
} from '../../bond-core/types/scenarios';
import {
  applyRegularInvestmentDefinition,
  buildRegularInvestmentFallbackInputs,
  isRegularInvestmentMacroInputKey,
  normalizeRegularInvestmentInputs,
  resolveRegularInvestmentBondTypeUpdate,
} from '../lib/regular-investment-state';

const STORAGE_KEY = 'obligacje.regular-calculator.v1';

/** Draft changes never replace displayed result. Session commits only successful calculations. */
export function useRegularInvestmentCalculator() {
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const fallbackInputs = useMemo(() => buildRegularInvestmentFallbackInputs(), []);
  const isCommittedResultValid = useMemo(
    () => createCalculationEnvelopeVersionValidator(MODEL_VERSION),
    [],
  );
  const hasTouchedMacroAssumptions = useRef(false);
  const session = useCalculatorWorkflow<
    RegularInvestmentInputs,
    RegularInvestmentCalculationEnvelope
  >({
    initialInputs: fallbackInputs,
    storageKey: STORAGE_KEY,
    isCommittedResultValid,
  });
  const {
    draftInputs: inputs,
    committedResult: envelope,
    setDraftInputs,
    runRemoteCalculation,
  } = session;

  const updateDraft = useCallback(
    (update: (previous: RegularInvestmentInputs) => RegularInvestmentInputs) => {
      setDraftInputs(preserveStableState(inputs, update(inputs)));
    },
    [inputs, setDraftInputs],
  );

  useEffect(() => {
    if (!definitions || !definitions[inputs.bondType]) return;
    const timer = window.setTimeout(() => {
      updateDraft((previous) =>
        applyRegularInvestmentDefinition(previous, definitions[previous.bondType]),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [definitions, inputs.bondType, updateDraft]);

  useEffect(() => {
    if (!macroDefaults || !session.isPersistenceReady || hasTouchedMacroAssumptions.current) return;
    updateDraft((previous) => applyUntouchedMacroDefaults(previous, macroDefaults, false));
  }, [macroDefaults, session.isPersistenceReady, updateDraft]);

  const calculate = useCallback(async () => {
    try {
      await runRemoteCalculation(
        getCalculationEndpoint(ScenarioKind.REGULAR_INVESTMENT),
        (draftInputs) => stripDisplayOnlyInputs(draftInputs) ?? draftInputs,
      );
    } catch (error) {
      logClientError('Calculation error:', error);
    }
  }, [runRemoteCalculation]);

  const updateInput = useCallback(
    (key: keyof RegularInvestmentInputs, value: string | number | boolean | undefined) => {
      if (isRegularInvestmentMacroInputKey(key)) hasTouchedMacroAssumptions.current = true;
      updateDraft((previous) =>
        normalizeRegularInvestmentInputs(previous, {
          [key]: value,
        } as Partial<RegularInvestmentInputs>),
      );
    },
    [updateDraft],
  );

  const setBondType = useCallback(
    (type: BondType) => {
      if (!definitions) return;
      updateDraft((previous) =>
        resolveRegularInvestmentBondTypeUpdate(previous, type, definitions[type]),
      );
    },
    [definitions, updateDraft],
  );

  return {
    inputs,
    results: envelope?.result ?? null,
    envelope,
    warnings: envelope?.warnings ?? [],
    assumptions: envelope?.assumptions ?? [],
    dataFreshness: envelope?.dataFreshness,
    isCalculating: session.isCalculating,
    isError: session.isError,
    isDirty: session.isDirty,
    calculate,
    updateInput,
    setBondType,
    definitions,
    isLoadingDefs,
    isPersistenceReady: session.isPersistenceReady,
    committedInputs: session.committedInputs,
    hasPreviousOfferResult: Boolean(session.committedInputs && session.isDirty),
  };
}
