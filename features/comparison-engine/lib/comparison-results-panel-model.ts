import { BondInputs, CalculationResult } from '@/features/bond-core/types';
import { MetricStripItem } from '@/shared/components/results/MetricStrip';

type Translate = (key: string, values?: Record<string, string | number>) => string;
type FormatCurrency = (value: number) => string;

export {
  buildComparisonChartDomains,
  buildComparisonChartSeries,
  buildComparisonChartSummary,
  buildComparisonValueChartData,
} from './comparison-results-chart-model';

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
