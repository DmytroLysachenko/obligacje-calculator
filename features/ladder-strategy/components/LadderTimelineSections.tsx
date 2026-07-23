'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { LADDER_CHART_MODES } from '@/features/ladder-strategy/constants/timeline';
import { LadderChartMode, LadderTableFilter } from '@/features/ladder-strategy/types/timeline';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSection } from '@/shared/components/charts/ChartSection';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';
import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { MetricStrip, MetricStripItem } from '@/shared/components/results/MetricStrip';
import { TableRowLimit } from '@/shared/components/results/TableDensityControls';
import { LadderMaturityBucket, LadderYearBucket } from '@/shared/lib/ladder-display';

import { LadderTimelineTable } from './LadderTimelineTable';

type Translate = (key: string, values?: Record<string, string | number>) => string;
type FormatCurrency = (value: number) => string;

interface LadderYearSummarySectionProps {
  yearlySummaryItems: MetricStripItem[];
  strongestYear: LadderYearBucket | null;
  formatCurrency: FormatCurrency;
  t: Translate;
}

export function LadderYearSummarySection({
  yearlySummaryItems,
  strongestYear,
  formatCurrency,
  t,
}: LadderYearSummarySectionProps) {
  return (
    <SectionBlock
      title={t('ladder_page.timeline.year_summary_title')}
      description={t('ladder_page.timeline.year_summary_intro')}
      className="border-y border-border py-6"
      action={
        <div className="border-l-2 border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
          <p className="text-xs font-semibold text-muted-foreground">
            {t('ladder_page.timeline.strongest_year')}
          </p>
          <p className="mt-1 font-semibold text-foreground">
            {strongestYear
              ? `${strongestYear.year} - ${formatCurrency(strongestYear.amount)}`
              : '-'}
          </p>
        </div>
      }
    >
      <MetricStrip columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4" items={yearlySummaryItems} />
    </SectionBlock>
  );
}

interface LadderTimelineChartSectionProps {
  chartMode: LadderChartMode;
  chartData: Array<LadderMaturityBucket | LadderYearBucket>;
  displayedRows: LadderMaturityBucket[];
  filteredRows: LadderMaturityBucket[];
  monthlyBuckets: LadderMaturityBucket[];
  filteredRowCount: number;
  tableFilter: LadderTableFilter;
  rowLimit: TableRowLimit;
  totalLots: number;
  peakMonth: LadderMaturityBucket | null;
  peakShare: number;
  onChartModeChange: (mode: LadderChartMode) => void;
  onTableFilterChange: (filter: LadderTableFilter) => void;
  onRowLimitChange: (value: TableRowLimit) => void;
  formatCurrency: FormatCurrency;
  t: Translate;
}

export function LadderTimelineChartSection({
  chartMode,
  chartData,
  displayedRows,
  filteredRows,
  monthlyBuckets,
  filteredRowCount,
  tableFilter,
  rowLimit,
  totalLots,
  peakMonth,
  peakShare,
  onChartModeChange,
  onTableFilterChange,
  onRowLimitChange,
  formatCurrency,
  t,
}: LadderTimelineChartSectionProps) {
  return (
    <ChartSection
      title={t('ladder_page.timeline.chart_title')}
      description={
        chartMode === 'yearly'
          ? t('ladder_page.timeline.yearly_chart_description')
          : t('ladder_page.timeline.monthly_chart_description')
      }
      className="border-y border-border py-6"
      controls={
        <SegmentedControl
          value={chartMode}
          options={LADDER_CHART_MODES.map((mode) => ({
            value: mode,
            label: t(`ladder_page.timeline.chart_modes.${mode}`),
          }))}
          onValueChange={onChartModeChange}
          className="w-full md:w-64"
          itemClassName="h-8"
        />
      }
    >
      <p className="border-l-2 border-border bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
        <span className="font-semibold text-foreground">
          {t('ladder_page.timeline.chart_note_title')}
        </span>{' '}
        {t('ladder_page.timeline.chart_note_description')}
      </p>
      <ChartContainer responsiveHeightClassName="h-[320px] md:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="displayDate" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }}
              formatter={(value: ValueType | undefined) => [
                formatCurrency(Number(value ?? 0)),
                t('ladder_page.timeline.tooltip_amount_label'),
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="amount" fill="hsl(var(--chart-data))" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="amount"
                position="top"
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                className="fill-muted-foreground text-[10px]"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <LadderTimelineTable
        displayedRows={displayedRows}
        filteredRows={filteredRows}
        monthlyBuckets={monthlyBuckets}
        filteredRowCount={filteredRowCount}
        tableFilter={tableFilter}
        rowLimit={rowLimit}
        totalLots={totalLots}
        onTableFilterChange={onTableFilterChange}
        onRowLimitChange={onRowLimitChange}
        formatCurrency={formatCurrency}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormInlineNotice
          title={t('ladder_page.timeline.peak_month_title')}
          description={
            <>
              <span className="font-semibold text-foreground">
                {peakMonth ? `${peakMonth.displayDate} (${formatCurrency(peakMonth.amount)})` : '-'}
              </span>{' '}
              {t('ladder_page.timeline.peak_month_description')}
            </>
          }
        />

        <FormInlineNotice
          tone={peakShare >= 25 ? 'warning' : 'success'}
          title={t('ladder_page.timeline.cluster_title')}
          description={
            <>
              <span className="font-semibold">
                {peakMonth
                  ? t('ladder_page.timeline.cluster_value', {
                      percent: peakShare.toFixed(1),
                      month: peakMonth.displayDate,
                    })
                  : t('ladder_page.timeline.cluster_none')}
              </span>{' '}
              {peakShare >= 25
                ? t('ladder_page.timeline.cluster_warning')
                : t('ladder_page.timeline.cluster_ok')}
            </>
          }
        />
      </div>

      <FormInlineNotice
        title={t('ladder_page.timeline.interpretation_title')}
        description={t('ladder_page.timeline.interpretation_description')}
      />
    </ChartSection>
  );
}
