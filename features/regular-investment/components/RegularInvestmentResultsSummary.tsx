'use client';
import { FileSpreadsheet } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

import {
  buildRegularInvestmentFinancialInsights,
  buildRegularInvestmentPrimaryStats,
  buildRegularInvestmentRecentLotItems,
  buildRegularInvestmentSupportingStats,
} from '@/features/regular-investment/lib/regular-investment-results-model';
import { RegularInvestmentResultsSummaryProps } from '@/features/regular-investment/types/results';
import { useAppI18n } from '@/i18n/client';
import { getDateFnsLocale, getIntlLocale } from '@/i18n/locale-utils';
import { FinancialInsightStrip } from '@/shared/components/results/FinancialInsightStrip';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { RecentLotList } from '@/shared/components/results/RecentLotList';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { buildLotsExportHeaders } from '@/shared/lib/export-headers';
import { buildRegularInvestmentYearBuckets } from '@/shared/lib/regular-investment-display';
import { buildLotsCsvFilename, exportLotsCsv } from '@/shared/lib/retained-exports';

import { RegularInvestmentYearlyBucketsSection } from './RegularInvestmentYearlyBucketsSection';

export const RegularInvestmentResultsSummary: React.FC<RegularInvestmentResultsSummaryProps> = ({
  results,
  dataQualityFlags = [],
}) => {
  const { t, locale: language } = useAppI18n();
  const dateLocale = getDateFnsLocale(language);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(getIntlLocale(language), {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
      }),
    [language],
  );
  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter],
  );
  const primaryStats = useMemo(
    () => buildRegularInvestmentPrimaryStats({ results, formatCurrency, t }),
    [formatCurrency, results, t],
  );
  const supportingStats = useMemo(
    () => buildRegularInvestmentSupportingStats({ results, formatCurrency, t }),
    [formatCurrency, results, t],
  );
  const financialInsightItems = useMemo(
    () =>
      buildRegularInvestmentFinancialInsights({
        results,
        dataQualityFlags,
        formatCurrency,
        t,
      }),
    [dataQualityFlags, formatCurrency, results, t],
  );
  const yearlyBuckets = useMemo(
    () => buildRegularInvestmentYearBuckets(results.lots),
    [results.lots],
  );
  const recentLotItems = useMemo(
    () =>
      buildRegularInvestmentRecentLotItems({
        results,
        dateLocale,
        formatCurrency,
        t,
      }),
    [dateLocale, formatCurrency, results, t],
  );
  const handleExport = useCallback(() => {
    exportLotsCsv({
      lots: results.lots,
      headers: buildLotsExportHeaders(t),
      language,
      fileName: buildLotsCsvFilename(),
    });
  }, [language, results.lots, t]);
  const summaryActions = useMemo(
    () => [
      {
        label: t('common.export_csv'),
        icon: <FileSpreadsheet className="h-4 w-4" />,
        onClick: handleExport,
        kind: 'csv' as const,
      },
    ],
    [handleExport, t],
  );
  return (
    <div className="ui-compact-flow">
      <ResultSummaryHero
        eyebrow={t('regular_summary.plan_eyebrow')}
        value={formatCurrency(results.finalNominalValue)}
        description={t('regular_summary.hero_description')}
        narrative={t('regular_summary.hero_narrative')}
        actions={summaryActions}
      />

      <MetricStrip
        items={primaryStats}
        columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        className="ui-result-panel"
      />

      <MetricStrip
        items={supportingStats}
        columns="grid-cols-1 lg:grid-cols-2"
        className="ui-result-panel"
      />

      <section className="ui-result-panel">
        <FinancialInsightStrip
          title={t('financial_insights.title')}
          description={t('financial_insights.description')}
          items={financialInsightItems}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.75fr)] xl:items-start">
        <RegularInvestmentYearlyBucketsSection
          yearlyBuckets={yearlyBuckets}
          formatCurrency={formatCurrency}
        />

        <RecentLotList
          title={t('regular_summary.recent_title')}
          description={t('regular_summary.recent_description')}
          note={t('regular_summary.recent_note')}
          items={recentLotItems}
          compact
          className="xl:max-h-[42rem] xl:overflow-y-auto xl:pr-2"
        />
      </div>
    </div>
  );
};
