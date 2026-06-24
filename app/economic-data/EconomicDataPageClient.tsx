'use client';

import React, { useState } from 'react';
import { Activity, BarChart3, Database, Info, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppI18n } from '@/i18n/client';
import { InflationChart } from '@/features/economic-data/components/InflationChart';
import { NBPRateChart } from '@/features/economic-data/components/NBPRateChart';
import { BondType } from '@/features/bond-core/types';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { ReferenceDashboardHero } from '@/shared/components/reference/ReferenceDashboardHero';
import { ChartSection } from '@/shared/components/charts/ChartSection';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { useChartData } from '@/shared/hooks/useChartData';
import {
  type ChartSeriesEnvelope,
  type EconomicSeriesPoint,
  type PeriodValue,
} from '@/features/economic-data/lib/economic-dashboard-model';
import { getBondRateContextCopy } from '@/shared/lib/bond-rate-context';
import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import {
  RangeActions,
  ReferenceStatusPanel,
  UsageGuidePanel,
} from '@/features/economic-data/components/EconomicDashboardSections';

export function EconomicDataPageClient() {
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
    { label: labels.series, value: '2' },
    { label: labels.purpose, value: labels.context },
    { label: labels.mode, value: labels.reference },
    { label: labels.goal, value: labels.readableContext },
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
