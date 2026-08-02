'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useCalculatorSession } from '@/shared/hooks/useCalculatorSession';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import { createCalculationEnvelopeVersionValidator } from '@/shared/lib/calculation-envelope-version';
import { applyUntouchedMacroDefaults } from '@/shared/lib/calculator-session-persistence';
import { preserveStableState } from '@/shared/lib/calculator-state';
import { logClientError } from '@/shared/lib/client-logger';

import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { MODEL_VERSION } from '../../bond-core/handlers';
import { BondType, RegularInvestmentInputs } from '../../bond-core/types';
import {
  RegularInvestmentCalculationEnvelope,
  ScenarioKind,
} from '../../bond-core/types/scenarios';
import {
  applyLadderBondDefinition,
  buildDefaultLadderInputs,
  isLadderMacroInputKey,
  normalizeLadderInputs,
  resolveLadderBondTypeUpdate,
} from '../lib/ladder-state';

const STORAGE_KEY = 'obligacje.ladder-calculator.v1';

/** Ladder keeps worker calculation local while session owns draft and committed snapshots. */
export function useLadder() {
  const { definitions } = useBondDefinitions();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const fallbackInputs = useMemo(() => buildDefaultLadderInputs(), []);
  const isCommittedResultValid = useMemo(
    () => createCalculationEnvelopeVersionValidator(MODEL_VERSION),
    [],
  );
  const hasTouchedMacroAssumptions = useRef(false);
  const { isCalculating, post } = useCalculationRequest();
  const session = useCalculatorSession<
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
    runCalculation,
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
        applyLadderBondDefinition(previous, definitions[previous.bondType]),
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
      await runCalculation((draftInputs) =>
        post<RegularInvestmentCalculationEnvelope>(
          getCalculationEndpoint(ScenarioKind.REGULAR_INVESTMENT),
          draftInputs,
        ),
      );
    } catch (error) {
      logClientError('Ladder calculation error:', error);
    }
  }, [post, runCalculation]);

  const updateInput = useCallback(
    (key: keyof RegularInvestmentInputs, value: string | number | boolean | undefined) => {
      if (isLadderMacroInputKey(key)) hasTouchedMacroAssumptions.current = true;
      updateDraft((previous) =>
        normalizeLadderInputs(previous, { [key]: value } as Partial<RegularInvestmentInputs>),
      );
    },
    [updateDraft],
  );

  const setBondType = useCallback(
    (type: BondType) => {
      updateDraft((previous) => resolveLadderBondTypeUpdate(previous, type, definitions));
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
    isDirty: session.isDirty,
    isCalculating,
    calculate,
    updateInput,
    setBondType,
    definitions: definitions ?? BOND_DEFINITIONS,
    isPersistenceReady: session.isPersistenceReady,
    committedInputs: session.committedInputs,
    hasPreviousOfferResult: Boolean(session.committedInputs && session.isDirty),
  };
}
