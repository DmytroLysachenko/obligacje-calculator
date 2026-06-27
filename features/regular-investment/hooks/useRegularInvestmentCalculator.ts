import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import {
  loadPersistedCalculatorState,
  savePersistedCalculatorState,
} from '@/shared/lib/calculator-persistence';
import { preserveStableState, stripDisplayOnlyInputs } from '@/shared/lib/calculator-state';
import { logClientError } from '@/shared/lib/client-logger';
import { applyMacroDefaultsToBaseline } from '@/shared/lib/macro-assumption-defaults';

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

interface PersistedRegularCalculatorState {
  inputs: RegularInvestmentInputs;
  envelope: RegularInvestmentCalculationEnvelope | null;
  isDirty: boolean;
}

export function useRegularInvestmentCalculator() {
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const fallbackInputs = useMemo(() => buildRegularInvestmentFallbackInputs(), []);
  const [inputs, setInputs] = useState<RegularInvestmentInputs>(fallbackInputs);
  const [envelope, setEnvelope] = useState<RegularInvestmentCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);
  const { isCalculating, isError, clearError, post } = useCalculationRequest();
  const hasRestoredState = useRef(false);
  const restoredFromPersistence = useRef(false);
  const hasTouchedMacroAssumptions = useRef(false);

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
    const timer = window.setTimeout(() => {
      setInputs((previous) => {
        const next = applyRegularInvestmentDefinition(previous, definition);
        return preserveStableState(previous, next);
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [definitions, inputs.bondType]);

  useEffect(() => {
    if (hasRestoredState.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const restoredState =
        loadPersistedCalculatorState<PersistedRegularCalculatorState>(STORAGE_KEY);
      hasRestoredState.current = true;

      if (restoredState) {
        restoredFromPersistence.current = true;
        setInputs(stripDisplayOnlyInputs(restoredState.inputs) ?? fallbackInputs);
        setEnvelope(restoredState.envelope ?? null);
        setIsDirty(restoredState.isDirty ?? true);
      }

      setIsPersistenceReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fallbackInputs]);

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

  const results = envelope?.result || null;

  const calculate = useCallback(
    async (currentInputs = inputs) => {
      setIsDirty(false);
      try {
        clearError();
        const data = await post<RegularInvestmentCalculationEnvelope>(
          getCalculationEndpoint(ScenarioKind.REGULAR_INVESTMENT),
          currentInputs,
          { preferWorker: true },
        );
        setEnvelope(data);
      } catch (error) {
        logClientError('Calculation error:', error);
      }
    },
    [clearError, inputs, post],
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

  const updateInput = (
    key: keyof RegularInvestmentInputs,
    value: string | number | boolean | undefined,
  ) => {
    setIsDirty(true);
    if (isRegularInvestmentMacroInputKey(key)) {
      hasTouchedMacroAssumptions.current = true;
    }
    setInputs((prev) =>
      normalizeRegularInvestmentInputs(prev, {
        [key]: value,
      } as Partial<RegularInvestmentInputs>),
    );
  };

  const setBondType = (type: BondType) => {
    if (!definitions) return;
    setIsDirty(true);
    setInputs((prev) => resolveRegularInvestmentBondTypeUpdate(prev, type, definitions[type]));
  };

  return {
    inputs,
    results,
    envelope,
    warnings: envelope?.warnings || [],
    assumptions: envelope?.assumptions || [],
    dataFreshness: envelope?.dataFreshness,
    isCalculating,
    isError,
    isDirty,
    calculate,
    updateInput,
    setBondType,
    definitions,
    isLoadingDefs,
    isPersistenceReady,
  };
}
