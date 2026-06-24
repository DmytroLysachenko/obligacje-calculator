'use client';

import { Scale } from 'lucide-react';
import React from 'react';

import {
  ComparisonTablePaginationControls,
  ComparisonTableStat,
} from '@/features/comparison-engine/components/comparison-table/ComparisonTableParts';
import { ComparisonTableSummaryGrid } from '@/features/comparison-engine/components/comparison-table/ComparisonTableSummaryGrid';
import { ComparisonTableTimelineRows } from '@/features/comparison-engine/components/comparison-table/ComparisonTableTimelineRows';
import { COMPARISON_TABLE_GRANULARITY_OPTIONS } from '@/features/comparison-engine/constants/comparison-table';
import {
  buildComparisonAlignedTableRows,
  buildComparisonSummaryRows,
  ComparisonTableGranularity,
  getComparisonTablePageCount,
  getComparisonTablePageRows,
  getComparisonVisibleRangeLabel,
} from '@/features/comparison-engine/lib/comparison-table-model';
import { ComparisonTableProps } from '@/features/comparison-engine/types/comparison-table';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { TableRowLimit } from '@/shared/components/results/TableDensityControls';

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  resultsA,
  resultsB,
  purchaseDate,
  bondTypeA,
  bondTypeB,
  formatCurrency,
}) => {
  const { t, locale: language } = useAppI18n();
  const [granularity, setGranularity] = React.useState<ComparisonTableGranularity>('yearly');
  const [rowLimit, setRowLimit] = React.useState<TableRowLimit>(12);
  const [currentPage, setCurrentPage] = React.useState(1);
  const higherColumnLabel = t('comparison.table_ahead_in_row');
  const higherBadgeSuffix = t('comparison.table_ahead_badge_suffix');
  const tieLabel = t('comparison.table_tie');
  const resultAValue = resultsA.netPayoutValue;
  const resultBValue = resultsB.netPayoutValue;
  const firstLead =
    resultAValue === resultBValue ? tieLabel : resultAValue > resultBValue ? bondTypeA : bondTypeB;

  const tableRows = React.useMemo(
    () =>
      buildComparisonAlignedTableRows({
        resultsA,
        resultsB,
        purchaseDate,
        granularity,
        language,
        startLabel: t('comparison.start'),
      }),
    [granularity, language, purchaseDate, resultsA, resultsB, t],
  );

  const totalPages = getComparisonTablePageCount(tableRows.length, rowLimit);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [granularity, rowLimit, resultsA, resultsB]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const displayedRows = React.useMemo(
    () =>
      getComparisonTablePageRows({
        rows: tableRows,
        rowLimit,
        page: currentPage,
      }),
    [currentPage, rowLimit, tableRows],
  );
  const visibleRangeLabel = getComparisonVisibleRangeLabel({
    page: currentPage,
    rowLimit,
    visibleRows: displayedRows.length,
    totalRows: tableRows.length,
  });
  const summaryRows = buildComparisonSummaryRows({
    resultsA,
    resultsB,
    labels: {
      netPayout: t('bonds.net_payout'),
      realValue: t('bonds.real_value_inflation'),
      netProfit: t('common.net_profit'),
      taxPaid: t('comparison.table_tax_paid'),
    },
  });

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="ui-section-title flex items-center gap-2">
          <Scale className="h-5 w-5 text-foreground" />
          {t('comparison.table_title')}
        </h2>
        <p className="ui-body max-w-3xl text-muted-foreground">{t('comparison.table_desc')}</p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-0 border-b border-dashed px-2 py-3 md:grid-cols-3 md:px-6">
          <ComparisonTableStat
            label={t('comparison.table_timeline_rows')}
            value={visibleRangeLabel}
          />
          <ComparisonTableStat label={t('comparison.table_higher_payout')} value={firstLead} />
          <ComparisonTableStat
            label={t('comparison.table_compared_pair')}
            value={`${bondTypeA} / ${bondTypeB}`}
          />
        </div>

        <ComparisonTableSummaryGrid
          rows={summaryRows}
          bondTypeA={bondTypeA}
          bondTypeB={bondTypeB}
          tieLabel={tieLabel}
          formatCurrency={formatCurrency}
        />

        <div className="flex flex-col gap-3 border-b border-dashed px-6 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {COMPARISON_TABLE_GRANULARITY_OPTIONS.map((step) => (
              <button
                key={step}
                type="button"
                aria-pressed={granularity === step}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                  granularity === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setGranularity(step)}
              >
                {t(`bonds.chart.periods.${step}`)}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            {t('common.rows_shown')}: {visibleRangeLabel}
          </p>
        </div>

        <div className="px-6">
          <ComparisonTableTimelineRows
            rows={displayedRows}
            bondTypeA={bondTypeA}
            bondTypeB={bondTypeB}
            higherColumnLabel={higherColumnLabel}
            higherBadgeSuffix={higherBadgeSuffix}
            tieLabel={tieLabel}
            formatCurrency={formatCurrency}
            labels={{
              mobileTitle: t('comparison.table_mobile_title'),
              mobileDescription: t('comparison.table_mobile_desc'),
              mobileTrigger: t('comparison.table_mobile_trigger'),
              mobileCount: t('comparison.table_mobile_count', { count: tableRows.length }),
              desktopNote: t('comparison.table_desktop_note'),
              year: t('common.year'),
              nominal: t('common.nominal_value'),
              real: t('common.real_value'),
              profit: t('common.net_profit'),
            }}
          />

          <ComparisonTablePaginationControls
            page={currentPage}
            totalPages={totalPages}
            rowLimit={rowLimit}
            totalRows={tableRows.length}
            visibleRangeLabel={visibleRangeLabel}
            onPageChange={setCurrentPage}
            onRowLimitChange={setRowLimit}
            labels={{
              rowsShown: t('common.rows_shown'),
              rowsPerPage: t('common.rows_per_page'),
              all: t('common.all'),
              previous: t('common.previous'),
              next: t('common.next'),
              page: t('common.page'),
            }}
          />
        </div>

        <div className="border-t border-dashed border-border px-6 py-4 text-sm leading-6 text-muted-foreground">
          {t('comparison.table_footer_note')}
        </div>
      </div>
    </section>
  );
};
