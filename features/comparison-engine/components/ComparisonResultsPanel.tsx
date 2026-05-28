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
import { FileSpreadsheet, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BondInputs, CalculationResult, InterestPayout } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { buildComparisonExportHeaders } from '@/shared/lib/export-headers';
import {
  buildCombinedComparisonCsvFilename,
  exportComparisonCsv,
} from '@/shared/lib/retained-exports';
import { ComparisonChartPoint } from '../lib/comparison-display';

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
    <div className="min-w-[150px] rounded border border-border bg-popover p-3 text-popover-foreground shadow-xl">
      <p className="mb-2 border-b border-border/50 pb-1 text-xs font-bold">
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

function ActionMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="border-slate-200 px-4 py-3 md:border-r last:md:border-r-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-lg font-black ${tone ?? 'text-slate-950'}`}>{value}</p>
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

  return (
    <Card className="border shadow-none">
      <CardHeader className="border-b border-dashed bg-white">
        <CardTitle className="flex items-center gap-2 text-xl font-black">
          <LineChart className="h-5 w-5 text-primary" />
          {t('comparison.performance_over_time')}
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          {t('comparison.chart_header_desc')}
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-5 grid gap-0 rounded-[1.4rem] border border-slate-200 md:grid-cols-2 xl:grid-cols-3">
          <ActionMetric
            label={showRealValue ? `${t('comparison.scenario_a')} ${t('common.real_value')}` : t('comparison.scenario_a')}
            value={formatCurrency(showRealValue ? resultsA.finalRealValue : resultsA.netPayoutValue)}
            tone="text-blue-700"
          />
          <ActionMetric
            label={showRealValue ? `${t('comparison.scenario_b')} ${t('common.real_value')}` : t('comparison.scenario_b')}
            value={formatCurrency(showRealValue ? resultsB.finalRealValue : resultsB.netPayoutValue)}
            tone="text-emerald-700"
          />
          <button
            type="button"
            className="px-4 py-3 text-left transition-colors hover:bg-slate-50/60 xl:border-l xl:border-slate-200"
            onClick={() =>
              exportComparisonCsv({
                timelineA: resultsA.timeline,
                timelineB: resultsB.timeline,
                headers: buildComparisonExportHeaders(t),
                language,
                fileName: buildCombinedComparisonCsvFilename(inputsA.bondType, inputsB.bondType),
              })
            }
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {t('comparison.export')}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              {t('comparison.export_comparison_csv')}
            </div>
          </button>
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
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <div className="rounded-[1.5rem] border border-slate-200 px-5 py-4">
                <p>{t('comparison.comparison_chart_help_note')}</p>
              </div>
              {usesMixedTimelineCadence ? (
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/55 px-5 py-4 text-amber-950">
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
                <div className="rounded-[1.4rem] border border-slate-200 px-4 py-4">
                  <p className="text-sm font-bold text-slate-900">
                    {t('comparison.end_level')}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {t('comparison.end_level_desc')}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-slate-200 px-4 py-4">
                  <p className="text-sm font-bold text-slate-900">
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
      </CardContent>
    </Card>
  );
}
