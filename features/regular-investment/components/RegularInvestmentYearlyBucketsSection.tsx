import React, { useMemo, useState } from 'react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollHint,
} from '@/components/ui/table';
import { useAppI18n } from '@/i18n/client';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import {
  applyTableRowLimit,
  TableDensityControls,
  TableRowLimit,
} from '@/shared/components/results/TableDensityControls';
import { RegularInvestmentYearBucket } from '@/shared/lib/regular-investment-display';

interface RegularInvestmentYearlyBucketsSectionProps {
  yearlyBuckets: RegularInvestmentYearBucket[];
  formatCurrency: (value: number) => string;
}

export function RegularInvestmentYearlyBucketsSection({
  yearlyBuckets,
  formatCurrency,
}: RegularInvestmentYearlyBucketsSectionProps) {
  const { t } = useAppI18n();
  const [yearRowLimit, setYearRowLimit] = useState<TableRowLimit>(12);
  const visibleYearlyBuckets = useMemo(
    () => applyTableRowLimit(yearlyBuckets, yearRowLimit),
    [yearRowLimit, yearlyBuckets],
  );

  return (
    <SectionBlock
      title={t('regular_summary.yearly_title')}
      description={t('regular_summary.yearly_description')}
      action={
        <span className="ui-meta shrink-0 border-l-2 border-border px-3 py-1 font-semibold">
          {t('regular_summary.yearly_badge')}
        </span>
      }
      className="ui-result-panel"
      contentClassName="space-y-4"
    >
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
            <article
              key={`mobile-${bucket.year}`}
              className="border-t border-border py-5"
              aria-label={String(bucket.year)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{bucket.year}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('regular_summary.lots_label')}: {bucket.count}
                  </p>
                </div>
                <p className="financial-number text-right text-sm font-semibold text-foreground">
                  {formatCurrency(bucket.netValue)}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <MobileBucketValue
                  label={t('regular_summary.invested')}
                  value={formatCurrency(bucket.invested)}
                />
                <MobileBucketValue
                  label={t('regular_summary.interest')}
                  value={formatCurrency(bucket.interest)}
                />
                <MobileBucketValue label={t('bonds.tax')} value={formatCurrency(bucket.tax)} />
                <MobileBucketValue
                  label={t('regular_summary.net_value')}
                  value={formatCurrency(bucket.netValue)}
                />
              </div>
            </article>
          ))}
        </ResponsiveTableSheet>

        <div className="ui-table-frame hidden lg:block">
          <TableScrollHint>{t('regular_summary.yearly_mobile_description')}</TableScrollHint>
          <Table
            className="w-full table-fixed text-sm tabular-nums"
            aria-label={t('regular_summary.yearly_title')}
          >
            <TableCaption>{t('regular_summary.yearly_description')}</TableCaption>
            <TableHeader>
              <TableRow className="h-12 hover:bg-transparent">
                <TableHead scope="col" className="sticky top-0 z-10 w-[16%] bg-background">
                  {t('common.year')}
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 w-[12%] bg-background text-right"
                >
                  {t('regular_summary.lots_label')}
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 w-[18%] bg-background text-right"
                >
                  {t('regular_summary.invested')}
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 w-[18%] bg-background text-right"
                >
                  {t('regular_summary.interest')}
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 w-[18%] bg-background text-right"
                >
                  {t('bonds.tax')}
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 w-[18%] bg-background text-right"
                >
                  {t('regular_summary.net_value')}
                </TableHead>
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
                  <TableCell className="financial-number text-right">
                    {formatCurrency(bucket.invested)}
                  </TableCell>
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
            className="px-1 focus-within:ring-2 focus-within:ring-ring/45"
          />
        </div>
      </div>
    </SectionBlock>
  );
}

function MobileBucketValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-metric-item px-1 py-2 first:border-t-0">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
