'use client';
import React, { useCallback, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { Calendar, FileSpreadsheet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { buildLotsExportHeaders } from '@/shared/lib/export-headers';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { FinancialInsightStrip, FinancialInsightItem } from '@/shared/components/results/FinancialInsightStrip';
import { applyTableRowLimit, TableDensityControls, TableRowLimit } from '@/shared/components/results/TableDensityControls';
import { buildLotsCsvFilename, exportLotsCsv } from '@/shared/lib/retained-exports';
import { getDateFnsLocale, getIntlLocale } from '@/i18n/locale-utils';
import {
  buildRecentRegularInvestmentLots,
  buildRegularInvestmentYearBuckets,
  RegularInvestmentYearBucket,
} from '@/shared/lib/regular-investment-display';
interface RegularInvestmentResultsSummaryProps {
    results: RegularInvestmentResult;
    dataQualityFlags?: string[];
}
type SummaryStat = {
    label: string;
    value: string;
    helper: string;
};
const MAX_RECENT_LOTS = 12;
export const RegularInvestmentResultsSummary: React.FC<RegularInvestmentResultsSummaryProps> = ({ results, dataQualityFlags = [], }) => {
    const { t, locale: language } = useAppI18n();
    const [yearRowLimit, setYearRowLimit] = useState<TableRowLimit>(12);
    const dateLocale = getDateFnsLocale(language);
    const currencyFormatter = useMemo(() => new Intl.NumberFormat(getIntlLocale(language), {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    }), [language]);
    const formatCurrency = useCallback((value: number) => currencyFormatter.format(value), [currencyFormatter]);
    const primaryStats = useMemo<SummaryStat[]>(() => [
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
    ], [formatCurrency, results.finalNominalValue, results.finalRealValue, results.totalInvested, results.totalProfit, t]);
    const supportingStats = useMemo<SummaryStat[]>(() => [
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
    ], [formatCurrency, results.realAnnualizedReturn, results.totalTax, t]);
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
                value: dataQualityFlags.length > 0
                    ? t('financial_insights.data_quality_flags', { count: dataQualityFlags.length })
                    : t('financial_insights.data_quality_clean'),
                description: dataQualityFlags.length > 0
                    ? t('financial_insights.data_quality_description')
                    : t('financial_insights.data_quality_clean_description'),
                tone: dataQualityFlags.length > 0 ? 'warning' : 'success',
            },
        ];
    }, [dataQualityFlags.length, formatCurrency, results.finalNominalValue, results.finalRealValue, results.totalProfit, results.totalTax, t]);
    const yearlyBuckets = useMemo<RegularInvestmentYearBucket[]>(() => buildRegularInvestmentYearBuckets(results.lots), [results.lots]);
    const visibleYearlyBuckets = useMemo(() => applyTableRowLimit(yearlyBuckets, yearRowLimit), [yearRowLimit, yearlyBuckets]);
    const recentLots = useMemo(() => buildRecentRegularInvestmentLots(results.lots, MAX_RECENT_LOTS), [results.lots]);
    const handleExport = useCallback(() => {
        exportLotsCsv({
            lots: results.lots,
            headers: buildLotsExportHeaders(t),
            language,
            fileName: buildLotsCsvFilename(),
        });
    }, [language, results.lots, t]);
    const summaryActions = useMemo(() => [
        {
            label: t('comparison.export'),
            icon: <FileSpreadsheet className="h-4 w-4"/>,
            onClick: handleExport,
        },
    ], [handleExport, t]);
    return (<div className="space-y-8">
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
      />

      <MetricStrip
        items={supportingStats}
        columns="grid-cols-1 lg:grid-cols-2"
      />

      <FinancialInsightStrip
        title={t('financial_insights.title')}
        description={t('financial_insights.description')}
        items={financialInsightItems}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-shell space-y-5 p-5">
          <div className="flex flex-row items-start justify-between gap-4">
            <div>
              <h2 className="ui-card-title">
                {t('regular_summary.yearly_title')}
              </h2>
              <p className="ui-body text-muted-foreground">{t('regular_summary.yearly_description')}</p>
            </div>
            <span className="surface-chip shrink-0">
              {t('regular_summary.yearly_badge')}
            </span>
          </div>
          <div>
            <ResponsiveTableSheet
              title={t('regular_summary.yearly_title')}
              description={t('regular_summary.yearly_mobile_description')}
              triggerLabel={t('regular_summary.open_yearly_buckets')}
              triggerCount={t('regular_summary.yearly_trigger_count', {
                count: yearlyBuckets.length,
              })}
            >
              {visibleYearlyBuckets.map((bucket) => (
                <div
                  key={`mobile-${bucket.year}`}
                  className="border-t border-border py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{bucket.year}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('regular_summary.lots_label')}: {bucket.count}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(bucket.netValue)}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <MobileBucketValue
                      label={t('regular_summary.invested')}
                      value={formatCurrency(bucket.invested)}
                    />
                    <MobileBucketValue
                      label={t('regular_summary.interest')}
                      value={formatCurrency(bucket.interest)}
                    />
                    <MobileBucketValue
                      label={t('bonds.tax')}
                      value={formatCurrency(bucket.tax)}
                    />
                    <MobileBucketValue
                      label={t('regular_summary.net_value')}
                      value={formatCurrency(bucket.netValue)}
                    />
                  </div>
                </div>
              ))}
            </ResponsiveTableSheet>

            <div className="hidden overflow-hidden rounded-lg border border-border bg-card lg:block">
              <Table className="w-full table-fixed text-sm">
              <TableHeader>
                <TableRow className="h-12 hover:bg-transparent">
                  <TableHead className="sticky top-0 z-10 w-[16%] bg-background">{t('common.year')}</TableHead>
                  <TableHead className="sticky top-0 z-10 w-[12%] bg-background text-right">{t('regular_summary.lots_label')}</TableHead>
                  <TableHead className="sticky top-0 z-10 w-[18%] bg-background text-right">{t('regular_summary.invested')}</TableHead>
                  <TableHead className="sticky top-0 z-10 w-[18%] bg-background text-right">{t('regular_summary.interest')}</TableHead>
                  <TableHead className="sticky top-0 z-10 w-[18%] bg-background text-right">{t('bonds.tax')}</TableHead>
                  <TableHead className="sticky top-0 z-10 w-[18%] bg-background text-right">{t('regular_summary.net_value')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleYearlyBuckets.map((bucket) => (
                  <TableRow
                    key={bucket.year}
                    className="h-14 border-b border-border transition-colors hover:bg-muted/25"
                  >
                    <TableCell className="font-medium">{bucket.year}</TableCell>
                    <TableCell className="financial-number text-right">{bucket.count}</TableCell>
                    <TableCell className="financial-number text-right">{formatCurrency(bucket.invested)}</TableCell>
                    <TableCell className="financial-number text-right financial-positive">
                      {formatCurrency(bucket.interest)}
                    </TableCell>
                    <TableCell className="financial-number text-right text-[var(--finance-warning)]">
                      {formatCurrency(bucket.tax)}
                    </TableCell>
                    <TableCell className="financial-number text-right font-semibold">
                      {formatCurrency(bucket.netValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
              <TableDensityControls
                value={yearRowLimit}
                totalRows={yearlyBuckets.length}
                visibleRows={visibleYearlyBuckets.length}
                onChange={setYearRowLimit}
                labels={{
                  rowsShown: t('common.rows_shown'),
                  rowsPerPage: t('common.rows_per_page'),
                  all: t('common.all'),
                }}
              />
            </div>
          </div>
        </section>

        <section className="surface-shell space-y-5 p-5">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 ui-card-title">
              <Calendar className="h-5 w-5"/>
              {t('regular_summary.recent_title')}
            </h2>
            <p className="ui-body text-muted-foreground">{t('regular_summary.recent_description')}</p>
            <div className="rounded-md border border-border bg-muted/25 px-4 py-3 text-sm leading-6 text-muted-foreground">
              {t('regular_summary.recent_note')}
            </div>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              {recentLots.map(({ key, value: lot }) => (
                <div key={key} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {format(parseISO(lot.purchaseDate), 'MMMM yyyy', { locale: dateLocale })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('regular_summary.matures')}{' '}
                        {format(parseISO(lot.maturityDate), 'MMM yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(lot.netValue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('regular_summary.net_lot_value')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t('regular_summary.invested')}
                      </p>
                      <p className="mt-1 font-medium">{formatCurrency(lot.investedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t('regular_summary.interest')}
                      </p>
                      <p className="mt-1 font-medium financial-positive">
                        {formatCurrency(lot.accumulatedInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t('bonds.tax')}
                      </p>
                      <p className="mt-1 font-medium text-[var(--finance-warning)]">
                        {formatCurrency(lot.tax)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t('bonds.early_withdrawal_fee')}
                      </p>
                      <p className="mt-1 font-medium">
                        {formatCurrency(lot.earlyWithdrawalFee)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>);
};
function MobileBucketValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
    return (
    <div className="border-t border-border px-1 py-2 first:border-t-0">
      <p className="text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}




