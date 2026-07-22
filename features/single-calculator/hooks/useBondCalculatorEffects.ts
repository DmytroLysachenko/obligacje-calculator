'use client';

import { useEffect, useEffectEvent } from 'react';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondInputs, BondType } from '@/features/bond-core/types';
import { SingleBondCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { BondSeriesMetadata } from '@/shared/lib/bond-series-client';
import {
  loadPersistedCalculatorState,
  savePersistedCalculatorState,
} from '@/shared/lib/calculator-persistence';
import { logClientError } from '@/shared/lib/client-logger';
import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';

import { fetchBondSeriesForSymbol } from '../lib/single-calculator-actions';
import { buildSingleCalculatorPersistenceSnapshot } from '../lib/single-calculator-client-state';
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
import { resolveBondTypeInputUpdate } from '../lib/single-calculator-state';

interface UseBondCalculatorEffectsInput {
  inputs: BondInputs;
  envelope: SingleBondCalculationEnvelope | null;
  selectedSeriesId: string | null;
  lastCommittedInputs: BondInputs | null;
  isDirty: boolean;
  isCalculating: boolean;
  isPersistenceReady: boolean;
  initialInputs: BondInputs | undefined;
  bondFromUrl?: BondType | null;
  fallbackInputs: BondInputs;
  definitions: typeof BOND_DEFINITIONS | null | undefined;
  macroDefaults: MacroDefaults | null | undefined;
  calculate: (currentInputs: BondInputs) => Promise<void>;
  hasRestoredStateRef: React.MutableRefObject<boolean>;
  hasAutoCalculatedSharedScenarioRef: React.MutableRefObject<boolean>;
  restoredFromPersistenceRef: React.MutableRefObject<boolean>;
  hasTouchedMacroAssumptionsRef: React.MutableRefObject<boolean>;
  setInputs: React.Dispatch<React.SetStateAction<BondInputs>>;
  setEnvelope: React.Dispatch<React.SetStateAction<SingleBondCalculationEnvelope | null>>;
  setSelectedSeriesId: React.Dispatch<React.SetStateAction<string | null>>;
  setLastCommittedInputs: React.Dispatch<React.SetStateAction<BondInputs | null>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPersistenceReady: React.Dispatch<React.SetStateAction<boolean>>;
  setAvailableSeries: React.Dispatch<React.SetStateAction<BondSeriesMetadata[]>>;
}

export function useBondCalculatorEffects({
  inputs,
  envelope,
  selectedSeriesId,
  lastCommittedInputs,
  isDirty,
  isCalculating,
  isPersistenceReady,
  initialInputs,
  bondFromUrl,
  fallbackInputs,
  definitions,
  macroDefaults,
  calculate,
  hasRestoredStateRef,
  hasAutoCalculatedSharedScenarioRef,
  restoredFromPersistenceRef,
  hasTouchedMacroAssumptionsRef,
  setInputs,
  setEnvelope,
  setSelectedSeriesId,
  setLastCommittedInputs,
  setIsDirty,
  setIsPersistenceReady,
  setAvailableSeries,
}: UseBondCalculatorEffectsInput) {
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
  }, [definitions, inputs.bondType, selectedSeriesId, setInputs]);

  useEffect(() => {
    if (initialInputs || hasRestoredStateRef.current || !definitions) {
      return;
    }

    const timer = window.setTimeout(() => {
      hasRestoredStateRef.current = true;

      if (bondFromUrl) {
        const selectedInputs = resolveBondTypeInputUpdate(
          fallbackInputs,
          bondFromUrl,
          definitions[bondFromUrl],
        );
        const horizonMonths = Math.round(definitions[bondFromUrl].duration * 12);
        selectedInputs.investmentHorizonMonths = horizonMonths;
        selectedInputs.withdrawalDate = getWithdrawalDateFromMonths(
          selectedInputs.purchaseDate,
          horizonMonths,
        );
        setInputs(selectedInputs);
        setEnvelope(null);
        setSelectedSeriesId('current');
        setLastCommittedInputs(null);
        setIsDirty(true);
        setIsPersistenceReady(true);
        return;
      }

      const restoredState = loadPersistedCalculatorState<PersistedSingleCalculatorState>(
        SINGLE_CALCULATOR_STORAGE_KEY,
      );

      const restored = restoreSingleCalculatorState(restoredState, fallbackInputs);
      if (restored) {
        restoredFromPersistenceRef.current = restored.restoredFromPersistence;
        setInputs(restored.inputs);
        setEnvelope(restored.envelope);
        setSelectedSeriesId(restored.selectedSeriesId);
        setLastCommittedInputs(restored.lastCommittedInputs);
        setIsDirty(restored.isDirty);
      }

      setIsPersistenceReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    fallbackInputs,
    bondFromUrl,
    definitions,
    hasRestoredStateRef,
    initialInputs,
    restoredFromPersistenceRef,
    setEnvelope,
    setInputs,
    setIsDirty,
    setIsPersistenceReady,
    setLastCommittedInputs,
    setSelectedSeriesId,
  ]);

  useEffect(() => {
    if (
      !macroDefaults ||
      initialInputs ||
      !isPersistenceReady ||
      hasTouchedMacroAssumptionsRef.current
    ) {
      return;
    }

    if (restoredFromPersistenceRef.current) {
      const timer = window.setTimeout(() => {
        reconcilePersistedMacroDefaults(macroDefaults);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    applyMacroDefaults(macroDefaults);
  }, [
    hasTouchedMacroAssumptionsRef,
    initialInputs,
    isPersistenceReady,
    macroDefaults,
    restoredFromPersistenceRef,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSeries(inputs.bondType, setAvailableSeries);
    }, 0);
    return () => clearTimeout(timer);
  }, [inputs.bondType, setAvailableSeries]);

  useEffect(() => {
    if (!initialInputs || hasAutoCalculatedSharedScenarioRef.current || isCalculating) {
      return;
    }

    hasAutoCalculatedSharedScenarioRef.current = true;
    const timer = window.setTimeout(() => {
      void calculate(initialInputs);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [calculate, hasAutoCalculatedSharedScenarioRef, initialInputs, isCalculating]);

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
}

async function fetchSeries(
  symbol: BondType,
  setAvailableSeries: React.Dispatch<React.SetStateAction<BondSeriesMetadata[]>>,
) {
  try {
    await Promise.resolve();
    setAvailableSeries(await fetchBondSeriesForSymbol(symbol));
  } catch (error) {
    logClientError('Failed to fetch series:', error);
  }
}
