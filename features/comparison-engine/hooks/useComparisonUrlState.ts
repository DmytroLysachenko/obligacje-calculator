'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import type { ScenarioOverride, SharedComparisonConfig } from '../lib/comparison-calculator-state';
import { type ComparisonUrlState, withComparisonUrlState } from '../lib/comparison-deep-link';
import {
  applyScenarioBondTypeUpdate,
  applyScenarioCustomHorizonEnabled,
  applyScenarioCustomHorizonMonths,
  applyScenarioOverrideUpdate,
  applySharedComparisonConfigUpdate,
  type ComparisonUpdateValue,
} from '../lib/comparison-update-actions';

type ScenarioKey = 'A' | 'B';

interface ComparisonUrlActions {
  updateSharedConfig: (key: keyof SharedComparisonConfig, value: ComparisonUpdateValue) => void;
  updateScenario: (
    scenario: ScenarioKey,
    key: keyof ScenarioOverride,
    value: ComparisonUpdateValue,
  ) => void;
  updateBondType: (scenario: ScenarioKey, bondType: ScenarioOverride['bondType']) => void;
  updateCustomHorizon: (
    scenario: ScenarioKey,
    value: number | undefined,
    enabled?: boolean,
  ) => void;
}

interface UseComparisonUrlStateOptions extends ComparisonUrlActions {
  sharedConfig: SharedComparisonConfig;
  scenarioA: ScenarioOverride;
  scenarioB: ScenarioOverride;
}

/** Owns comparison deep-link parsing and URL-backed edit transitions. */
export function useComparisonUrlState({
  sharedConfig,
  scenarioA,
  scenarioB,
  updateSharedConfig,
  updateScenario,
  updateBondType,
  updateCustomHorizon,
}: UseComparisonUrlStateOptions) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentState = useMemo<ComparisonUrlState>(
    () => ({ sharedConfig, scenarioA, scenarioB }),
    [scenarioA, scenarioB, sharedConfig],
  );
  const sync = useCallback(
    (nextState: ComparisonUrlState) => {
      router.push(
        withComparisonUrlState(pathname, new URLSearchParams(searchParams.toString()), nextState),
      );
    },
    [pathname, router, searchParams],
  );
  const onSharedConfigChange = useCallback(
    (key: keyof SharedComparisonConfig, value: ComparisonUpdateValue) => {
      const nextSharedConfig = applySharedComparisonConfigUpdate(sharedConfig, key, value);
      updateSharedConfig(key, value);
      sync({ ...currentState, sharedConfig: nextSharedConfig });
    },
    [currentState, sharedConfig, sync, updateSharedConfig],
  );
  const onScenarioChange = useCallback(
    (scenario: ScenarioKey, key: keyof ScenarioOverride, value: ComparisonUpdateValue) => {
      const currentScenario = scenario === 'A' ? scenarioA : scenarioB;
      const nextScenario = applyScenarioOverrideUpdate(currentScenario, key, value);
      updateScenario(scenario, key, value);
      sync({
        ...currentState,
        ...(scenario === 'A' ? { scenarioA: nextScenario } : { scenarioB: nextScenario }),
      });
    },
    [currentState, scenarioA, scenarioB, sync, updateScenario],
  );
  const onBondTypeChange = useCallback(
    (scenario: ScenarioKey, bondType: ScenarioOverride['bondType']) => {
      const currentScenario = scenario === 'A' ? scenarioA : scenarioB;
      const nextScenario = applyScenarioBondTypeUpdate(currentScenario, bondType);
      updateBondType(scenario, bondType);
      sync({
        ...currentState,
        ...(scenario === 'A' ? { scenarioA: nextScenario } : { scenarioB: nextScenario }),
      });
    },
    [currentState, scenarioA, scenarioB, sync, updateBondType],
  );
  const onCustomHorizonChange = useCallback(
    (scenario: ScenarioKey, value: number | undefined, enabled?: boolean) => {
      const currentScenario = scenario === 'A' ? scenarioA : scenarioB;
      const nextScenario =
        enabled === undefined
          ? applyScenarioCustomHorizonMonths(sharedConfig, currentScenario, value)
          : applyScenarioCustomHorizonEnabled(sharedConfig, currentScenario, enabled);
      updateCustomHorizon(scenario, value, enabled);
      sync({
        ...currentState,
        ...(scenario === 'A' ? { scenarioA: nextScenario } : { scenarioB: nextScenario }),
      });
    },
    [currentState, scenarioA, scenarioB, sharedConfig, sync, updateCustomHorizon],
  );

  return {
    onBondTypeChange,
    onCustomHorizonChange,
    onScenarioChange,
    onSharedConfigChange,
  };
}
