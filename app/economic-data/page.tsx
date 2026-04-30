'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { TrendingUp, Info, Activity, CalendarRange, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InflationChart } from '@/features/economic-data/components/InflationChart';
import { NBPRateChart } from '@/features/economic-data/components/NBPRateChart';
import { cn } from '@/lib/utils';

import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { useChartData } from '@/shared/hooks/useChartData';

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

export default function EconomicDataPage() {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<'1Y' | '5Y' | '10Y' | '30Y' | 'ALL'>('10Y');
  const { data: inflationMeta } = useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/inflation');
  const { data: nbpMeta } = useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/nbp-rate');

  const periods = [
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
    { label: '10Y', value: '10Y' },
    { label: '30Y', value: '30Y' },
    { label: 'MAX', value: 'ALL' },
  ];

  const sourceCards = [
    {
      title: t('economic.inflation_title'),
      meta: inflationMeta,
    },
    {
      title: t('economic.nbp_rate_title'),
      meta: nbpMeta,
    },
  ];

  return (
    <CalculatorPageShell
      title={t('nav.economic_data')}
      description={t('economic.subtitle')}
      icon={<Activity className="h-8 w-8" />}
      isCalculating={false}
      hasResults={true}
      extraHeaderActions={
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-1 shadow-sm">
          <span className="inline-flex items-center gap-1 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" />
            {language === 'pl' ? 'Zakres' : 'Range'}
          </span>
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as '1Y' | '5Y' | '10Y' | '30Y' | 'ALL')}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition-all',
                period === p.value
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg border-primary/5 min-h-[500px]">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>{t('economic.inflation_title')}</CardTitle>
              </div>
              <CardDescription>{t('economic.inflation_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <InflationChart period={period} />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-primary/5 min-h-[500px]">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>{t('economic.nbp_rate_title')}</CardTitle>
              </div>
              <CardDescription>{t('economic.nbp_rate_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <NBPRateChart period={period} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {sourceCards.map((series) => {
            const isFallback = series.meta?.usedFallback ?? true;

            return (
              <Card
                key={series.title}
                className={cn(
                  'shadow-md border',
                  isFallback ? 'border-amber-200 bg-amber-50/40' : 'border-emerald-100 bg-emerald-50/20',
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Database className="h-4 w-4 text-primary" />
                    {series.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <div><span className="font-bold text-foreground">{t('economic.data_source')}:</span> {series.meta?.dataSource ?? series.meta?.source ?? 'unknown'}</div>
                  <div><span className="font-bold text-foreground">{t('economic.as_of')}:</span> {series.meta?.asOf ?? 'unknown'}</div>
                  <div><span className="font-bold text-foreground">Coverage:</span> {series.meta?.coverageStart ?? 'unknown'} - {series.meta?.coverageEnd ?? 'unknown'}</div>
                  <div className={cn(
                    'rounded-lg border px-3 py-2',
                    isFallback ? 'border-amber-200 bg-amber-100/70 text-amber-900' : 'border-emerald-200 bg-emerald-100/70 text-emerald-900',
                  )}>
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {isFallback ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      {isFallback ? 'Fallback / partial data' : 'Database-backed data'}
                    </div>
                    <p>
                      {isFallback
                        ? 'This series is not fully backed by current synced data. Treat it as reference only.'
                        : 'This series is backed by synced database data and can be used as current context.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-blue-100 bg-blue-50/20 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                {t('economic.why_it_matters')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs leading-relaxed text-muted-foreground">
              {t('economic.inflation_impact_desc')}
            </CardContent>
          </Card>

          <Card className="border-primary/5 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Info className="h-4 w-4 text-primary" />
                {t('economic.data_source')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {t('economic.source_desc')}
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                {language === 'pl'
                  ? 'Wybierz krotszy zakres, aby szybciej ocenic najnowsze zmiany, albo MAX do pelnego kontekstu historycznego.'
                  : 'Use a shorter range to inspect recent moves quickly, or MAX for full historical context.'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CalculatorPageShell>
  );
}
