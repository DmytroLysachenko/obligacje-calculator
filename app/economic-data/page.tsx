'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { InflationChart } from '@/features/economic-data/components/InflationChart';
import { NBPRateChart } from '@/features/economic-data/components/NBPRateChart';
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

function RangeActions({
  period,
  setPeriod,
  language,
}: {
  period: PeriodValue;
  setPeriod: (value: PeriodValue) => void;
  language: 'pl' | 'en';
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
      <span className="inline-flex items-center gap-1 px-3 text-xs font-medium text-slate-500">
        <CalendarRange className="h-3.5 w-3.5" />
        {language === 'pl' ? 'Zakres danych' : 'Range'}
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
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
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
  const state = getReferenceState(meta);
  const rows = [
    {
      label: language === 'pl' ? 'Zrodlo' : 'Source',
      value: isLoading ? '...' : getReferenceSourceLabel(meta),
    },
    {
      label: language === 'pl' ? 'Zakres' : 'Coverage',
      value: isLoading ? '...' : getReferenceCoverageLabel(meta),
    },
    {
      label: language === 'pl' ? 'Stan na' : 'As of',
      value: isLoading ? '...' : getReferenceAsOfLabel(meta),
    },
    {
      label: language === 'pl' ? 'Uzycie' : 'Use',
      value: isLoading ? '...' : getReferenceScopeLabel(meta),
    },
  ];

  return (
    <Card
      className={cn(
        'rounded-[2rem] border shadow-none',
        state.tone === 'warning'
          ? 'border-amber-200 bg-amber-50/70'
          : 'border-slate-200 bg-white',
      )}
    >
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {state.tone === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              )}
              <p className="text-xl font-black tracking-tight text-slate-950">
                {title}
              </p>
            </div>
            <p className="text-sm leading-7 text-slate-600">{state.description}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {row.label}
              </p>
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
        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function EconomicDataPage() {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<PeriodValue>('10Y');
  const { data: inflationMeta, isLoading: isLoadingInflation } =
    useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/inflation');
  const { data: nbpMeta, isLoading: isLoadingNbp } =
    useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/nbp-rate');

  const pageIntro =
    language === 'pl'
      ? 'Ta strona ma dostarczac kontekst makro dla kalkulatorow obligacji. Nie ma udawac samodzielnego produktu forecastingowego ani pulpitu danych.'
      : 'This page exists to provide macro context for the bond calculators. It should not pretend to be a standalone forecasting product or a noisy market dashboard.';

  const usageGuide =
    language === 'pl'
      ? [
          'Inflacja pomaga zrozumiec realna sile nabywcza wyniku i dzialanie obligacji indeksowanych.',
          'Stopa NBP sluzy glownie jako kontekst dla ROR i DOR oraz dla interpretacji otoczenia rynkowego.',
          'Krotsze zakresy poprawiaja czytelnosc. Szerszy zakres daje tlo historyczne, ale nie poprawia jakosci brakujacych danych.',
        ]
      : [
          'Inflation helps explain real purchasing power and inflation-linked bond behavior.',
          'The NBP rate matters mostly as context for ROR and DOR and for reading the broader policy backdrop.',
          'Shorter ranges improve readability. Wider ranges add context, but they do not improve missing data quality.',
        ];

  return (
    <CalculatorPageShell
      title={t('nav.economic_data')}
      description={t('economic.subtitle')}
      icon={<Activity className="h-8 w-8" />}
      isCalculating={false}
      hasResults
      extraHeaderActions={
        <RangeActions period={period} setPeriod={setPeriod} language={language} />
      }
    >
      <div className="space-y-8">
        <Card className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_22px_70px_-48px_rgba(15,23,42,0.45)]">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                <Database className="h-3.5 w-3.5 text-primary" />
                {language === 'pl' ? 'Panel referencyjny' : 'Reference panel'}
              </div>
              <h2 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950">
                {language === 'pl'
                  ? 'Makro dane maja pomagac liczyc obligacje, nie odwracac od nich uwagi.'
                  : 'Macro data should support bond calculations, not compete with them.'}
              </h2>
              <p className="max-w-4xl text-sm leading-8 text-slate-600">{pageIntro}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ReferenceMetric
                label={language === 'pl' ? 'Serie' : 'Series'}
                value="2"
              />
              <ReferenceMetric
                label={language === 'pl' ? 'Rola' : 'Purpose'}
                value={language === 'pl' ? 'Kontekst' : 'Context'}
              />
              <ReferenceMetric
                label={language === 'pl' ? 'Tryb' : 'Mode'}
                value={language === 'pl' ? 'Referencyjny' : 'Reference'}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-10">
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
            <Card className="rounded-[2rem] border border-slate-200 bg-white/92 shadow-none">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <p className="text-xl font-black tracking-tight text-slate-950">
                    {language === 'pl' ? 'Zakres strony' : 'Page scope'}
                  </p>
                </div>
                {usageGuide.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-7 text-slate-600">{item}</p>
                  </div>
                ))}
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

            <Card className="rounded-[2rem] border border-amber-200 bg-amber-50/70 shadow-none">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-2 text-amber-950">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="font-black tracking-tight">
                    {language === 'pl' ? 'Uwaga o jakosci danych' : 'Data-quality note'}
                  </p>
                </div>
                <p className="text-sm leading-7 text-amber-950/90">
                  {language === 'pl'
                    ? 'Jesli synchronizacja jest niepelna, strona powinna mowic o tym wprost. Te wykresy maja pomagac interpretowac wynik kalkulatora, nie budowac fałszywego poczucia kompletności.'
                    : 'If sync coverage is incomplete, the page should say that directly. These charts are here to support calculator interpretation, not to create false confidence in perfect coverage.'}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </CalculatorPageShell>
  );
}
