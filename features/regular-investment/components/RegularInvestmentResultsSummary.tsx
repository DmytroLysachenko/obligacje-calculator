'use client';
import { format, parseISO } from 'date-fns';
import { FileSpreadsheet } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

import { MAX_RECENT_REGULAR_INVESTMENT_LOTS } from '@/features/regular-investment/constants/results';
import {
  RegularInvestmentResultsSummaryProps,
  RegularInvestmentSummaryStat,
} from '@/features/regular-investment/types/results';
import { useAppI18n } from '@/i18n/client';
import { getDateFnsLocale, getIntlLocale } from '@/i18n/locale-utils';
import {
  FinancialInsightItem,
  FinancialInsightStrip,
} from '@/shared/components/results/FinancialInsightStrip';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { RecentLotDisplayItem, RecentLotList } from '@/shared/components/results/RecentLotList';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { buildLotsExportHeaders } from '@/shared/lib/export-headers';
import {
  buildRecentRegularInvestmentLots,
  buildRegularInvestmentYearBuckets,
} from '@/shared/lib/regular-investment-display';
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
  const primaryStats = useMemo<RegularInvestmentSummaryStat[]>(
    () => [
      {
        label: t('bonds.total_invested'),
        value: formatCurrency(results.totalInvested),
        helper: t('regular_summary.total_invested_helper'),
      },
      {
        label: t('bonds.final_nominal_value'),
        value: formatCurrency(results.finalNominalValue),
        helper: t('regular_summary.final_nominal_helper'),
      },
      {
        label: t('bonds.total_net_profit'),
        value: formatCurrency(results.totalProfit),
        helper: t('regular_summary.net_profit_helper'),
      },
      {
        label: t('bonds.real_value_inflation'),
        value: formatCurrency(results.finalRealValue),
        helper: t('regular_summary.real_value_helper'),
      },
    ],
    [
      formatCurrency,
      results.finalNominalValue,
      results.finalRealValue,
      results.totalInvested,
      results.totalProfit,
      t,
    ],
  );
  const supportingStats = useMemo<RegularInvestmentSummaryStat[]>(
    () => [
      {
        label: t('bonds.real_cagr'),
        value: `${results.realAnnualizedReturn.toFixed(2)}%`,
        helper: t('regular_summary.real_cagr_helper'),
      },
      {
        label: t('bonds.tax'),
        value: formatCurrency(results.totalTax),
        helper: t('regular_summary.tax_helper'),
      },
    ],
    [formatCurrency, results.realAnnualizedReturn, results.totalTax, t],
  );
  const financialInsightItems = useMemo<FinancialInsightItem[]>(() => {
    const grossProfit = Math.max(0, results.totalProfit + results.totalTax);
    const realValueGap = Math.max(0, results.finalNominalValue - results.finalRealValue);
    return [
      {
        label: t('financial_insights.tax_impact_label'),
        value: formatCurrency(results.totalTax),
        description: t('financial_insights.tax_impact_description', {
          grossProfit: formatCurrency(grossProfit),
          netProfit: formatCurrency(results.totalProfit),
        }),
        tone: results.totalTax > 0 ? 'warning' : 'success',
      },
      {
        label: t('financial_insights.real_value_label'),
        value: formatCurrency(results.finalRealValue),
        description: t('financial_insights.real_value_description', {
          nominalValue: formatCurrency(results.finalNominalValue),
          gap: formatCurrency(realValueGap),
        }),
        tone: realValueGap > 0 ? 'warning' : 'success',
      },
      {
        label: t('financial_insights.data_quality_label'),
        value:
          dataQualityFlags.length > 0
            ? t('financial_insights.data_quality_flags', { count: dataQualityFlags.length })
            : t('financial_insights.data_quality_clean'),
        description:
          dataQualityFlags.length > 0
            ? t('financial_insights.data_quality_description')
            : t('financial_insights.data_quality_clean_description'),
        tone: dataQualityFlags.length > 0 ? 'warning' : 'success',
      },
    ];
  }, [
    dataQualityFlags.length,
    formatCurrency,
    results.finalNominalValue,
    results.finalRealValue,
    results.totalProfit,
    results.totalTax,
    t,
  ]);
  const yearlyBuckets = useMemo(
    () => buildRegularInvestmentYearBuckets(results.lots),
    [results.lots],
  );
  const recentLots = useMemo(
    () => buildRecentRegularInvestmentLots(results.lots, MAX_RECENT_REGULAR_INVESTMENT_LOTS),
    [results.lots],
  );
  const recentLotItems = useMemo<RecentLotDisplayItem[]>(
    () =>
      recentLots.map(({ key, value: lot }) => ({
        key,
        title: format(parseISO(lot.purchaseDate), 'MMMM yyyy', { locale: dateLocale }),
        subtitle: `${t('regular_summary.matures')} ${format(parseISO(lot.maturityDate), 'MMM yyyy', { locale: dateLocale })}`,
        value: formatCurrency(lot.netValue),
        valueLabel: t('regular_summary.net_lot_value'),
        details: [
          {
            label: t('regular_summary.invested'),
            value: formatCurrency(lot.investedAmount),
          },
          {
            label: t('regular_summary.interest'),
            value: formatCurrency(lot.accumulatedInterest),
            tone: 'positive',
          },
          {
            label: t('bonds.tax'),
            value: formatCurrency(lot.tax),
            tone: 'warning',
          },
          {
            label: t('bonds.early_withdrawal_fee'),
            value: formatCurrency(lot.earlyWithdrawalFee),
          },
        ],
      })),
    [dateLocale, formatCurrency, recentLots, t],
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
    <div className="space-y-8">
      <ResultSummaryHero
        eyebrow={t('regular_summary.plan_eyebrow')}
        value={formatCurrency(results.finalNominalValue)}
        description={t('regular_summary.hero_description')}
        narrative={t('regular_summary.hero_narrative')}
        actions={summaryActions}
      />

      <MetricStrip items={primaryStats} columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4" />

      <MetricStrip items={supportingStats} columns="grid-cols-1 lg:grid-cols-2" />

      <FinancialInsightStrip
        title={t('financial_insights.title')}
        description={t('financial_insights.description')}
        items={financialInsightItems}
      />

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
