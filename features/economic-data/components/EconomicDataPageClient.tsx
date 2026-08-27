'use client';

import { Activity, Database, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import React, { useCallback, useState } from 'react';

import { BondType } from '@/features/bond-core/types';
import {
  RangeActions,
  ReferenceStatusPanel,
  UsageGuidePanel,
} from '@/features/economic-data/components/EconomicDashboardSections';
import {
  type ChartSeriesEnvelope,
  type EconomicSeriesPoint,
} from '@/features/economic-data/lib/economic-dashboard-model';
import {
  buildEconomicPageLabels,
  buildEconomicUsageGuide,
} from '@/features/economic-data/lib/economic-page-model';
import {
  type EconomicView,
  serializeEconomicView,
} from '@/features/economic-data/lib/economic-view';
import { useAppI18n } from '@/i18n/client';
import { ChartSection } from '@/shared/components/charts/ChartSection';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { ReferenceDashboardHero } from '@/shared/components/reference/ReferenceDashboardHero';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { useChartData } from '@/shared/hooks/useChartData';
import { getBondRateContextCopy } from '@/shared/lib/bond-rate-context';

const ChartLoading = () => (
  <div
    className="h-[470px] w-full animate-pulse rounded-lg bg-muted"
    role="status"
    aria-label="Loading chart"
  />
);

const InflationChart = dynamic(
  () =>
    import('@/features/economic-data/components/InflationChart').then(
      (module) => module.InflationChart,
    ),
  { loading: ChartLoading },
);
const NBPRateChart = dynamic(
  () =>
    import('@/features/economic-data/components/NBPRateChart').then(
      (module) => module.NBPRateChart,
    ),
  { loading: ChartLoading },
);

export function EconomicDataPageClient({ initialView }: { initialView: EconomicView }) {
  const { t, locale: language } = useAppI18n();
  const { definitions } = useBondDefinitions();
  const pathname = usePathname();
  const [view, setView] = useState<EconomicView>(initialView);
  const { data: inflationMeta, isLoading: isLoadingInflation } =
    useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/inflation');
  const { data: nbpMeta, isLoading: isLoadingNbp } =
    useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/nbp-rate');
  const labels = buildEconomicPageLabels(t);

  const pageIntro = t('economic.page_intro');
  const floatingRateContext = getBondRateContextCopy(
    BondType.ROR,
    definitions?.[BondType.ROR]?.firstYearRate ?? 4,
    0,
    t,
  );
  const usageGuide = buildEconomicUsageGuide(t, floatingRateContext);
  const updateView = useCallback(
    (patch: Partial<EconomicView>) => {
      setView((current) => {
        const next = { ...current, ...patch };
        const query = serializeEconomicView(next);
        window.history.replaceState(window.history.state, '', `${pathname}?${query}`);
        return next;
      });
    },
    [pathname],
  );
  const selectedChart =
    view.series === 'cpi' ? (
      <ChartSection
        title={t('economic.inflation_title')}
        description={t('economic.inflation_desc')}
      >
        <InflationChart period={view.range} scaleMode={view.scale} />
      </ChartSection>
    ) : (
      <ChartSection title={t('economic.nbp_rate_title')} description={t('economic.nbp_rate_desc')}>
        <NBPRateChart period={view.range} />
      </ChartSection>
    );

  return (
    <CalculatorPageShell
      title={t('nav.economic_data')}
      description={t('economic.subtitle')}
      icon={<Activity className="h-8 w-8" />}
      isCalculating={false}
      hasResults={false}
    >
      <div className="ui-page-flow" aria-busy={isLoadingInflation || isLoadingNbp}>
        <ReferenceDashboardHero
          badge={
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              <Database className="h-3.5 w-3.5 text-foreground" />
              {labels.panel}
            </div>
          }
          title={t('economic.macro_support_title')}
          description={pageIntro}
          decisionTrace={<p className="text-sm leading-6 text-muted-foreground">{usageGuide[1]}</p>}
        />

        <SectionBlock
          title={t('economic.chart_dashboard_title')}
          description={t('economic.chart_dashboard_description')}
          icon={<Info className="h-4 w-4" />}
          action={
            <RangeActions
              period={view.range}
              setPeriod={(range) => updateView({ range })}
              series={view.series}
              setSeries={(series) => updateView({ series })}
              scale={view.scale}
              setScale={(scale) => updateView({ scale })}
              rangeLabel={t('economic.range_data')}
              hint={t('economic.range_hint')}
            />
          }
          headerClassName="sm:!flex-col 2xl:!flex-row"
          contentClassName="space-y-5"
        >
          {selectedChart}
        </SectionBlock>
        <details className="border-t border-border pt-5">
          <summary className="ui-focus-ring cursor-pointer text-sm font-semibold text-foreground">
            {t('economic.status_dashboard_title')}
          </summary>
          <div className="mt-5">
            <ReferenceStatusPanel
              inflationMeta={inflationMeta}
              nbpMeta={nbpMeta}
              isLoadingInflation={isLoadingInflation}
              isLoadingNbp={isLoadingNbp}
              labels={labels}
              language={language}
            />
          </div>
        </details>
        <details className="border-t border-border pt-5">
          <summary className="ui-focus-ring cursor-pointer text-sm font-semibold text-foreground">
            {t('economic.guide_dashboard_title')}
          </summary>
          <div className="mt-5">
            <UsageGuidePanel
              usageGuide={usageGuide}
              labels={{ howToUse: labels.howToUse, dataQuality: labels.dataQuality }}
            />
          </div>
        </details>
      </div>
    </CalculatorPageShell>
  );
}
