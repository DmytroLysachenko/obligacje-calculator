'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LADDER_TABLE_FILTERS } from '@/features/ladder-strategy/constants/timeline';
import { LadderTimelineTableProps } from '@/features/ladder-strategy/types/timeline';
import { useAppI18n } from '@/i18n/client';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { TableDensityControls } from '@/shared/components/results/TableDensityControls';

import { MobileLadderValue } from './MobileLadderValue';

export function LadderTimelineTable({
  displayedRows,
  monthlyBuckets,
  filteredRowCount,
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
        {displayedRows.map((item) => (
          <div key={`mobile-${item.date}`} className="border-t border-border py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.displayDate}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('ladder_page.timeline.lots_count')}: {item.count}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(item.amount)}</p>
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
          </div>
        ))}
      </ResponsiveTableSheet>

      <div className="hidden border-y border-border lg:block">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-1 py-3 text-sm text-muted-foreground">
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
            <p className="text-xs font-semibold text-muted-foreground">
              {filteredRowCount} {t('ladder_page.timeline.table_count_suffix')}
            </p>
          </div>
        </div>
        <Table className="w-full table-fixed text-sm tabular-nums">
          <TableHeader>
            <TableRow className="h-12 hover:bg-transparent">
              <TableHead className="sticky top-0 z-10 w-[34%] bg-background">
                {t('ladder_page.timeline.table_month')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 w-[18%] bg-background text-right">
                {t('ladder_page.timeline.table_lots')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 w-[24%] bg-background text-right">
                {t('ladder_page.timeline.table_amount')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 w-[24%] bg-background text-right">
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
        <TableDensityControls
          value={rowLimit}
          totalRows={monthlyBuckets.length}
          visibleRows={displayedRows.length}
          onChange={onRowLimitChange}
          labels={{
            rowsShown: t('common.rows_shown'),
            rowsPerPage: t('common.rows_per_page'),
            all: t('common.all'),
          }}
        />
      </div>
    </>
  );
}
