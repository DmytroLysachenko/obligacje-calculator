'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import {
  loadPersistedCalculatorState,
  savePersistedCalculatorState,
} from '@/shared/lib/calculator-persistence';
import { preserveStableState } from '@/shared/lib/calculator-state';
import { applyMacroDefaultsToBaseline } from '@/shared/lib/macro-assumption-defaults';

import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
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

interface PersistedLadderState {
  inputs: RegularInvestmentInputs;
  envelope: RegularInvestmentCalculationEnvelope | null;
  isDirty: boolean;
}

export function useLadder() {
  const { definitions } = useBondDefinitions();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const [inputs, setInputs] = useState<RegularInvestmentInputs>(buildDefaultLadderInputs);
  const [envelope, setEnvelope] = useState<RegularInvestmentCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);
  const { isCalculating, post } = useCalculationRequest();
  const hasRestoredState = useRef(false);
  const restoredFromPersistence = useRef(false);
  const hasTouchedMacroAssumptions = useRef(false);

  const results = envelope?.result || null;
  const applyDefinitionUpdate = useEffectEvent(
    (definition: (typeof BOND_DEFINITIONS)[BondType]) => {
      setInputs((previous) => applyLadderBondDefinition(previous, definition));
    },
  );

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
    applyDefinitionUpdate(definition);
  }, [definitions, inputs.bondType]);

  useEffect(() => {
    if (hasRestoredState.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const restoredState = loadPersistedCalculatorState<PersistedLadderState>(STORAGE_KEY);
      hasRestoredState.current = true;

      if (restoredState) {
        restoredFromPersistence.current = true;
        setInputs(restoredState.inputs);
        setEnvelope(restoredState.envelope ?? null);
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

  const calculate = useCallback(async () => {
    try {
      const data = await post<RegularInvestmentCalculationEnvelope>(
        getCalculationEndpoint(ScenarioKind.REGULAR_INVESTMENT),
        inputs,
        { preferWorker: true },
      );
      setEnvelope(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Ladder calculation error:', error);
    }
  }, [inputs, post]);

  const updateInput = useCallback(
    (key: keyof RegularInvestmentInputs, value: string | number | boolean | undefined) => {
      setIsDirty(true);
      if (isLadderMacroInputKey(key)) {
        hasTouchedMacroAssumptions.current = true;
      }
      setInputs((previous) =>
        normalizeLadderInputs(previous, { [key]: value } as Partial<RegularInvestmentInputs>),
      );
    },
    [],
  );

  const setBondType = useCallback(
    (type: BondType) => {
      setIsDirty(true);
      setInputs((previous) => resolveLadderBondTypeUpdate(previous, type, definitions));
    },
    [definitions],
  );

  useEffect(() => {
    if (!isPersistenceReady) {
      return;
    }

    savePersistedCalculatorState(STORAGE_KEY, {
      inputs,
      envelope,
      isDirty,
    });
  }, [envelope, inputs, isDirty, isPersistenceReady]);

  return {
    inputs,
    results,
    envelope,
    warnings: envelope?.warnings || [],
    assumptions: envelope?.assumptions || [],
    dataFreshness: envelope?.dataFreshness,
    isDirty,
    isCalculating,
    calculate,
    updateInput,
    setBondType,
    definitions: definitions ?? BOND_DEFINITIONS,
    isPersistenceReady,
  };
}
