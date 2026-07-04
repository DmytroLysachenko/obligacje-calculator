import type { BondRateContextCopy } from '@/shared/lib/bond-rate-context';

type TranslateFn = (key: string) => string;

export type EconomicPageLabels = ReturnType<typeof buildEconomicPageLabels>;

export function buildEconomicPageLabels(t: TranslateFn) {
  return {
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
}

export function buildEconomicUsageGuide(t: TranslateFn, floatingRateContext: BondRateContextCopy) {
  return [
    t('economic.usage_guide_1'),
    t('economic.usage_guide_2'),
    floatingRateContext.narrative,
    t('economic.usage_guide_4'),
  ];
}

export function buildEconomicHeroMetrics(labels: EconomicPageLabels) {
  return [
    { label: labels.series, value: '2' },
    { label: labels.purpose, value: labels.context },
    { label: labels.mode, value: labels.reference },
    { label: labels.goal, value: labels.readableContext },
  ];
}
