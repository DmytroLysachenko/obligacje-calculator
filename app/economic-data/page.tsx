'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Database,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAppI18n } from '@/i18n/client';
import { InflationChart } from '@/features/economic-data/components/InflationChart';
import { NBPRateChart } from '@/features/economic-data/components/NBPRateChart';
import { BondType } from '@/features/bond-core/types';
import { cn } from '@/lib/utils';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { useChartData } from '@/shared/hooks/useChartData';
import {
  getReferenceAsOfLabel,
  getReferenceCoverageLabel,
  getReferenceScopeLabel,
  getReferenceSourceLabel,
  getReferenceState,
} from '@/shared/lib/data-reference';
import { getBondRateContextCopy } from '@/shared/lib/bond-rate-context';
import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';

interface EconomicSeriesPoint {
  date: string;
  rate: number;
}

interface ChartSeriesEnvelope<T> {
  data: T[];
  source: 'database' | 'fallback';
  usedFallback: boolean;
  asOf?: string;
  lastCheck?: string;
  coverageStart?: string;
  coverageEnd?: string;
  dataSource?: string;
  seriesName?: string;
  syncStatus?: 'success' | 'partial' | 'failed' | 'stale';
  coverageNote?: string;
  sourceUrl?: string;
}

type PeriodValue = '1Y' | '5Y' | '10Y' | '30Y' | 'ALL';

function RangeActions({
  period,
  setPeriod,
  rangeLabel,
}: {
  period: PeriodValue;
  setPeriod: (value: PeriodValue) => void;
  rangeLabel: string;
}) {
  const periods: { label: string; value: PeriodValue }[] = [
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
    { label: '10Y', value: '10Y' },
    { label: '30Y', value: '30Y' },
    { label: 'MAX', value: 'ALL' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5">
      <span className="inline-flex items-center gap-1 px-3 text-sm font-medium text-slate-500">
        <CalendarRange className="h-3.5 w-3.5" />
        {rangeLabel}
      </span>
      {periods.map((item) => (
        <button
          key={item.value}
          onClick={() => setPeriod(item.value)}
          className={cn(
            'rounded-xl px-4 py-2 text-sm transition-colors',
            period === item.value
              ? 'bg-slate-900 font-semibold text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ReferenceMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="surface-panel rounded-3xl px-5 py-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function SeriesStatusCard({
  title,
  meta,
  isLoading,
  language,
}: {
  title: string;
  meta?: ChartSeriesEnvelope<EconomicSeriesPoint>;
  isLoading: boolean;
  language: 'pl' | 'en';
}) {
  const { t } = useAppI18n();
  const labels = {
    source: t('common.source'),
    coverage: t('common.coverage'),
    asOf: t('common.as_of'),
    usage: t('common.usage'),
  } as const;
  const state = getReferenceState(meta, language);
  const statusLabel =
    meta?.syncStatus === 'success'
      ? t('economic.reference_state.synced')
      : meta?.syncStatus === 'stale'
        ? t('economic.reference_state.needs_refresh')
        : meta?.syncStatus === 'partial'
          ? t('economic.reference_state.partial')
          : t('economic.reference_state.fallback');
  const rows = [
    {
      label: labels.source,
      value: isLoading ? '...' : getReferenceSourceLabel(meta, language),
    },
    {
      label: labels.coverage,
      value: isLoading ? '...' : getReferenceCoverageLabel(meta, language),
    },
    {
      label: labels.asOf,
      value: isLoading ? '...' : getReferenceAsOfLabel(meta, language),
    },
    {
      label: labels.usage,
      value: isLoading ? '...' : getReferenceScopeLabel(meta, language),
    },
  ];

  return (
    <Card
      className={cn(
        'surface-panel rounded-[2rem]',
        state.tone === 'warning'
          ? 'border-amber-200 bg-amber-50/70'
          : 'border-slate-200 bg-white',
      )}
    >
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
            {state.tone === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-amber-700" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            )}
            <p className="text-xl font-black tracking-tight text-slate-950">{title}</p>
            </div>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-semibold',
                state.tone === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800',
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-sm leading-7 text-slate-600">{state.description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <p className="text-sm font-semibold text-slate-500">{row.label}</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{row.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-slate-950">{title}</h3>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function EconomicDataPage() {
  const { t, locale: language } = useAppI18n();
  const { definitions } = useBondDefinitions();
  const [period, setPeriod] = useState<PeriodValue>('10Y');
  const { data: inflationMeta, isLoading: isLoadingInflation } =
    useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/inflation');
  const { data: nbpMeta, isLoading: isLoadingNbp } =
    useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/nbp-rate');
  const labels = {
    panel: t('economic.reference_panel'),
    series: t('economic.series'),
    purpose: t('economic.purpose'),
    mode: t('economic.mode'),
    goal: t('economic.goal'),
    context: t('economic.context'),
    reference: t('economic.reference'),
    readableContext: t('economic.readable_context'),
    howToUse: t('economic.how_to_use_page'),
    dataQuality: t('economic.data_quality_title'),
    pageScope: t('economic.page_scope_title'),
  } as const;

  const pageIntro = t('economic.page_intro');
  const floatingRateContext = getBondRateContextCopy(
    BondType.ROR,
    definitions?.[BondType.ROR]?.firstYearRate ?? 4,
    0,
    t,
  );

  const usageGuide = [
    t('economic.usage_guide_1'),
    t('economic.usage_guide_2'),
    floatingRateContext.narrative,
    t('economic.usage_guide_4'),
  ];

  return (
    <CalculatorPageShell
      title={t('nav.economic_data')}
      description={t('economic.subtitle')}
      icon={<Activity className="h-8 w-8" />}
      isCalculating={false}
      hasResults
      extraHeaderActions={
        <RangeActions period={period} setPeriod={setPeriod} rangeLabel={t('economic.range_data')} />
      }
    >
      <div className="space-y-6 md:space-y-8">
        <Card className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_22px_70px_-48px_rgba(15,23,42,0.45)]">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-slate-700">
                <Database className="h-3.5 w-3.5 text-primary" />
                {labels.panel}
              </div>
              <h2 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950">
                {t('economic.macro_support_title')}
              </h2>
              <p className="max-w-4xl text-sm leading-8 text-slate-600">{pageIntro}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <ReferenceMetric
                label={labels.series}
                value="2"
              />
              <ReferenceMetric
                label={labels.purpose}
                value={labels.context}
              />
              <ReferenceMetric
                label={labels.mode}
                value={labels.reference}
              />
              <ReferenceMetric
                label={labels.goal}
                value={labels.readableContext}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel rounded-[2rem] border-slate-200 bg-white/88 shadow-none">
          <CardContent className="grid gap-4 p-6 md:grid-cols-[minmax(0,1fr)_200px]">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xl font-black tracking-tight text-slate-950">
                  {labels.howToUse}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {usageGuide.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/55 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm leading-7 text-slate-600">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-4">
              <div className="flex items-center gap-2 text-amber-950">
                <AlertTriangle className="h-4 w-4" />
                <p className="font-black tracking-tight">
                  {labels.dataQuality}
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-amber-950/90">
                {t('economic.data_quality_description')}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
          <div className="space-y-8 md:space-y-10">
            <SectionBlock
              title={t('economic.inflation_title')}
              description={t('economic.inflation_desc')}
            >
              <InflationChart period={period} />
            </SectionBlock>

            <SectionBlock
              title={t('economic.nbp_rate_title')}
              description={t('economic.nbp_rate_desc')}
            >
              <NBPRateChart period={period} />
            </SectionBlock>
          </div>

          <aside className="space-y-6">
            <Card className="surface-panel rounded-[2rem] border-slate-200 bg-white/84 shadow-none">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <p className="text-xl font-black tracking-tight text-slate-950">
                    {labels.pageScope}
                  </p>
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  {t('economic.page_scope_description')}
                </p>
              </CardContent>
            </Card>

            <SeriesStatusCard
              title={t('economic.inflation_title')}
              meta={inflationMeta}
              isLoading={isLoadingInflation}
              language={language}
            />

            <SeriesStatusCard
              title={t('economic.nbp_rate_title')}
              meta={nbpMeta}
              isLoading={isLoadingNbp}
              language={language}
            />
          </aside>
        </div>
      </div>
    </CalculatorPageShell>
  );
}




