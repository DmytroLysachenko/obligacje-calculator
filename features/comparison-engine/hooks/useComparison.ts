'use client';

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { BondInputs, BondType, TaxStrategy } from '../../bond-core/types';
import {
  BondComparisonCalculationEnvelope,
  IndependentBondComparisonPayload,
  SingleBondCalculationEnvelope,
} from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { getHorizonMonths, getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';
import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { loadPersistedCalculatorState, savePersistedCalculatorState } from '@/shared/lib/calculator-persistence';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';

type SharedComparisonConfig = IndependentBondComparisonPayload['sharedConfig'];
type ScenarioOverride = IndependentBondComparisonPayload['scenarioA'];

const DEFAULT_HORIZON_MONTHS = 120;
const STORAGE_KEY = 'obligacje.comparison-calculator.v1';

function buildDefaultSharedConfig(): SharedComparisonConfig {
  const today = toDateString(new Date());

  return {
    initialInvestment: 10000,
    purchaseDate: today,
    withdrawalDate: getWithdrawalDateFromMonths(today, DEFAULT_HORIZON_MONTHS),
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    inflationScenario: 'base',
    taxStrategy: TaxStrategy.STANDARD,
    timingMode: 'general',
    investmentHorizonMonths: DEFAULT_HORIZON_MONTHS,
  };
}

const DEFAULT_SCENARIO_A: ScenarioOverride = {
  bondType: BondType.EDO,
  isRebought: false,
};

const DEFAULT_SCENARIO_B: ScenarioOverride = {
  bondType: BondType.EDO,
  isRebought: false,
};

interface PersistedComparisonState {
  sharedConfig: SharedComparisonConfig;
  scenarioA: ScenarioOverride;
  scenarioB: ScenarioOverride;
  comparisonEnvelope: BondComparisonCalculationEnvelope | null;
  isDirty: boolean;
}

function buildScenarioInputs(
  sharedConfig: SharedComparisonConfig,
  scenario: ScenarioOverride,
  definitions: Record<BondType, typeof BOND_DEFINITIONS[BondType]> | null,
): BondInputs {
  const definition = definitions?.[scenario.bondType] ?? BOND_DEFINITIONS[scenario.bondType];
  const purchaseDate = scenario.purchaseDate ?? sharedConfig.purchaseDate;
  const timingMode = scenario.timingMode ?? sharedConfig.timingMode ?? 'general';
  const horizonMonths = scenario.investmentHorizonMonths ?? sharedConfig.investmentHorizonMonths ?? DEFAULT_HORIZON_MONTHS;
  const withdrawalDate =
    scenario.withdrawalDate
    ?? (timingMode === 'general'
      ? getWithdrawalDateFromMonths(purchaseDate, horizonMonths)
      : sharedConfig.withdrawalDate);

  return {
    bondType: scenario.bondType,
    initialInvestment: sharedConfig.initialInvestment,
    firstYearRate: definition.firstYearRate,
    expectedInflation: sharedConfig.expectedInflation,
    expectedNbpRate: sharedConfig.expectedNbpRate ?? 5.25,
    customInflation: sharedConfig.customInflation,
    customNbpRate: sharedConfig.customNbpRate,
    inflationScenario: sharedConfig.inflationScenario,
    margin: definition.margin,
    duration: definition.duration,
    earlyWithdrawalFee: definition.earlyWithdrawalFee,
    taxRate: 19,
    isCapitalized: definition.isCapitalized,
    payoutFrequency: definition.payoutFrequency,
    purchaseDate,
    withdrawalDate,
    isRebought: scenario.isRebought ?? false,
    rebuyDiscount: definition.rebuyDiscount,
    taxStrategy: scenario.taxStrategy ?? sharedConfig.taxStrategy ?? TaxStrategy.STANDARD,
    rollover: scenario.rollover ?? false,
    timingMode,
    investmentHorizonMonths: horizonMonths,
  };
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

      return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
  });

  const inputsA = useMemo(() => buildScenarioInputs(sharedConfig, scenarioA, definitions), [definitions, sharedConfig, scenarioA]);
  const inputsB = useMemo(() => buildScenarioInputs(sharedConfig, scenarioB, definitions), [definitions, sharedConfig, scenarioB]);

  const scenarioAResult = comparisonEnvelope?.result.find((item) => item.scenarioKey === 'scenarioA');
  const scenarioBResult = comparisonEnvelope?.result.find((item) => item.scenarioKey === 'scenarioB');
  const resultsA = scenarioAResult?.result || null;
  const resultsB = scenarioBResult?.result || null;
  const sharedWarnings = comparisonEnvelope?.warnings || [];
  const sharedAssumptions = comparisonEnvelope?.assumptions || [];
  const sharedNotes = comparisonEnvelope?.calculationNotes || [];
  const sharedFlags = comparisonEnvelope?.dataQualityFlags || [];

  const envelopeA: SingleBondCalculationEnvelope | null = resultsA
    ? {
        result: resultsA,
        warnings: sharedWarnings,
        assumptions: sharedAssumptions,
        calculationNotes: sharedNotes,
        dataQualityFlags: sharedFlags,
        dataFreshness: comparisonEnvelope?.dataFreshness ?? { status: 'unknown', usedFallback: false },
        calculationVersion: comparisonEnvelope?.calculationVersion ?? 'unknown',
      }
    : null;

  const envelopeB: SingleBondCalculationEnvelope | null = resultsB
    ? {
        result: resultsB,
        warnings: sharedWarnings,
        assumptions: sharedAssumptions,
        calculationNotes: sharedNotes,
        dataQualityFlags: sharedFlags,
        dataFreshness: comparisonEnvelope?.dataFreshness ?? { status: 'unknown', usedFallback: false },
        calculationVersion: comparisonEnvelope?.calculationVersion ?? 'unknown',
      }
    : null;

  const calculate = useCallback(async () => {
    setIsDirty(false);
    try {
      const envelope = await post<BondComparisonCalculationEnvelope>(
        '/api/calculate/compare',
        {
          mode: 'independent',
          sharedConfig,
          scenarioA,
          scenarioB,
        },
        { preferWorker: true },
      );
      setComparisonEnvelope(envelope);
    } catch (error) {
      console.error('Comparison error:', error);
    }
  }, [post, scenarioA, scenarioB, sharedConfig]);

  const updateSharedConfig = (key: keyof SharedComparisonConfig, value: string | number | boolean | undefined) => {
    setIsDirty(true);
    if (key === 'expectedInflation' || key === 'expectedNbpRate' || key === 'customInflation' || key === 'customNbpRate' || key === 'inflationScenario') {
      hasTouchedMacroAssumptions.current = true;
    }
    setSharedConfig((prev) => {
      const next = { ...prev, [key]: value };

      if (key === 'purchaseDate') {
        const months = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        next.withdrawalDate = getWithdrawalDateFromMonths(String(value), months);
      }

      if (key === 'investmentHorizonMonths') {
        next.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, Number(value));
        if (prev.customInflation) {
          const years = Math.max(1, Math.ceil(Number(value) / 12));
          next.customInflation = Array.from(
            { length: years },
            (_, index) => prev.customInflation?.[index] ?? prev.expectedInflation,
          );
        }
        if (prev.customNbpRate) {
          const years = Math.max(1, Math.ceil(Number(value) / 12));
          next.customNbpRate = Array.from(
            { length: years },
            (_, index) => prev.customNbpRate?.[index] ?? (prev.expectedNbpRate ?? 5.25),
          );
        }
      }

      if (key === 'withdrawalDate') {
        next.investmentHorizonMonths = getHorizonMonths(prev.purchaseDate, String(value));
        next.timingMode = 'exact';
        if (prev.customInflation) {
          const years = Math.max(1, Math.ceil(next.investmentHorizonMonths / 12));
          next.customInflation = Array.from(
            { length: years },
            (_, index) => prev.customInflation?.[index] ?? prev.expectedInflation,
          );
        }
        if (prev.customNbpRate) {
          const years = Math.max(1, Math.ceil(next.investmentHorizonMonths / 12));
          next.customNbpRate = Array.from(
            { length: years },
            (_, index) => prev.customNbpRate?.[index] ?? (prev.expectedNbpRate ?? 5.25),
          );
        }
      }

      if (key === 'timingMode' && value === 'general') {
        const months = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        next.investmentHorizonMonths = months;
        next.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, months);
      }

      return next;
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
        setScenarioA(restoredState.scenarioA);
        setScenarioB(restoredState.scenarioB);
        setComparisonEnvelope(restoredState.comparisonEnvelope ?? null);
        setIsDirty(restoredState.isDirty ?? true);
      }

      setIsPersistenceReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!macroDefaults || !isPersistenceReady || restoredFromPersistence.current || hasTouchedMacroAssumptions.current) {
      return;
    }

    applyMacroDefaults(macroDefaults);
  }, [isPersistenceReady, macroDefaults]);

  useEffect(() => {
    if (!isPersistenceReady) {
      return;
    }

    savePersistedCalculatorState(STORAGE_KEY, {
      sharedConfig,
      scenarioA,
      scenarioB,
      comparisonEnvelope,
      isDirty,
    });
  }, [comparisonEnvelope, isDirty, isPersistenceReady, scenarioA, scenarioB, sharedConfig]);

  return {
    sharedConfig,
    scenarioA,
    scenarioB,
    inputsA,
    inputsB,
    resultsA,
    resultsB,
    envelopeA,
    envelopeB,
    warningsA: envelopeA?.warnings || [],
    warningsB: envelopeB?.warnings || [],
    isCalculating,
    isDirty,
    calculate,
    updateSharedConfig,
    updateScenarioA,
    updateScenarioB,
    setBondTypeA,
    setBondTypeB,
    definitions: definitions ?? BOND_DEFINITIONS,
    isPersistenceReady,
  };
}
