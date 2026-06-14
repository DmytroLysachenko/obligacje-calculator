'use client';

import React from 'react';
import { LineChart } from 'lucide-react';
import { BondInputs, CalculationResult, ChartStep, InterestPayout } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import {
  BondValueChart,
  BondValueChartPoint,
  BondValueChartTooltipGroup,
} from '@/shared/components/charts/BondValueChart';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { MetricStrip, MetricStripItem } from '@/shared/components/results/MetricStrip';
import { buildComparisonExportHeaders } from '@/shared/lib/export-headers';
import {
  buildCombinedComparisonCsvFilename,
  exportComparisonCsv,
} from '@/shared/lib/retained-exports';
import { ComparisonChartPoint } from '../lib/comparison-display';
import { ResultActionGrid } from '@/shared/components/results/ResultActionGrid';
import { computeNumericDomain, computeRateDomain } from '@/shared/lib/chart-series';

interface ComparisonResultsPanelProps {
  chartData: ComparisonChartPoint[];
  usesMixedTimelineCadence: boolean;
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  inputsA: BondInputs;
  inputsB: BondInputs;
  formatCurrency: (value: number) => string;
  language: 'pl' | 'en';
  chartStep: ChartStep;
  onChartStepChange: (step: ChartStep) => void;
  scenarioAColor: string;
  scenarioBColor: string;
}

export function ComparisonResultsPanel({
  chartData,
  usesMixedTimelineCadence,
  resultsA,
  resultsB,
  inputsA,
  inputsB,
  formatCurrency,
  language,
  chartStep,
  onChartStepChange,
  scenarioAColor,
  scenarioBColor,
}: ComparisonResultsPanelProps) {
  const { t } = useAppI18n();
  const valueA = resultsA.netPayoutValue;
  const valueB = resultsB.netPayoutValue;
  const winner = valueA === valueB ? null : valueA > valueB ? 'A' : 'B';
  const winnerInput = winner === 'A' ? inputsA : winner === 'B' ? inputsB : null;
  const absoluteGap = Math.abs(valueA - valueB);
  const lowerValue = Math.min(valueA, valueB);
  const relativeGap = lowerValue > 0 ? (absoluteGap / lowerValue) * 100 : 0;
  const comparisonMetrics = React.useMemo<MetricStripItem[]>(() => [
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
  ], [formatCurrency, resultsA.finalRealValue, resultsB.finalRealValue, t, valueA, valueB]);
  const differenceMetrics = React.useMemo<MetricStripItem[]>(() => [
    {
      label: t('comparison.summary_leading_bond'),
      value: winnerInput ? `${winnerInput.bondType} (${winner})` : t('comparison.tie'),
      description: winnerInput
        ? `${winner === 'A' ? t('comparison.scenario_a') : t('comparison.scenario_b')} ${t('comparison.summary_higher_payout')}`
        : t('comparison.summary_equal_outcome'),
      tone: winner === 'B' ? 'text-success' : 'text-primary',
    },
    {
      label: t('comparison.summary_absolute_gap'),
      value: formatCurrency(absoluteGap),
      description: t('comparison.summary_net_payout'),
      tone: 'text-foreground',
    },
    {
      label: t('comparison.summary_relative_gap'),
      value: `${relativeGap.toFixed(1)}%`,
      description: t('comparison.summary_compared_to_lower'),
      tone: 'text-foreground',
    },
  ], [absoluteGap, formatCurrency, relativeGap, t, winner, winnerInput]);
  const exportActions = React.useMemo(() => [
    {
      label: t('comparison.export_comparison_csv'),
      kind: 'csv' as const,
      onClick: () =>
        exportComparisonCsv({
          timelineA: resultsA.timeline,
          timelineB: resultsB.timeline,
          headers: buildComparisonExportHeaders(t),
          language,
          fileName: buildCombinedComparisonCsvFilename(inputsA.bondType, inputsB.bondType),
        }),
    },
  ], [inputsA.bondType, inputsB.bondType, language, resultsA.timeline, resultsB.timeline, t]);
  const valueChartData = React.useMemo<BondValueChartPoint[]>(
    () =>
      chartData.map((point) => {
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
      }),
    [
      chartData,
      inputsA.bondType,
      inputsB.bondType,
      resultsA.initialInvestment,
      resultsB.initialInvestment,
      scenarioAColor,
      scenarioBColor,
      t,
    ],
  );
  const leftDomain = React.useMemo(
    () =>
      computeNumericDomain(
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
    [valueChartData],
  );
  const rightDomain = React.useMemo(
    () =>
      computeRateDomain(
        valueChartData
          .flatMap((point) => [point.inflation, point.nbp])
          .filter((value): value is number => typeof value === 'number'),
      ),
    [valueChartData],
  );
  const chartSummary = React.useMemo(() => {
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
  }, [formatCurrency, t, valueChartData]);
  const chartSeries = React.useMemo(
    () => [
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
    ],
    [inputsA.bondType, inputsB.bondType, scenarioAColor, scenarioBColor, t],
  );

  return (
    <section className="space-y-6 border-t border-border py-6">
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 ui-section-title">
          <LineChart className="h-5 w-5 text-primary" />
          {t('comparison.performance_over_time')}
        </h2>
        <p className="ui-body text-muted-foreground">
          {t('comparison.chart_header_desc')}
        </p>
      </div>
      <div>
        <div className="mb-5 space-y-3">
          <MetricStrip items={differenceMetrics} columns="grid-cols-1 md:grid-cols-3" className="shadow-none" />
          <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_280px]">
            <MetricStrip items={comparisonMetrics} columns="grid-cols-1 md:grid-cols-2" className="shadow-none" />
            <ResultActionGrid
              actions={exportActions}
              className="border-y border-border bg-transparent px-0 py-3 lg:w-auto lg:border-x-0"
            />
          </div>
        </div>

        <ChartSupportNote
          title={t('comparison.chart_help_title')}
          description={t('comparison.chart_help_desc')}
        />

        <BondValueChart
          data={valueChartData}
          series={chartSeries}
          formatCurrency={formatCurrency}
          leftDomain={leftDomain}
          rightDomain={rightDomain}
          summary={chartSummary}
          defaultGranularity={chartStep}
          onGranularityChange={onChartStepChange}
          ariaLabel={t('comparison.performance_over_time')}
          heightClassName="h-[360px] md:h-[440px] xl:h-[500px]"
        />

        <div className="mt-6">
          <SecondaryInsightAccordion
            title={t('comparison.comparison_chart_help_title')}
            description={t('comparison.comparison_chart_help_desc')}
            badge={usesMixedTimelineCadence ? t('comparison.mixed_cadence') : undefined}
            className="mt-0"
          >
            <div className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div className="border-t border-border py-4">
                <p>{t('comparison.comparison_chart_help_note')}</p>
              </div>
              {usesMixedTimelineCadence ? (
                <div className="ui-inline-notice border-l-2 border-warning text-warning">
                  <p className="font-semibold">
                    {t('comparison.mixed_cadence_notice', {
                      bondTypeA: inputsA.bondType,
                      cadenceA:
                        inputsA.payoutFrequency === InterestPayout.MONTHLY
                          ? t('comparison.cadence_monthly')
                          : t('comparison.cadence_longer'),
                      bondTypeB: inputsB.bondType,
                      cadenceB:
                        inputsB.payoutFrequency === InterestPayout.MONTHLY
                          ? t('comparison.cadence_monthly')
                          : t('comparison.cadence_longer'),
                    })}
                  </p>
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border-t border-border py-4">
                  <p className="ui-card-title">
                    {t('comparison.end_level')}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {t('comparison.end_level_desc')}
                  </p>
                </div>
                <div className="border-t border-border py-4">
                  <p className="ui-card-title">
                    {t('comparison.update_rhythm')}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {t('comparison.update_rhythm_desc')}
                  </p>
                </div>
              </div>
            </div>
          </SecondaryInsightAccordion>
        </div>
      </div>
    </section>
  );
}
