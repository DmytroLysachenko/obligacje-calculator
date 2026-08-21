'use client';

import { LineChart } from 'lucide-react';
import React from 'react';

import { ComparisonResultsPanelProps } from '@/features/comparison-engine/types/comparison-results-panel';
import { useAppI18n } from '@/i18n/client';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { LazyBondValueChart } from '@/shared/components/charts/LazyBondValueChart';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResultActionGrid } from '@/shared/components/results/ResultActionGrid';
import { buildComparisonExportHeaders } from '@/shared/lib/export-headers';
import {
  buildCombinedComparisonCsvFilename,
  exportComparisonCsv,
} from '@/shared/lib/retained-exports';

import {
  buildComparisonChartDomains,
  buildComparisonChartSeries,
  buildComparisonChartSummary,
  buildComparisonMetricItems,
  buildComparisonValueChartData,
  buildDifferenceMetricItems,
  getComparisonResultsSummary,
} from '../lib/comparison-results-panel-model';

import { ComparisonChartHelpSection } from './ComparisonResultsPanelParts';

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
  const summary = React.useMemo(
    () => getComparisonResultsSummary({ resultsA, resultsB, inputsA, inputsB }),
    [inputsA, inputsB, resultsA, resultsB],
  );
  const comparisonMetrics = React.useMemo(
    () =>
      buildComparisonMetricItems({
        resultsA,
        resultsB,
        valueA: summary.valueA,
        valueB: summary.valueB,
        formatCurrency,
        t,
      }),
    [formatCurrency, resultsA, resultsB, summary.valueA, summary.valueB, t],
  );
  const differenceMetrics = React.useMemo(
    () => buildDifferenceMetricItems({ summary, formatCurrency, t }),
    [formatCurrency, summary, t],
  );
  const exportActions = React.useMemo(
    () => [
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
    ],
    [inputsA.bondType, inputsB.bondType, language, resultsA.timeline, resultsB.timeline, t],
  );
  const valueChartData = React.useMemo(
    () =>
      buildComparisonValueChartData({
        chartData,
        inputsA,
        inputsB,
        resultsA,
        resultsB,
        scenarioAColor,
        scenarioBColor,
        t,
      }),
    [chartData, inputsA, inputsB, resultsA, resultsB, scenarioAColor, scenarioBColor, t],
  );
  const { leftDomain, rightDomain } = React.useMemo(
    () => buildComparisonChartDomains(valueChartData),
    [valueChartData],
  );
  const chartSummary = React.useMemo(
    () => buildComparisonChartSummary(valueChartData, formatCurrency, t),
    [formatCurrency, t, valueChartData],
  );
  const chartSeries = React.useMemo(
    () => buildComparisonChartSeries(inputsA, inputsB, scenarioAColor, scenarioBColor, t),
    [inputsA, inputsB, scenarioAColor, scenarioBColor, t],
  );

  return (
    <section className="ui-section-divider ui-control-stack">
      <div className="ui-section-intro">
        <h2 className="flex items-center gap-2 ui-section-title">
          <LineChart className="h-5 w-5 text-primary" aria-hidden="true" />
          {t('comparison.performance_over_time')}
        </h2>
        <p className="ui-body text-muted-foreground">{t('comparison.chart_header_desc')}</p>
      </div>
      <div className="ui-control-stack">
        <div className="divide-y divide-border border-y border-border">
          <MetricStrip
            items={differenceMetrics}
            columns="grid-cols-1 md:grid-cols-3"
            className="border-0 bg-transparent shadow-none"
          />
          <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(250px,0.3fr)]">
            <MetricStrip
              items={comparisonMetrics}
              columns="grid-cols-1 md:grid-cols-2"
              className="border-0 shadow-none"
            />
            <ResultActionGrid
              actions={exportActions}
              className="grid-cols-1 border-x-0 border-b-0 bg-transparent px-5 py-4 2xl:w-auto 2xl:border-l 2xl:border-t-0"
            />
          </div>
        </div>

        <ChartSupportNote
          title={t('comparison.chart_help_title')}
          description={t('comparison.chart_help_desc')}
        />

        <LazyBondValueChart
          data={valueChartData}
          series={chartSeries}
          formatCurrency={formatCurrency}
          leftDomain={leftDomain}
          rightDomain={rightDomain}
          summary={chartSummary}
          defaultGranularity={chartStep}
          onGranularityChange={onChartStepChange}
          preferenceScope="comparison"
          ariaLabel={t('comparison.performance_over_time')}
          heightClassName="h-[360px] md:h-[440px] xl:h-[500px]"
        />

        <div className="ui-result-panel">
          <ComparisonChartHelpSection
            inputsA={inputsA}
            inputsB={inputsB}
            usesMixedTimelineCadence={usesMixedTimelineCadence}
          />
        </div>
      </div>
    </section>
  );
}
