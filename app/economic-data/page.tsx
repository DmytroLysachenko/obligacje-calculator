'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Database,
  Info,
  LineChart,
} from 'lucide-react';
import { InflationChart } from '@/features/economic-data/components/InflationChart';
import { NBPRateChart } from '@/features/economic-data/components/NBPRateChart';
import { cn } from '@/lib/utils';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { useChartData } from '@/shared/hooks/useChartData';
import {
  getReferenceAsOfLabel,
  getReferenceCoverageLabel,
  getReferenceSourceLabel,
  getReferenceState,
} from '@/shared/lib/data-reference';

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
}

type PeriodValue = '1Y' | '5Y' | '10Y' | '30Y' | 'ALL';

function StatusCard({
  title,
  meta,
  isLoading,
}: {
  title: string;
  meta?: ChartSeriesEnvelope<EconomicSeriesPoint>;
  isLoading: boolean;
}) {
  const state = getReferenceState(meta);

  return (
    <Card
      className={cn(
        'rounded-2xl border shadow-none',
        state.tone === 'warning' ? 'border-amber-200 bg-amber-50' : 'bg-card',
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {state.tone === 'warning' ? (
            <AlertTriangle className="h-4 w-4 text-amber-700" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border bg-background/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p>
            <p className="mt-1 font-medium text-foreground">
              {isLoading ? 'Loading...' : getReferenceSourceLabel(meta)}
            </p>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Coverage</p>
            <p className="mt-1 font-medium text-foreground">
              {isLoading ? 'Loading...' : getReferenceCoverageLabel(meta)}
            </p>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">As of</p>
            <p className="mt-1 font-medium text-foreground">
              {isLoading ? 'Loading...' : getReferenceAsOfLabel(meta)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'rounded-xl border px-3 py-3 leading-6',
            state.tone === 'warning'
              ? 'border-amber-200 bg-amber-100 text-amber-950'
              : 'border-emerald-200 bg-emerald-50 text-emerald-950',
          )}
        >
          <p className="font-semibold">{state.title}</p>
          <p className="mt-1 text-sm">{state.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EconomicDataPage() {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<PeriodValue>('10Y');
  const { data: inflationMeta, isLoading: isLoadingInflation } =
    useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/inflation');
  const { data: nbpMeta, isLoading: isLoadingNbp } =
    useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/nbp-rate');

  const periods: { label: string; value: PeriodValue }[] = [
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
    { label: '10Y', value: '10Y' },
    { label: '30Y', value: '30Y' },
    { label: 'MAX', value: 'ALL' },
  ];

  return (
    <CalculatorPageShell
      title={t('nav.economic_data')}
      description={t('economic.subtitle')}
      icon={<Activity className="h-8 w-8" />}
      isCalculating={false}
      hasResults
      extraHeaderActions={
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/20 p-1">
          <span className="inline-flex items-center gap-1 px-3 text-xs font-medium text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" />
            {language === 'pl' ? 'Zakres danych' : 'Range'}
          </span>
          {periods.map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm transition-colors',
                period === item.value
                  ? 'bg-background font-semibold text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <section className="space-y-8 xl:col-span-8">
          <Card className="rounded-2xl border shadow-none">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                <CardTitle>{t('economic.inflation_title')}</CardTitle>
              </div>
              <CardDescription className="text-sm leading-6">
                {t('economic.inflation_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <InflationChart period={period} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                <CardTitle>{t('economic.nbp_rate_title')}</CardTitle>
              </div>
              <CardDescription className="text-sm leading-6">
                {t('economic.nbp_rate_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <NBPRateChart period={period} />
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6 xl:col-span-4">
          <Card className="rounded-2xl border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-primary" />
                Page scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                This page is a reference panel for macro context used by the calculators. It is not a
                forecasting module and it is not a market research product.
              </p>
              <p>
                Each card below now shows actual source, coverage, and freshness metadata. If the sync
                pipeline is incomplete, the page should say that directly instead of pretending mature coverage.
              </p>
            </CardContent>
          </Card>

          <StatusCard
            title={t('economic.inflation_title')}
            meta={inflationMeta}
            isLoading={isLoadingInflation}
          />

          <StatusCard
            title={t('economic.nbp_rate_title')}
            meta={nbpMeta}
            isLoading={isLoadingNbp}
          />

          <Card className="rounded-2xl border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-primary" />
                How to use these series
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>{t('economic.inflation_impact_desc')}</p>
              <div className="rounded-xl border bg-muted/20 p-4">
                {language === 'pl'
                  ? 'Krotsze zakresy pomagaja ocenic ostatnie zmiany. MAX daje pelniejszy kontekst historyczny, ale nie poprawia jakosci brakujacych danych.'
                  : 'Shorter ranges help inspect recent changes. MAX gives broader context, but it does not improve missing data quality.'}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </CalculatorPageShell>
  );
}
