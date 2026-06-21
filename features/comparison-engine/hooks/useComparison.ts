'use client';

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { BondInputs, BondType } from '../../bond-core/types';
import {
  BondComparisonCalculationEnvelope,
  ScenarioKind,
} from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { loadPersistedCalculatorState, savePersistedCalculatorState } from '@/shared/lib/calculator-persistence';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { applyMacroDefaultsToBaseline } from '@/shared/lib/macro-assumption-defaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import { preserveStableState } from '@/shared/lib/calculator-state';
import {
  sanitizeScenarioOverride,
  setScenarioCustomHorizonMonths,
  toggleScenarioCustomHorizon,
} from '../lib/comparison-scenario-state';
import {
  buildDefaultSharedConfig,
  buildScenarioInputs,
  DEFAULT_SCENARIO_A,
  DEFAULT_SCENARIO_B,
  getComparisonDirtyState,
  splitComparisonEnvelope,
  type ScenarioOverride,
  type SharedComparisonConfig,
  updateSharedComparisonConfig,
} from '../lib/comparison-calculator-state';

const STORAGE_KEY = 'obligacje.comparison-calculator.v3';

interface PersistedComparisonState {
  sharedConfig: SharedComparisonConfig;
  scenarioA: ScenarioOverride;
  scenarioB: ScenarioOverride;
  comparisonEnvelope: BondComparisonCalculationEnvelope | null;
  committedInputsA: BondInputs | null;
  committedInputsB: BondInputs | null;
  isDirty: boolean;
}

export function useComparison() {
  const { definitions } = useBondDefinitions();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const [sharedConfig, setSharedConfig] = useState<SharedComparisonConfig>(
    buildDefaultSharedConfig,
  );
  const [scenarioA, setScenarioA] = useState<ScenarioOverride>(
    DEFAULT_SCENARIO_A,
  );
  const [scenarioB, setScenarioB] = useState<ScenarioOverride>(
    DEFAULT_SCENARIO_B,
  );
  const [comparisonEnvelope, setComparisonEnvelope] = useState<BondComparisonCalculationEnvelope | null>(
    null,
  );
  const [committedInputsA, setCommittedInputsA] = useState<BondInputs | null>(null);
  const [committedInputsB, setCommittedInputsB] = useState<BondInputs | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);
  const hasRestoredState = useRef(false);
  const restoredFromPersistence = useRef(false);
  const hasTouchedMacroAssumptions = useRef(false);
  const { isCalculating, post } = useCalculationRequest();

  const applyMacroDefaults = useEffectEvent((defaults: { expectedInflation: number; expectedNbpRate: number }) => {
    setSharedConfig((previous) => {
      const next = {
        ...previous,
        expectedInflation: defaults.expectedInflation,
        expectedNbpRate: defaults.expectedNbpRate,
      };

      return preserveStableState(previous, next);
    });
  });

  const reconcilePersistedMacroDefaults = useEffectEvent((defaults: { expectedInflation: number; expectedNbpRate: number }) => {
    setSharedConfig((previous) => {
      const next = applyMacroDefaultsToBaseline(previous, defaults);
      return preserveStableState(previous, next);
    });
  });

  const inputsA = useMemo(() => buildScenarioInputs(sharedConfig, scenarioA, definitions), [definitions, sharedConfig, scenarioA]);
  const inputsB = useMemo(() => buildScenarioInputs(sharedConfig, scenarioB, definitions), [definitions, sharedConfig, scenarioB]);

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
      const envelope = await post<BondComparisonCalculationEnvelope>(
        getCalculationEndpoint(ScenarioKind.BOND_COMPARISON),
        {
          mode: 'independent',
          sharedConfig,
          scenarioA,
          scenarioB,
        },
        { preferWorker: true },
      );
      setComparisonEnvelope(envelope);
      setCommittedInputsA(inputsA);
      setCommittedInputsB(inputsB);
    } catch (error) {
      console.error('Comparison error:', error);
    }
  }, [inputsA, inputsB, post, scenarioA, scenarioB, sharedConfig]);

  const updateSharedConfig = (key: keyof SharedComparisonConfig, value: string | number | boolean | undefined) => {
    setIsDirty(true);
    if (key === 'expectedInflation' || key === 'expectedNbpRate' || key === 'customInflation' || key === 'customNbpRate' || key === 'inflationScenario') {
      hasTouchedMacroAssumptions.current = true;
    }
    setSharedConfig((prev) => {
      return updateSharedComparisonConfig(prev, key, value);
    });
  };

  const updateScenarioA = (key: keyof ScenarioOverride, value: string | number | boolean | undefined) => {
    setIsDirty(true);
    setScenarioA((prev) => ({ ...prev, [key]: value }));
  };

  const updateScenarioB = (key: keyof ScenarioOverride, value: string | number | boolean | undefined) => {
    setIsDirty(true);
    setScenarioB((prev) => ({ ...prev, [key]: value }));
  };

  const setBondTypeA = (type: BondType) => {
    setIsDirty(true);
    setScenarioA((prev) => ({
      ...prev,
      bondType: type,
      isRebought: false,
      investmentHorizonMonths: prev.investmentHorizonMonths,
    }));
  };

  const setBondTypeB = (type: BondType) => {
    setIsDirty(true);
    setScenarioB((prev) => ({
      ...prev,
      bondType: type,
      isRebought: false,
      investmentHorizonMonths: prev.investmentHorizonMonths,
    }));
  };

  useEffect(() => {
    if (hasRestoredState.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const restoredState = loadPersistedCalculatorState<PersistedComparisonState>(STORAGE_KEY);
      hasRestoredState.current = true;
      if (restoredState) {
        restoredFromPersistence.current = true;
        setSharedConfig(restoredState.sharedConfig);
        setScenarioA(sanitizeScenarioOverride(restoredState.sharedConfig, restoredState.scenarioA));
        setScenarioB(sanitizeScenarioOverride(restoredState.sharedConfig, restoredState.scenarioB));
        setComparisonEnvelope(restoredState.comparisonEnvelope ?? null);
        setCommittedInputsA(restoredState.committedInputsA ?? null);
        setCommittedInputsB(restoredState.committedInputsB ?? null);
        setIsDirty(restoredState.isDirty ?? true);
      }

      setIsPersistenceReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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
  }, [isPersistenceReady, macroDefaults]);

  useEffect(() => {
    if (!isPersistenceReady) {
      return;
    }

    savePersistedCalculatorState(STORAGE_KEY, {
      sharedConfig,
      scenarioA: sanitizeScenarioOverride(sharedConfig, scenarioA),
      scenarioB: sanitizeScenarioOverride(sharedConfig, scenarioB),
      comparisonEnvelope,
      committedInputsA,
      committedInputsB,
      isDirty: displayIsDirty,
    });
  }, [committedInputsA, committedInputsB, comparisonEnvelope, displayIsDirty, isPersistenceReady, scenarioA, scenarioB, sharedConfig]);

  const setScenarioACustomHorizonEnabled = useCallback((enabled: boolean) => {
    setIsDirty(true);
    setScenarioA((previous) => toggleScenarioCustomHorizon(sharedConfig, previous, enabled));
  }, [sharedConfig]);

  const setScenarioBCustomHorizonEnabled = useCallback((enabled: boolean) => {
    setIsDirty(true);
    setScenarioB((previous) => toggleScenarioCustomHorizon(sharedConfig, previous, enabled));
  }, [sharedConfig]);

  const setScenarioACustomHorizonMonths = useCallback((value: number | undefined) => {
    setIsDirty(true);
    setScenarioA((previous) => setScenarioCustomHorizonMonths(sharedConfig, previous, value));
  }, [sharedConfig]);

  const setScenarioBCustomHorizonMonths = useCallback((value: number | undefined) => {
    setIsDirty(true);
    setScenarioB((previous) => setScenarioCustomHorizonMonths(sharedConfig, previous, value));
  }, [sharedConfig]);

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
