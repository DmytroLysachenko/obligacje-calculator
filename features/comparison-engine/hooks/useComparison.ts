'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { logClientError } from '@/shared/lib/client-logger';

import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { type BondInputs, BondType } from '../../bond-core/types';
import type { BondComparisonCalculationEnvelope } from '../../bond-core/types/scenarios';
import { runComparisonCalculation } from '../lib/comparison-actions';
import {
  buildDefaultSharedConfig,
  buildScenarioInputs,
  DEFAULT_SCENARIO_A,
  DEFAULT_SCENARIO_B,
  getComparisonDirtyState,
  type ScenarioOverride,
  type SharedComparisonConfig,
  splitComparisonEnvelope,
} from '../lib/comparison-calculator-state';
import {
  applyScenarioBondTypeUpdate,
  applyScenarioCustomHorizonEnabled,
  applyScenarioCustomHorizonMonths,
  applyScenarioOverrideUpdate,
  applySharedComparisonConfigUpdate,
  type ComparisonUpdateValue,
  isSharedComparisonMacroUpdate,
} from '../lib/comparison-update-actions';

import { useComparisonPersistenceEffects } from './useComparisonPersistenceEffects';

export function useComparison() {
  const { definitions } = useBondDefinitions();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const [sharedConfig, setSharedConfig] =
    useState<SharedComparisonConfig>(buildDefaultSharedConfig);
  const [scenarioA, setScenarioA] = useState<ScenarioOverride>(DEFAULT_SCENARIO_A);
  const [scenarioB, setScenarioB] = useState<ScenarioOverride>(DEFAULT_SCENARIO_B);
  const [comparisonEnvelope, setComparisonEnvelope] =
    useState<BondComparisonCalculationEnvelope | null>(null);
  const [committedInputsA, setCommittedInputsA] = useState<BondInputs | null>(null);
  const [committedInputsB, setCommittedInputsB] = useState<BondInputs | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);
  const hasRestoredState = useRef(false);
  const restoredFromPersistence = useRef(false);
  const hasTouchedMacroAssumptions = useRef(false);
  const { isCalculating, post } = useCalculationRequest();

  const inputsA = useMemo(
    () => buildScenarioInputs(sharedConfig, scenarioA, definitions),
    [definitions, sharedConfig, scenarioA],
  );
  const inputsB = useMemo(
    () => buildScenarioInputs(sharedConfig, scenarioB, definitions),
    [definitions, sharedConfig, scenarioB],
  );

  const { resultsA, resultsB, envelopeA, envelopeB } = useMemo(
    () => splitComparisonEnvelope(comparisonEnvelope),
    [comparisonEnvelope],
  );
  const displayIsDirty = useMemo(() => {
    return getComparisonDirtyState({
      inputsA,
      inputsB,
      committedInputsA,
      committedInputsB,
      isDirty,
      hasResults: Boolean(resultsA && resultsB),
    });
  }, [committedInputsA, committedInputsB, inputsA, inputsB, isDirty, resultsA, resultsB]);

  const calculate = useCallback(async () => {
    setIsDirty(false);
    try {
      const envelope = await runComparisonCalculation({ sharedConfig, scenarioA, scenarioB, post });
      setComparisonEnvelope(envelope);
      setCommittedInputsA(inputsA);
      setCommittedInputsB(inputsB);
    } catch (error) {
      logClientError('Comparison error:', error);
    }
  }, [inputsA, inputsB, post, scenarioA, scenarioB, sharedConfig]);

  const updateSharedConfig = (key: keyof SharedComparisonConfig, value: ComparisonUpdateValue) => {
    setIsDirty(true);
    if (isSharedComparisonMacroUpdate(key)) {
      hasTouchedMacroAssumptions.current = true;
    }
    setSharedConfig((prev) => {
      return applySharedComparisonConfigUpdate(prev, key, value);
    });
  };

  const updateScenarioA = (key: keyof ScenarioOverride, value: ComparisonUpdateValue) => {
    setIsDirty(true);
    setScenarioA((prev) => applyScenarioOverrideUpdate(prev, key, value));
  };

  const updateScenarioB = (key: keyof ScenarioOverride, value: ComparisonUpdateValue) => {
    setIsDirty(true);
    setScenarioB((prev) => applyScenarioOverrideUpdate(prev, key, value));
  };

  const setBondTypeA = (type: BondType) => {
    setIsDirty(true);
    setScenarioA((prev) => applyScenarioBondTypeUpdate(prev, type));
  };

  const setBondTypeB = (type: BondType) => {
    setIsDirty(true);
    setScenarioB((prev) => applyScenarioBondTypeUpdate(prev, type));
  };

  useComparisonPersistenceEffects({
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
  });

  const setScenarioACustomHorizonEnabled = useCallback(
    (enabled: boolean) => {
      setIsDirty(true);
      setScenarioA((previous) =>
        applyScenarioCustomHorizonEnabled(sharedConfig, previous, enabled),
      );
    },
    [sharedConfig],
  );

  const setScenarioBCustomHorizonEnabled = useCallback(
    (enabled: boolean) => {
      setIsDirty(true);
      setScenarioB((previous) =>
        applyScenarioCustomHorizonEnabled(sharedConfig, previous, enabled),
      );
    },
    [sharedConfig],
  );

  const setScenarioACustomHorizonMonths = useCallback(
    (value: number | undefined) => {
      setIsDirty(true);
      setScenarioA((previous) => applyScenarioCustomHorizonMonths(sharedConfig, previous, value));
    },
    [sharedConfig],
  );

  const setScenarioBCustomHorizonMonths = useCallback(
    (value: number | undefined) => {
      setIsDirty(true);
      setScenarioB((previous) => applyScenarioCustomHorizonMonths(sharedConfig, previous, value));
    },
    [sharedConfig],
  );

  return {
    sharedConfig,
    scenarioA,
    scenarioB,
    inputsA,
    inputsB,
    committedInputsA,
    committedInputsB,
    resultsA,
    resultsB,
    envelopeA,
    envelopeB,
    warningsA: envelopeA?.warnings || [],
    warningsB: envelopeB?.warnings || [],
    isCalculating,
    isDirty: displayIsDirty,
    calculate,
    updateSharedConfig,
    updateScenarioA,
    updateScenarioB,
    setBondTypeA,
    setBondTypeB,
    setScenarioACustomHorizonEnabled,
    setScenarioBCustomHorizonEnabled,
    setScenarioACustomHorizonMonths,
    setScenarioBCustomHorizonMonths,
    definitions: definitions ?? BOND_DEFINITIONS,
    isPersistenceReady,
  };
}
