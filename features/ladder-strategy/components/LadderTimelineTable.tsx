'use client';

import { Button } from '@/components/ui/button';
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
import { LADDER_TABLE_FILTERS } from '@/features/ladder-strategy/constants/timeline';
import { LadderTimelineTableProps } from '@/features/ladder-strategy/types/timeline';
import { useAppI18n } from '@/i18n/client';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { TableDensityControls } from '@/shared/components/results/TableDensityControls';

import { MobileLadderValue } from './MobileLadderValue';

export function LadderTimelineTable({
  displayedRows,
  filteredRows,
  monthlyBuckets,
  filteredRowCount,
  clusteredThreshold,
  tableFilter,
  rowLimit,
  totalLots,
  onTableFilterChange,
  onRowLimitChange,
  formatCurrency,
}: LadderTimelineTableProps) {
  const { t } = useAppI18n();

  return (
    <>
      <ResponsiveTableSheet
        title={t('ladder_page.timeline.mobile_sheet_title')}
        description={t('ladder_page.timeline.mobile_sheet_description')}
        triggerLabel={t('ladder_page.timeline.mobile_sheet_trigger')}
        triggerCount={`${monthlyBuckets.length} ${t('ladder_page.timeline.mobile_sheet_count_suffix')}`}
      >
        {filteredRows.length === 0 ? (
          <div className="py-8 text-center" role="status">
            <p className="text-sm leading-6 text-muted-foreground">
              {t('ladder_page.timeline.empty_filter')}
            </p>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => onTableFilterChange('all')}
            >
              {t('ladder_page.timeline.show_all_months')}
            </Button>
          </div>
        ) : (
          <div className="ui-divider-group">
            {filteredRows.map((item) => (
              <article key={`mobile-${item.date}`} className="py-5" aria-label={item.displayDate}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.displayDate}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('ladder_page.timeline.lots_count')}: {item.count}
                    </p>
                  </div>
                  <p className="financial-number text-right text-sm font-semibold text-foreground">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MobileLadderValue
                    label={t('ladder_page.timeline.mobile_share_of_lots')}
                    value={
                      monthlyBuckets.length > 0
                        ? `${((item.count / totalLots) * 100).toFixed(1)}%`
                        : '-'
                    }
                  />
                  <MobileLadderValue
                    label={t('ladder_page.timeline.mobile_amount')}
                    value={formatCurrency(item.amount)}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </ResponsiveTableSheet>

      <div className="ui-table-frame hidden lg:block">
        <TableScrollHint>{t('ladder_page.timeline.mobile_sheet_description')}</TableScrollHint>
        <div className="ui-section-header border-b border-border px-4 py-3 text-sm text-muted-foreground">
          <p>{t('ladder_page.timeline.table_summary')}</p>
          <div className="flex flex-wrap items-center gap-2">
            {LADDER_TABLE_FILTERS.map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={tableFilter === filter ? 'default' : 'outline'}
                aria-pressed={tableFilter === filter}
                onClick={() => onTableFilterChange(filter)}
              >
                {t(`ladder_page.timeline.table_filters.${filter}`)}
              </Button>
            ))}
            {tableFilter === 'clustered' ? (
              <span className="text-xs text-muted-foreground">
                {t('ladder_page.timeline.cluster_threshold', { count: clusteredThreshold })}
              </span>
            ) : null}
            <p className="text-xs font-semibold text-muted-foreground">
              {filteredRowCount} {t('ladder_page.timeline.table_count_suffix')}
            </p>
          </div>
        </div>
        {filteredRowCount === 0 ? (
          <div className="px-4 py-8 text-center" role="status">
            <p className="text-sm leading-6 text-muted-foreground">
              {t('ladder_page.timeline.empty_filter')}
            </p>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-2"
              onClick={() => onTableFilterChange('all')}
            >
              {t('ladder_page.timeline.show_all_months')}
            </Button>
          </div>
        ) : (
          <Table
            className="w-full table-fixed text-sm tabular-nums"
            aria-label={t('ladder_page.timeline.table_summary')}
          >
            <TableCaption>{t('ladder_page.timeline.table_summary')}</TableCaption>
            <TableHeader>
              <TableRow className="h-12 hover:bg-transparent">
                <TableHead scope="col" className="sticky top-0 z-10 w-[34%] bg-background">
                  {t('ladder_page.timeline.table_month')}
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 w-[18%] bg-background text-right"
                >
                  {t('ladder_page.timeline.table_lots')}
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 w-[24%] bg-background text-right"
                >
                  {t('ladder_page.timeline.table_amount')}
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 w-[24%] bg-background text-right"
                >
                  {t('ladder_page.timeline.table_share')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((item) => (
                <TableRow
                  key={item.date}
                  className="h-14 border-b border-border transition-colors hover:bg-muted/25"
                >
                  <TableCell className="font-medium text-foreground">{item.displayDate}</TableCell>
                  <TableCell className="financial-number text-right text-foreground">
                    {item.count}
                  </TableCell>
                  <TableCell className="financial-number text-right font-semibold text-foreground">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="financial-number text-right text-muted-foreground">
                    {monthlyBuckets.length > 0
                      ? `${((item.count / totalLots) * 100).toFixed(1)}%`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {filteredRowCount > 0 ? (
          <TableDensityControls
            value={rowLimit}
            totalRows={filteredRowCount}
            visibleRows={displayedRows.length}
            onChange={onRowLimitChange}
            labels={{
              rowsShown: t('common.rows_shown'),
              rowsPerPage: t('common.rows_per_page'),
              all: t('common.all'),
            }}
            emptyMessage={t('common.no_results_found')}
            className="focus-within:ring-2 focus-within:ring-ring/45"
          />
        ) : null}
      </div>
    </>
  );
}
