import { BondInputs, CalculationResult } from '@/features/bond-core/types';
import {
  BondValueChartPoint,
  BondValueChartTooltipGroup,
} from '@/shared/components/charts/BondValueChart';
import { MetricStripItem } from '@/shared/components/results/MetricStrip';
import { applyChartContextRates } from '@/shared/lib/chart-context-rates';
import { computeNumericDomain, computeRateDomain } from '@/shared/lib/chart-series';

import { ComparisonChartPoint } from './comparison-display';

type Translate = (key: string, values?: Record<string, string | number>) => string;
type FormatCurrency = (value: number) => string;

interface ComparisonResultsSummaryInput {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  inputsA: BondInputs;
  inputsB: BondInputs;
}

export function getComparisonResultsSummary({
  resultsA,
  resultsB,
  inputsA,
  inputsB,
}: ComparisonResultsSummaryInput) {
  const valueA = resultsA.netPayoutValue;
  const valueB = resultsB.netPayoutValue;
  const winner = valueA === valueB ? null : valueA > valueB ? 'A' : 'B';
  const winnerInput = winner === 'A' ? inputsA : winner === 'B' ? inputsB : null;
  const absoluteGap = Math.abs(valueA - valueB);
  const lowerValue = Math.min(valueA, valueB);

  return {
    valueA,
    valueB,
    winner,
    winnerInput,
    absoluteGap,
    relativeGap: lowerValue > 0 ? (absoluteGap / lowerValue) * 100 : 0,
  };
}

interface ComparisonMetricInput {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  valueA: number;
  valueB: number;
  formatCurrency: FormatCurrency;
  t: Translate;
}

export function buildComparisonMetricItems({
  resultsA,
  resultsB,
  valueA,
  valueB,
  formatCurrency,
  t,
}: ComparisonMetricInput): MetricStripItem[] {
  return [
    {
      label: t('comparison.scenario_a'),
      value: formatCurrency(valueA),
      tone: 'text-primary',
    },
    {
      label: t('comparison.scenario_b'),
      value: formatCurrency(valueB),
      tone: 'text-success',
    },
    {
      label: `${t('comparison.scenario_a')} ${t('common.real_value')}`,
      value: formatCurrency(resultsA.finalRealValue),
      tone: 'text-foreground',
    },
    {
      label: `${t('comparison.scenario_b')} ${t('common.real_value')}`,
      value: formatCurrency(resultsB.finalRealValue),
      tone: 'text-foreground',
    },
  ];
}

interface DifferenceMetricInput {
  summary: ReturnType<typeof getComparisonResultsSummary>;
  formatCurrency: FormatCurrency;
  t: Translate;
}

export function buildDifferenceMetricItems({
  summary,
  formatCurrency,
  t,
}: DifferenceMetricInput): MetricStripItem[] {
  return [
    {
      label: t('comparison.summary_leading_bond'),
      value: summary.winnerInput
        ? `${summary.winnerInput.bondType} (${summary.winner})`
        : t('comparison.tie'),
      description: summary.winnerInput
        ? `${summary.winner === 'A' ? t('comparison.scenario_a') : t('comparison.scenario_b')} ${t('comparison.summary_higher_payout')}`
        : t('comparison.summary_equal_outcome'),
      tone: summary.winner === 'B' ? 'text-success' : 'text-primary',
    },
    {
      label: t('comparison.summary_absolute_gap'),
      value: formatCurrency(summary.absoluteGap),
      description: t('comparison.summary_net_payout'),
      tone: 'text-foreground',
    },
    {
      label: t('comparison.summary_relative_gap'),
      value: `${summary.relativeGap.toFixed(1)}%`,
      description: t('comparison.summary_compared_to_lower'),
      tone: 'text-foreground',
    },
  ];
}

interface ComparisonValueChartInput {
  chartData: ComparisonChartPoint[];
  inputsA: BondInputs;
  inputsB: BondInputs;
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  scenarioAColor: string;
  scenarioBColor: string;
  t: Translate;
}

export function buildComparisonValueChartData({
  chartData,
  inputsA,
  inputsB,
  resultsA,
  resultsB,
  scenarioAColor,
  scenarioBColor,
  t,
}: ComparisonValueChartInput): BondValueChartPoint[] {
  const mappedPoints = chartData.map((point) => {
    const scenarioGroups: BondValueChartTooltipGroup[] = [
      {
        id: 'scenario-a',
        title: `${inputsA.bondType} (${t('comparison.scenario_a')})`,
        color: scenarioAColor,
        projected: point.isProjected,
        metrics: [
          {
            label: t('common.nominal_value'),
            value: point.nominalA,
            color: scenarioAColor,
          },
          {
            label: t('common.real_value'),
            value: point.realA,
            color: scenarioAColor,
          },
          {
            label: t('common.net_profit'),
            value: point.nominalA - resultsA.initialInvestment,
            color: scenarioAColor,
          },
        ],
      },
      {
        id: 'scenario-b',
        title: `${inputsB.bondType} (${t('comparison.scenario_b')})`,
        color: scenarioBColor,
        projected: point.isProjected,
        metrics: [
          {
            label: t('common.nominal_value'),
            value: point.nominalB,
            color: scenarioBColor,
          },
          {
            label: t('common.real_value'),
            value: point.realB,
            color: scenarioBColor,
          },
          {
            label: t('common.net_profit'),
            value: point.nominalB - resultsB.initialInvestment,
            color: scenarioBColor,
          },
        ],
      },
    ];

    return {
      label: point.label,
      date: point.label,
      dateKey: point.dateKey,
      nominalA: point.nominalA,
      realA: point.realA,
      nominalB: point.nominalB,
      realB: point.realB,
      inflation: point.inflation,
      nbp: point.nbp,
      isProjected: point.isProjected,
      scenarioGroups,
    };
  });

  return applyChartContextRates(mappedPoints, inputsA);
}

export function buildComparisonChartDomains(valueChartData: BondValueChartPoint[]) {
  return {
    leftDomain: computeNumericDomain(
      valueChartData
        .flatMap((point) => [
          Number(point.nominalA),
          Number(point.realA),
          Number(point.nominalB),
          Number(point.realB),
        ])
        .filter((value) => Number.isFinite(value)),
      {
        minFloor: null,
        minPadding: 250,
        paddingRatio: 0.08,
      },
    ),
    rightDomain: computeRateDomain(
      valueChartData
        .flatMap((point) => [point.inflation, point.nbp])
        .filter((value): value is number => typeof value === 'number'),
    ),
  };
}

export function buildComparisonChartSummary(
  valueChartData: BondValueChartPoint[],
  formatCurrency: FormatCurrency,
  t: Translate,
) {
  const firstPoint = valueChartData[0];
  const lastPoint = valueChartData[valueChartData.length - 1];

  if (!firstPoint || !lastPoint) {
    return t('bonds.chart_accessible_summary_empty');
  }

  return t('comparison.chart_accessible_summary', {
    count: valueChartData.length,
    startA: formatCurrency(Number(firstPoint.nominalA)),
    endA: formatCurrency(Number(lastPoint.nominalA)),
    startB: formatCurrency(Number(firstPoint.nominalB)),
    endB: formatCurrency(Number(lastPoint.nominalB)),
  });
}

export function buildComparisonChartSeries(
  inputsA: BondInputs,
  inputsB: BondInputs,
  scenarioAColor: string,
  scenarioBColor: string,
  t: Translate,
) {
  return [
    {
      key: 'nominalA',
      label: `${inputsA.bondType} (A)`,
      color: scenarioAColor,
    },
    {
      key: 'realA',
      label: `${inputsA.bondType} (A) ${t('common.real_value')}`,
      color: scenarioAColor,
      secondary: true,
    },
    {
      key: 'nominalB',
      label: `${inputsB.bondType} (B)`,
      color: scenarioBColor,
    },
    {
      key: 'realB',
      label: `${inputsB.bondType} (B) ${t('common.real_value')}`,
      color: scenarioBColor,
      secondary: true,
    },
  ];
}
