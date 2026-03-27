'use client';

import { useCallback, useMemo, useState } from 'react';
import { BondInputs, BondType, TaxStrategy } from '../../bond-core/types';
import {
  BondComparisonCalculationEnvelope,
  IndependentBondComparisonPayload,
  SingleBondCalculationEnvelope,
} from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { useQuerySync } from '@/shared/hooks/useQuerySync';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { getHorizonMonths, getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';

type SharedComparisonConfig = IndependentBondComparisonPayload['sharedConfig'];
type ScenarioOverride = IndependentBondComparisonPayload['scenarioA'];

const DEFAULT_HORIZON_MONTHS = 120;
const today = toDateString(new Date());

const DEFAULT_SHARED_CONFIG: SharedComparisonConfig = {
  initialInvestment: 10000,
  purchaseDate: today,
  withdrawalDate: getWithdrawalDateFromMonths(today, DEFAULT_HORIZON_MONTHS),
  expectedInflation: 3.5,
  expectedNbpRate: 5.25,
  taxStrategy: TaxStrategy.STANDARD,
  timingMode: 'general',
  investmentHorizonMonths: DEFAULT_HORIZON_MONTHS,
};

const DEFAULT_SCENARIO_A: ScenarioOverride = {
  bondType: BondType.COI,
  rollover: false,
  isRebought: false,
};

const DEFAULT_SCENARIO_B: ScenarioOverride = {
  bondType: BondType.EDO,
  rollover: false,
  isRebought: false,
};

function buildScenarioInputs(sharedConfig: SharedComparisonConfig, scenario: ScenarioOverride): BondInputs {
  const definition = BOND_DEFINITIONS[scenario.bondType];
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
  const [sharedConfig, setSharedConfig] = useState<SharedComparisonConfig>(DEFAULT_SHARED_CONFIG);
  const [scenarioA, setScenarioA] = useState<ScenarioOverride>(DEFAULT_SCENARIO_A);
  const [scenarioB, setScenarioB] = useState<ScenarioOverride>(DEFAULT_SCENARIO_B);
  const [comparisonEnvelope, setComparisonEnvelope] = useState<BondComparisonCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const { isCalculating, post } = useCalculationRequest();

  const inputsA = useMemo(() => buildScenarioInputs(sharedConfig, scenarioA), [sharedConfig, scenarioA]);
  const inputsB = useMemo(() => buildScenarioInputs(sharedConfig, scenarioB), [sharedConfig, scenarioB]);

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

  useQuerySync(
    {
      common_initialInvestment: sharedConfig.initialInvestment,
      common_purchaseDate: sharedConfig.purchaseDate,
      common_withdrawalDate: sharedConfig.withdrawalDate,
      common_expectedInflation: sharedConfig.expectedInflation,
      common_expectedNbpRate: sharedConfig.expectedNbpRate,
      common_taxStrategy: sharedConfig.taxStrategy,
      common_timingMode: sharedConfig.timingMode,
      common_investmentHorizonMonths: sharedConfig.investmentHorizonMonths,
      scenarioA_bondType: scenarioA.bondType,
      scenarioA_rollover: scenarioA.rollover,
      scenarioA_isRebought: scenarioA.isRebought,
      scenarioA_taxStrategy: scenarioA.taxStrategy,
      scenarioA_investmentHorizonMonths: scenarioA.investmentHorizonMonths,
      scenarioB_bondType: scenarioB.bondType,
      scenarioB_rollover: scenarioB.rollover,
      scenarioB_isRebought: scenarioB.isRebought,
      scenarioB_taxStrategy: scenarioB.taxStrategy,
      scenarioB_investmentHorizonMonths: scenarioB.investmentHorizonMonths,
    },
    (initial) => {
      const nextShared = { ...DEFAULT_SHARED_CONFIG } as SharedComparisonConfig;
      const nextScenarioA = { ...DEFAULT_SCENARIO_A } as ScenarioOverride;
      const nextScenarioB = { ...DEFAULT_SCENARIO_B } as ScenarioOverride;

      Object.entries(initial).forEach(([key, value]) => {
        if (key.startsWith('common_')) {
          (nextShared as Record<string, unknown>)[key.replace('common_', '')] = value;
        } else if (key.startsWith('scenarioA_')) {
          (nextScenarioA as Record<string, unknown>)[key.replace('scenarioA_', '')] = value;
        } else if (key.startsWith('scenarioB_')) {
          (nextScenarioB as Record<string, unknown>)[key.replace('scenarioB_', '')] = value;
        }
      });

      setSharedConfig(nextShared);
      setScenarioA(nextScenarioA);
      setScenarioB(nextScenarioB);
    },
  );

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
    setSharedConfig((prev) => {
      const next = { ...prev, [key]: value };

      if (key === 'purchaseDate') {
        const months = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        next.withdrawalDate = getWithdrawalDateFromMonths(String(value), months);
      }

      if (key === 'investmentHorizonMonths') {
        next.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, Number(value));
      }

      if (key === 'withdrawalDate') {
        next.investmentHorizonMonths = getHorizonMonths(prev.purchaseDate, String(value));
        next.timingMode = 'exact';
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
      investmentHorizonMonths: Math.max(prev.investmentHorizonMonths ?? 0, Math.round(BOND_DEFINITIONS[type].duration * 12)),
    }));
  };

  const setBondTypeB = (type: BondType) => {
    setIsDirty(true);
    setScenarioB((prev) => ({
      ...prev,
      bondType: type,
      isRebought: false,
      investmentHorizonMonths: Math.max(prev.investmentHorizonMonths ?? 0, Math.round(BOND_DEFINITIONS[type].duration * 12)),
    }));
  };

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
    definitions: BOND_DEFINITIONS,
  };
}
