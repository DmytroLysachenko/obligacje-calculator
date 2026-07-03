'use client';

import { useEffect, useEffectEvent } from 'react';

import {
  loadPersistedCalculatorState,
  savePersistedCalculatorState,
} from '@/shared/lib/calculator-persistence';

import type { BondInputs } from '../../bond-core/types';
import type { BondComparisonCalculationEnvelope } from '../../bond-core/types/scenarios';
import type { ScenarioOverride, SharedComparisonConfig } from '../lib/comparison-calculator-state';
import {
  applyComparisonMacroDefaults,
  buildComparisonPersistenceSnapshot,
  reconcileComparisonPersistedMacroDefaults,
} from '../lib/comparison-client-state';
import {
  COMPARISON_CALCULATOR_STORAGE_KEY,
  type PersistedComparisonState,
  restoreComparisonState,
} from '../lib/comparison-persistence';

interface MacroDefaults {
  expectedInflation: number;
  expectedNbpRate: number;
}

interface ComparisonPersistenceEffectsInput {
  sharedConfig: SharedComparisonConfig;
  scenarioA: ScenarioOverride;
  scenarioB: ScenarioOverride;
  comparisonEnvelope: BondComparisonCalculationEnvelope | null;
  committedInputsA: BondInputs | null;
  committedInputsB: BondInputs | null;
  displayIsDirty: boolean;
  isPersistenceReady: boolean;
  macroDefaults: MacroDefaults | null | undefined;
  hasRestoredState: React.MutableRefObject<boolean>;
  restoredFromPersistence: React.MutableRefObject<boolean>;
  hasTouchedMacroAssumptions: React.MutableRefObject<boolean>;
  setSharedConfig: React.Dispatch<React.SetStateAction<SharedComparisonConfig>>;
  setScenarioA: React.Dispatch<React.SetStateAction<ScenarioOverride>>;
  setScenarioB: React.Dispatch<React.SetStateAction<ScenarioOverride>>;
  setComparisonEnvelope: React.Dispatch<
    React.SetStateAction<BondComparisonCalculationEnvelope | null>
  >;
  setCommittedInputsA: React.Dispatch<React.SetStateAction<BondInputs | null>>;
  setCommittedInputsB: React.Dispatch<React.SetStateAction<BondInputs | null>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPersistenceReady: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useComparisonPersistenceEffects({
  sharedConfig,
  scenarioA,
  scenarioB,
  comparisonEnvelope,
  committedInputsA,
  committedInputsB,
  displayIsDirty,
  isPersistenceReady,
  macroDefaults,
  hasRestoredState,
  restoredFromPersistence,
  hasTouchedMacroAssumptions,
  setSharedConfig,
  setScenarioA,
  setScenarioB,
  setComparisonEnvelope,
  setCommittedInputsA,
  setCommittedInputsB,
  setIsDirty,
  setIsPersistenceReady,
}: ComparisonPersistenceEffectsInput) {
  const applyMacroDefaults = useEffectEvent((defaults: MacroDefaults) => {
    setSharedConfig((previous) => applyComparisonMacroDefaults(previous, defaults));
  });

  const reconcilePersistedMacroDefaults = useEffectEvent((defaults: MacroDefaults) => {
    setSharedConfig((previous) => reconcileComparisonPersistedMacroDefaults(previous, defaults));
  });

  useEffect(() => {
    if (hasRestoredState.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const restoredState = loadPersistedCalculatorState<PersistedComparisonState>(
        COMPARISON_CALCULATOR_STORAGE_KEY,
      );
      hasRestoredState.current = true;
      const restored = restoreComparisonState(restoredState);
      if (restored) {
        restoredFromPersistence.current = restored.restoredFromPersistence;
        setSharedConfig(restored.sharedConfig);
        setScenarioA(restored.scenarioA);
        setScenarioB(restored.scenarioB);
        setComparisonEnvelope(restored.comparisonEnvelope);
        setCommittedInputsA(restored.committedInputsA);
        setCommittedInputsB(restored.committedInputsB);
        setIsDirty(restored.isDirty);
      }

      setIsPersistenceReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    hasRestoredState,
    restoredFromPersistence,
    setCommittedInputsA,
    setCommittedInputsB,
    setComparisonEnvelope,
    setIsDirty,
    setIsPersistenceReady,
    setScenarioA,
    setScenarioB,
    setSharedConfig,
  ]);

  useEffect(() => {
    if (!macroDefaults || !isPersistenceReady || hasTouchedMacroAssumptions.current) {
      return;
    }

    if (restoredFromPersistence.current) {
      const timer = window.setTimeout(() => {
        reconcilePersistedMacroDefaults(macroDefaults);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    applyMacroDefaults(macroDefaults);
  }, [hasTouchedMacroAssumptions, isPersistenceReady, macroDefaults, restoredFromPersistence]);

  useEffect(() => {
    if (!isPersistenceReady) {
      return;
    }

    savePersistedCalculatorState(
      COMPARISON_CALCULATOR_STORAGE_KEY,
      buildComparisonPersistenceSnapshot({
        sharedConfig,
        scenarioA,
        scenarioB,
        comparisonEnvelope,
        committedInputsA,
        committedInputsB,
        isDirty: displayIsDirty,
      }),
    );
  }, [
    committedInputsA,
    committedInputsB,
    comparisonEnvelope,
    displayIsDirty,
    isPersistenceReady,
    scenarioA,
    scenarioB,
    sharedConfig,
  ]);
}
