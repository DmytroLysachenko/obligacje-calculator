'use client';
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { Calendar, FileSpreadsheet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { buildLotsExportHeaders } from '@/shared/lib/export-headers';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
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
}
type SummaryStat = {
    label: string;
    value: string;
    helper: string;
};
const MAX_RECENT_LOTS = 12;
export const RegularInvestmentResultsSummary: React.FC<RegularInvestmentResultsSummaryProps> = ({ results, }) => {
    const { t, locale: language } = useAppI18n();
    const [yearRowLimit, setYearRowLimit] = useState<TableRowLimit>(12);
    const dateLocale = getDateFnsLocale(language);
    const formatCurrency = (value: number) => new Intl.NumberFormat(getIntlLocale(language), {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    }).format(value);
    const primaryStats: SummaryStat[] = [
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
    ];
    const supportingStats: SummaryStat[] = [
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
    ];
    const yearlyBuckets = useMemo<RegularInvestmentYearBucket[]>(() => buildRegularInvestmentYearBuckets(results.lots), [results.lots]);
    const visibleYearlyBuckets = useMemo(() => applyTableRowLimit(yearlyBuckets, yearRowLimit), [yearRowLimit, yearlyBuckets]);
    const recentLots = useMemo(() => buildRecentRegularInvestmentLots(results.lots, MAX_RECENT_LOTS), [results.lots]);
    const handleExport = () => {
        exportLotsCsv({
            lots: results.lots,
            headers: buildLotsExportHeaders(t),
            language,
            fileName: buildLotsCsvFilename(),
        });
    };
    return (<div className="space-y-6">
      <ResultSummaryHero
        eyebrow={t('regular_summary.plan_eyebrow')}
        value={formatCurrency(results.finalNominalValue)}
        description={t('regular_summary.hero_description')}
        narrative={t('regular_summary.hero_narrative')}
        actions={[
            {
                label: t('comparison.export'),
                icon: <FileSpreadsheet className="h-4 w-4"/>,
                onClick: handleExport,
            },
        ]}
      />

      <MetricStrip
        items={primaryStats}
        columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      />

      <MetricStrip
        items={supportingStats}
        columns="grid-cols-1 lg:grid-cols-2"
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4 border-t border-border py-5">
          <div className="flex flex-row items-start justify-between gap-4">
            <div>
              <h2 className="ui-card-title">
                {t('regular_summary.yearly_title')}
              </h2>
              <p className="ui-body text-muted-foreground">{t('regular_summary.yearly_description')}</p>
            </div>
            <Badge variant="outline" className="border-border bg-muted/35 text-xs font-semibold text-muted-foreground">
              {t('regular_summary.yearly_badge')}
            </Badge>
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

            <div className="hidden lg:block">
              <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-muted/35 hover:bg-muted/35">
                  <TableHead className="w-[16%]">{t('common.year')}</TableHead>
                  <TableHead className="w-[12%] text-right">{t('regular_summary.lots_label')}</TableHead>
                  <TableHead className="w-[18%] text-right">{t('regular_summary.invested')}</TableHead>
                  <TableHead className="w-[18%] text-right">{t('regular_summary.interest')}</TableHead>
                  <TableHead className="w-[18%] text-right">{t('bonds.tax')}</TableHead>
                  <TableHead className="w-[18%] text-right">{t('regular_summary.net_value')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleYearlyBuckets.map((bucket) => (
                  <TableRow
                    key={bucket.year}
                    className="border-b border-border transition-colors hover:bg-muted/35"
                  >
                    <TableCell className="font-medium">{bucket.year}</TableCell>
                    <TableCell className="text-right">{bucket.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bucket.invested)}</TableCell>
                    <TableCell className="text-right financial-positive">
                      {formatCurrency(bucket.interest)}
                    </TableCell>
                    <TableCell className="text-right text-[var(--finance-warning)]">
                      {formatCurrency(bucket.tax)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
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

        <section className="space-y-4 border-t border-border py-5">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 ui-card-title">
              <Calendar className="h-5 w-5"/>
              {t('regular_summary.recent_title')}
            </h2>
            <p className="ui-body text-muted-foreground">{t('regular_summary.recent_description')}</p>
            <div className="border-t border-border px-1 pt-3 text-sm leading-6 text-muted-foreground">
              {t('regular_summary.recent_note')}
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {recentLots.map(({ key, value: lot }) => (
                <div key={key} className="border-t border-border py-4">
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
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
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




