'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart } from 'lucide-react';
import { BondInputs, CalculationResult, InterestPayout } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
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

interface ComparisonResultsPanelProps {
  chartData: ComparisonChartPoint[];
  showRealValue: boolean;
  usesMixedTimelineCadence: boolean;
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  inputsA: BondInputs;
  inputsB: BondInputs;
  formatCurrency: (value: number) => string;
  language: 'pl' | 'en';
}

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
}

function ComparisonChartTooltip({
  active,
  payload,
  label,
  formatCurrency,
}: {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string;
  formatCurrency: (value: number) => string;
}) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="min-w-[150px] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="ui-metadata mb-2 border-b border-border/50 pb-1 font-semibold">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold">
              {formatCurrency(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonResultsPanel({
  chartData,
  showRealValue,
  usesMixedTimelineCadence,
  resultsA,
  resultsB,
  inputsA,
  inputsB,
  formatCurrency,
  language,
}: ComparisonResultsPanelProps) {
  const { t } = useAppI18n();
  const valueA = showRealValue ? resultsA.finalRealValue : resultsA.netPayoutValue;
  const valueB = showRealValue ? resultsB.finalRealValue : resultsB.netPayoutValue;
  const winner = valueA === valueB ? null : valueA > valueB ? 'A' : 'B';
  const winnerInput = winner === 'A' ? inputsA : winner === 'B' ? inputsB : null;
  const absoluteGap = Math.abs(valueA - valueB);
  const lowerValue = Math.min(valueA, valueB);
  const relativeGap = lowerValue > 0 ? (absoluteGap / lowerValue) * 100 : 0;
  const comparisonMetrics = React.useMemo<MetricStripItem[]>(() => [
    {
      label: showRealValue ? `${t('comparison.scenario_a')} ${t('common.real_value')}` : t('comparison.scenario_a'),
      value: formatCurrency(valueA),
      tone: 'text-primary',
    },
    {
      label: showRealValue ? `${t('comparison.scenario_b')} ${t('common.real_value')}` : t('comparison.scenario_b'),
      value: formatCurrency(valueB),
      tone: 'text-success',
    },
  ], [formatCurrency, showRealValue, t, valueA, valueB]);
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
      description: showRealValue ? t('common.real_value') : t('comparison.summary_net_payout'),
      tone: 'text-foreground',
    },
    {
      label: t('comparison.summary_relative_gap'),
      value: `${relativeGap.toFixed(1)}%`,
      description: t('comparison.summary_compared_to_lower'),
      tone: 'text-foreground',
    },
  ], [absoluteGap, formatCurrency, relativeGap, showRealValue, t, winner, winnerInput]);
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
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
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

        <ChartContainer responsiveHeightClassName="h-[360px] md:h-[420px] xl:h-[460px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="comparison-a" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="comparison-b" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} minTickGap={24} />
              <YAxis
                axisLine={false}
                tickLine={false}
                fontSize={10}
                tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ComparisonChartTooltip formatCurrency={formatCurrency} />} />
              <Legend
                verticalAlign="top"
                align="right"
                height={40}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
              />
              {chartData.length > 12 ? (
                <Brush dataKey="label" height={24} stroke="#cbd5e1" travellerWidth={8} />
              ) : null}
              <Area
                type="monotone"
                dataKey="valA"
                name={`${inputsA.bondType} (A)`}
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#comparison-a)"
                connectNulls
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="valB"
                name={`${inputsB.bondType} (B)`}
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#comparison-b)"
                connectNulls
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

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
