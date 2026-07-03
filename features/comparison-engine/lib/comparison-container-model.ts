import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { BondInputs, BondType, CalculationResult, ChartStep } from '@/features/bond-core/types';
import { getBondColor } from '@/shared/lib/charts/get-bond-color';

import {
  buildComparisonChartData,
  getComparisonAssumptionsBondType,
  usesMixedTimelineCadence,
} from './comparison-display';

type Translator = (key: string, params?: Record<string, string | number>) => string;

export interface ComparisonContainerViewModelInput {
  inputsA: BondInputs;
  inputsB: BondInputs;
  committedInputsA: BondInputs | null;
  committedInputsB: BondInputs | null;
  resultsA: CalculationResult | null;
  resultsB: CalculationResult | null;
  scenarioABondType: BondType;
  scenarioBBondType: BondType;
  definitions: Record<BondType, BondDefinition>;
  language: 'pl' | 'en';
  t: Translator;
  chartStep: ChartStep;
}

export function buildComparisonContainerViewModel({
  inputsA,
  inputsB,
  committedInputsA,
  committedInputsB,
  resultsA,
  resultsB,
  scenarioABondType,
  scenarioBBondType,
  definitions,
  language,
  t,
  chartStep,
}: ComparisonContainerViewModelInput) {
  const resultInputsA = committedInputsA ?? inputsA;
  const resultInputsB = committedInputsB ?? inputsB;
  const chartData =
    resultsA && resultsB
      ? buildComparisonChartData({
          purchaseDate: resultInputsA.purchaseDate,
          withdrawalDateA: resultInputsA.withdrawalDate,
          withdrawalDateB: resultInputsB.withdrawalDate,
          resultsA,
          resultsB,
          language,
          t,
          chartStep,
        })
      : [];
  const durationMismatch =
    definitions[scenarioABondType].duration !== definitions[scenarioBBondType].duration;

  return {
    resultInputsA,
    resultInputsB,
    chartData,
    hasMixedTimelineCadence: usesMixedTimelineCadence(resultInputsA, resultInputsB),
    assumptionsBondType: getComparisonAssumptionsBondType(scenarioABondType, scenarioBBondType),
    durationMismatch,
    scenarioAColor: getBondColor(scenarioABondType),
    scenarioBColor: getBondColor(scenarioBBondType),
  };
}
