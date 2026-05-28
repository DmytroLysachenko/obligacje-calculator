'use client';
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { Calendar, FileSpreadsheet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { buildLotsExportHeaders } from '@/shared/lib/export-headers';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
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
      <ResultSummaryHero eyebrow={t('regular_summary.plan_eyebrow')} value={formatCurrency(results.finalNominalValue)} description={t('regular_summary.hero_description')} narrative={t('regular_summary.hero_narrative')} actions={[
            {
                label: t('comparison.export'),
                icon: <FileSpreadsheet className="h-4 w-4"/>,
                onClick: handleExport,
            },
        ]}/>

      <MetricStrip items={primaryStats} columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"/>

      <MetricStrip items={supportingStats} columns="grid-cols-1 lg:grid-cols-2"/>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg font-black text-slate-900">
                {t('regular_summary.yearly_title')}
              </CardTitle>
              <CardDescription>{t('regular_summary.yearly_description')}</CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
              {t('regular_summary.yearly_badge')}
            </Badge>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ResponsiveTableSheet title={t('regular_summary.yearly_title')} description={t('regular_summary.yearly_mobile_description')} triggerLabel={t('regular_summary.open_yearly_buckets')} triggerCount={t('regular_summary.yearly_trigger_count', { count: yearlyBuckets.length })}>
              {yearlyBuckets.map((bucket) => (<div key={`mobile-${bucket.year}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{bucket.year}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t('regular_summary.lots_label')}: {bucket.count}
                      </p>
                    </div>
                    <p className="text-sm font-black text-slate-950">{formatCurrency(bucket.netValue)}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <MobileBucketValue label={t('regular_summary.invested')} value={formatCurrency(bucket.invested)}/>
                    <MobileBucketValue label={t('regular_summary.interest')} value={formatCurrency(bucket.interest)}/>
                    <MobileBucketValue label={t('bonds.tax')} value={formatCurrency(bucket.tax)}/>
                    <MobileBucketValue label={t('regular_summary.net_value')} value={formatCurrency(bucket.netValue)}/>
                  </div>
                </div>))}
            </ResponsiveTableSheet>

            <div className="hidden lg:block">
              <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="w-[16%]">{t('common.year')}</TableHead>
                  <TableHead className="w-[12%] text-right">{t('regular_summary.lots_label')}</TableHead>
                  <TableHead className="w-[18%] text-right">{t('regular_summary.invested')}</TableHead>
                  <TableHead className="w-[18%] text-right">{t('regular_summary.interest')}</TableHead>
                  <TableHead className="w-[18%] text-right">{t('bonds.tax')}</TableHead>
                  <TableHead className="w-[18%] text-right">{t('regular_summary.net_value')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearlyBuckets.map((bucket) => (<TableRow key={bucket.year} className="border-b border-slate-100 transition-colors odd:bg-slate-50/30 hover:bg-slate-50/70">
                    <TableCell className="font-medium">{bucket.year}</TableCell>
                    <TableCell className="text-right">{bucket.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bucket.invested)}</TableCell>
                    <TableCell className="text-right text-emerald-700">
                      {formatCurrency(bucket.interest)}
                    </TableCell>
                    <TableCell className="text-right text-amber-700">
                      {formatCurrency(bucket.tax)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(bucket.netValue)}
                    </TableCell>
                  </TableRow>))}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Calendar className="h-5 w-5"/>
              {t('regular_summary.recent_title')}
            </CardTitle>
            <CardDescription>{t('regular_summary.recent_description')}</CardDescription>
            <div className="border-t border-dashed border-slate-200 px-1 pt-3 text-sm leading-6 text-slate-600">
              {t('regular_summary.recent_note')}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {recentLots.map(({ key, value: lot }) => (<div key={key} className="rounded-[1.5rem] border border-slate-200 p-4">
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
                      <p className="mt-1 font-medium text-emerald-700">
                        {formatCurrency(lot.accumulatedInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t('bonds.tax')}
                      </p>
                      <p className="mt-1 font-medium text-amber-700">
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
                </div>))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
};
function MobileBucketValue({ label, value, }: {
    label: string;
    value: string;
}) {
    return (<div className="border-t border-dashed border-slate-200 px-1 py-2 first:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>);
}




