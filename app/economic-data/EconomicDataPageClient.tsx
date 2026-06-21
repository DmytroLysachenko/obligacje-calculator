'use client';

import React, {useState} from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Database,
  Info,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {Accordion} from '@/components/ui/accordion';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {useAppI18n} from '@/i18n/client';
import {InflationChart} from '@/features/economic-data/components/InflationChart';
import {NBPRateChart} from '@/features/economic-data/components/NBPRateChart';
import {BondType} from '@/features/bond-core/types';
import {cn} from '@/lib/utils';
import {CalculatorPageShell} from '@/shared/components/page/CalculatorPageShell';
import {ReferenceDashboardHero} from '@/shared/components/reference/ReferenceDashboardHero';
import {ReferenceGuideRail} from '@/shared/components/reference/ReferenceGuideRail';
import {ReferenceNoteCard} from '@/shared/components/reference/ReferenceNoteCard';
import {ChartSection} from '@/shared/components/charts/ChartSection';
import {SectionBlock} from '@/shared/components/page/SectionBlock';
import {useChartData} from '@/shared/hooks/useChartData';
import {
  buildEconomicHealthItems,
  ECONOMIC_RANGE_OPTIONS,
  getEconomicReferenceState,
  getEconomicStatusLabel,
  type ChartSeriesEnvelope,
  type EconomicSeriesPoint,
  type PeriodValue,
} from '@/features/economic-data/lib/economic-dashboard-model';
import {getBondRateContextCopy} from '@/shared/lib/bond-rate-context';
import {useBondDefinitions} from '@/shared/hooks/useBondDefinitions';

function RangeActions({
  period,
  setPeriod,
  rangeLabel,
  hint,
}: {
  period: PeriodValue;
  setPeriod: (value: PeriodValue) => void;
  rangeLabel: string;
  hint: string;
}) {
  return (
    <div className="space-y-2 border-y border-border py-3">
      <div className="flex flex-wrap items-center gap-1">
        <span className="inline-flex items-center gap-1 px-3 text-sm font-medium text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5" />
          {rangeLabel}
        </span>
        {ECONOMIC_RANGE_OPTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={period === item.value}
            onClick={() => setPeriod(item.value)}
            className={cn(
              'rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2',
              period === item.value
                ? 'bg-foreground font-semibold text-background'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="px-3 text-xs leading-5 text-muted-foreground">
        {hint}
      </p>
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
  const {t} = useAppI18n();
  const labels = {
    source: t('common.source'),
    coverage: t('common.coverage'),
    asOf: t('common.as_of'),
    usage: t('common.usage'),
    synced: t('economic.reference_state.synced'),
    stale: t('economic.reference_state.needs_refresh'),
    partial: t('economic.reference_state.partial'),
    fallback: t('economic.reference_state.fallback'),
  } as const;
  const state = getEconomicReferenceState(meta, language);
  const statusLabel = getEconomicStatusLabel(meta, labels);
  const healthItems = buildEconomicHealthItems({meta, isLoading, language, labels});

  return (
    <section
      className={cn(
        'border-t py-5',
        state.tone === 'warning' ? 'border-warning/40' : 'border-border',
      )}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {state.tone === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              <p className="ui-card-title">{title}</p>
            </div>
            <span
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-semibold',
                state.tone === 'warning'
                  ? 'border-warning/30 bg-warning/10 text-warning'
                  : 'border-success/30 bg-success/10 text-success',
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="ui-body">{state.description}</p>
        </div>

        <div className="space-y-3 border-y border-border py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            {t('economic.data_health')}
          </div>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {healthItems.map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">{row.label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function UsageGuidePanel({
  usageGuide,
  labels,
}: {
  usageGuide: string[];
  labels: {
    howToUse: string;
    dataQuality: string;
  };
}) {
  const {t} = useAppI18n();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-5 border-t border-border py-5 md:py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="ui-section-title">
            {labels.howToUse}
          </h3>
        </div>
        <div className="grid gap-x-6 gap-y-4 border-y border-border py-4 md:grid-cols-2">
          {usageGuide.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div className="space-y-1">
                <p className="ui-body">{item}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ReferenceNoteCard
        icon={<AlertTriangle className="h-4 w-4 text-warning" />}
        title={labels.dataQuality}
        description={t('economic.data_quality_description')}
        tone="warning"
      />
    </div>
  );
}

function ReferenceStatusPanel({
  inflationMeta,
  nbpMeta,
  isLoadingInflation,
  isLoadingNbp,
  labels,
  language,
}: {
  inflationMeta?: ChartSeriesEnvelope<EconomicSeriesPoint>;
  nbpMeta?: ChartSeriesEnvelope<EconomicSeriesPoint>;
  isLoadingInflation: boolean;
  isLoadingNbp: boolean;
  labels: {
    referenceRail: string;
    statusRail: string;
    pageScope: string;
  };
  language: 'pl' | 'en';
}) {
  const {t} = useAppI18n();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-6 lg:grid-cols-2">
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
      </div>

      <Accordion type="multiple" defaultValue={['scope', 'status']} className="space-y-4">
        <ReferenceGuideRail
          value="scope"
          icon={<ShieldAlert className="h-4 w-4 text-primary" />}
          title={labels.referenceRail}
        >
          <ReferenceNoteCard
            icon={<ShieldAlert className="h-4 w-4 text-primary" />}
            title={labels.pageScope}
            description={t('economic.page_scope_description')}
          />
        </ReferenceGuideRail>

        <ReferenceGuideRail
          value="status"
          icon={<Database className="h-4 w-4 text-primary" />}
          title={labels.statusRail}
        >
          <ReferenceNoteCard
            icon={<Database className="h-4 w-4 text-primary" />}
            title={t('economic.reference_panel')}
            description={t('economic.reference_status_description')}
          />
        </ReferenceGuideRail>
      </Accordion>
    </div>
  );
}

export function EconomicDataPageClient() {
  const {t, locale: language} = useAppI18n();
  const {definitions} = useBondDefinitions();
  const [period, setPeriod] = useState<PeriodValue>('10Y');
  const {data: inflationMeta, isLoading: isLoadingInflation} =
    useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/inflation');
  const {data: nbpMeta, isLoading: isLoadingNbp} =
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
    referenceRail: t('economic.reference_rail_title'),
    statusRail: t('economic.status_rail_title'),
    tabCharts: t('economic.tab_charts'),
    tabStatus: t('economic.tab_status'),
    tabGuide: t('economic.tab_guide'),
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
  const heroMetrics = [
    {label: labels.series, value: '2'},
    {label: labels.purpose, value: labels.context},
    {label: labels.mode, value: labels.reference},
    {label: labels.goal, value: labels.readableContext},
  ];

  return (
    <CalculatorPageShell
      title={t('nav.economic_data')}
      description={t('economic.subtitle')}
      icon={<Activity className="h-8 w-8" />}
      isCalculating={false}
      hasResults
    >
      <div className="space-y-5 md:space-y-6">
        <ReferenceDashboardHero
          badge={
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              <Database className="h-3.5 w-3.5 text-foreground" />
              {labels.panel}
            </div>
          }
          title={t('economic.macro_support_title')}
          description={pageIntro}
          metrics={heroMetrics}
        />

        <Tabs defaultValue="charts" className="space-y-5">
          <TabsList className="h-auto w-fit flex-wrap justify-start gap-1 border-b border-border bg-transparent p-0 shadow-none">
            <TabsTrigger
              value="charts"
              className="h-9 gap-2 rounded-none border-b-2 border-transparent px-3.5 py-2 data-[state=active]:border-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              {labels.tabCharts}
            </TabsTrigger>
            <TabsTrigger
              value="status"
              className="h-9 gap-2 rounded-none border-b-2 border-transparent px-3.5 py-2 data-[state=active]:border-foreground"
            >
              <Database className="h-4 w-4" />
              {labels.tabStatus}
            </TabsTrigger>
            <TabsTrigger
              value="guide"
              className="h-9 gap-2 rounded-none border-b-2 border-transparent px-3.5 py-2 data-[state=active]:border-foreground"
            >
              <Sparkles className="h-4 w-4" />
              {labels.tabGuide}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-8">
            <SectionBlock
              title={t('economic.chart_dashboard_title')}
              description={t('economic.chart_dashboard_description')}
              icon={<Info className="h-4 w-4" />}
              action={
                <RangeActions
                  period={period}
                  setPeriod={setPeriod}
                  rangeLabel={t('economic.range_data')}
                  hint={t('economic.range_hint')}
                />
              }
              contentClassName="space-y-5"
            >
              <Tabs defaultValue="cpi" className="space-y-5">
                <TabsList className="h-auto w-fit flex-wrap justify-start gap-1 rounded-md border border-border bg-muted/25 p-1 shadow-none">
                  <TabsTrigger value="cpi" className="h-8 px-3 text-xs font-semibold">
                    {t('economic.inflation_title')}
                  </TabsTrigger>
                  <TabsTrigger value="nbp" className="h-8 px-3 text-xs font-semibold">
                    {t('economic.nbp_rate_title')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cpi">
                  <ChartSection
                    title={t('economic.inflation_title')}
                    description={t('economic.inflation_desc')}
                  >
                    <InflationChart period={period} />
                  </ChartSection>
                </TabsContent>

                <TabsContent value="nbp">
                  <ChartSection
                    title={t('economic.nbp_rate_title')}
                    description={t('economic.nbp_rate_desc')}
                  >
                    <NBPRateChart period={period} />
                  </ChartSection>
                </TabsContent>
              </Tabs>
            </SectionBlock>
          </TabsContent>

          <TabsContent value="status">
            <SectionBlock
              title={t('economic.status_dashboard_title')}
              description={t('economic.status_dashboard_description')}
              icon={<Info className="h-4 w-4" />}
              contentClassName="space-y-5"
            >
              <ReferenceStatusPanel
                inflationMeta={inflationMeta}
                nbpMeta={nbpMeta}
                isLoadingInflation={isLoadingInflation}
                isLoadingNbp={isLoadingNbp}
                labels={labels}
                language={language}
              />
            </SectionBlock>
          </TabsContent>

          <TabsContent value="guide">
            <SectionBlock
              title={t('economic.guide_dashboard_title')}
              description={t('economic.guide_dashboard_description')}
              icon={<Info className="h-4 w-4" />}
              contentClassName="space-y-5"
            >
              <UsageGuidePanel
                usageGuide={usageGuide}
                labels={{
                  howToUse: labels.howToUse,
                  dataQuality: labels.dataQuality,
                }}
              />
            </SectionBlock>
          </TabsContent>
        </Tabs>
      </div>
    </CalculatorPageShell>
  );
}
