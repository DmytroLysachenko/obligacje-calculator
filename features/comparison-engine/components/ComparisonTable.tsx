'use client';

import React from 'react';
import { addMonths, compareAsc, differenceInMonths, format, parseISO } from 'date-fns';
import { Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CalculationResult, ChartStep } from '@/features/bond-core/types';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import {
  TableRowLimit,
  tableRowLimitOptions,
} from '@/shared/components/results/TableDensityControls';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import {
  AppLanguage,
  getRateSourceDisplayLabel,
  getSimulationEventDisplayLabel,
} from '@/shared/lib/bond-display';
import { SimulationEventType } from '@/features/bond-core/types/simulation';

interface ComparisonTableProps {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  purchaseDate: string;
  bondTypeA: string;
  bondTypeB: string;
  formatCurrency: (val: number) => string;
}

function ComparisonTableStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="px-4 py-3 md:border-r md:border-border last:md:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

type ComparisonTableGranularity = Exclude<ChartStep, 'daily'>;

export type ComparisonAlignedTableRow = {
  key: string;
  label: string;
  dateLabel: string;
  scenarioA: ComparisonScenarioSnapshot;
  scenarioB: ComparisonScenarioSnapshot;
  gap: number;
  leader: 'A' | 'B' | 'tie';
};

function interpolateValue(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

type ComparisonScenarioSnapshot = {
  nominalValue: number;
  realValue: number;
  netProfit: number;
  taxDeducted: number;
  interestRate?: number;
  rateSourceLabel?: string;
  eventLabels: string[];
};

function interpolateTimelineNumber(
  previousValue: number | undefined,
  nextValue: number | undefined,
  fallback: number,
  progress: number,
) {
  if (
    typeof previousValue !== 'number'
    || typeof nextValue !== 'number'
    || !Number.isFinite(previousValue)
    || !Number.isFinite(nextValue)
  ) {
    return fallback;
  }

  return interpolateValue(previousValue, nextValue, progress);
}

export function getComparisonTablePageCount(totalRows: number, rowLimit: TableRowLimit) {
  if (rowLimit === 'all') {
    return 1;
  }

  return Math.max(1, Math.ceil(totalRows / rowLimit));
}

export function getComparisonTablePageRows<T>({
  rows,
  rowLimit,
  page,
}: {
  rows: T[];
  rowLimit: TableRowLimit;
  page: number;
}) {
  if (rowLimit === 'all') {
    return rows;
  }

  const safePage = Math.max(1, Math.min(page, getComparisonTablePageCount(rows.length, rowLimit)));
  const startIndex = (safePage - 1) * rowLimit;

  return rows.slice(startIndex, startIndex + rowLimit);
}

function getComparisonVisibleRangeLabel({
  page,
  rowLimit,
  visibleRows,
  totalRows,
}: {
  page: number;
  rowLimit: TableRowLimit;
  visibleRows: number;
  totalRows: number;
}) {
  if (totalRows === 0) {
    return '0 / 0';
  }

  if (rowLimit === 'all') {
    return `${totalRows} / ${totalRows}`;
  }

  const start = ((page - 1) * rowLimit) + 1;
  const end = Math.min(start + visibleRows - 1, totalRows);

  return `${start}-${end} / ${totalRows}`;
}

function projectTimelineSnapshot(
  timeline: CalculationResult['timeline'],
  date: Date,
  initialInvestment: number,
  language: AppLanguage,
) {
  let currentSnapshot: ComparisonScenarioSnapshot = {
    nominalValue: initialInvestment,
    realValue: initialInvestment,
    netProfit: 0,
    taxDeducted: 0,
    eventLabels: [],
  };
  let index = 0;

  while (
    index < timeline.length
    && compareAsc(parseISO(timeline[index].cycleEndDate), date) <= 0
  ) {
    const point = timeline[index];
    currentSnapshot = {
      nominalValue: point.totalValue,
      realValue: point.realValue ?? point.totalValue,
      netProfit: point.netProfit ?? point.totalValue - initialInvestment,
      taxDeducted: point.taxDeducted ?? 0,
      interestRate: point.interestRate,
      rateSourceLabel: point.rateSource
        ? getRateSourceDisplayLabel(point.rateSource, language)
        : undefined,
      eventLabels: point.events?.map((event) =>
        getSimulationEventDisplayLabel(event.type as SimulationEventType, language),
      ) ?? [],
    };
    index += 1;
  }

  const previousPoint = timeline[Math.max(0, index - 1)];
  const nextPoint = timeline[index];

  if (!previousPoint || !nextPoint) {
    return currentSnapshot;
  }

  const previousDate = parseISO(previousPoint.cycleEndDate);
  const nextDate = parseISO(nextPoint.cycleEndDate);
  const previousTime = previousDate.getTime();
  const nextTime = nextDate.getTime();
  const currentTime = date.getTime();

  if (nextTime <= previousTime || currentTime <= previousTime || currentTime >= nextTime) {
    return currentSnapshot;
  }

  const progress = (currentTime - previousTime) / (nextTime - previousTime);

  return {
    nominalValue: interpolateTimelineNumber(
      previousPoint.totalValue,
      nextPoint.totalValue,
      currentSnapshot.nominalValue,
      progress,
    ),
    realValue: interpolateTimelineNumber(
      previousPoint.realValue,
      nextPoint.realValue,
      currentSnapshot.realValue,
      progress,
    ),
    netProfit: interpolateTimelineNumber(
      previousPoint.netProfit,
      nextPoint.netProfit,
      currentSnapshot.netProfit,
      progress,
    ),
    taxDeducted: interpolateTimelineNumber(
      previousPoint.taxDeducted,
      nextPoint.taxDeducted,
      currentSnapshot.taxDeducted,
      progress,
    ),
    interestRate: currentSnapshot.interestRate,
    rateSourceLabel: currentSnapshot.rateSourceLabel,
    eventLabels: currentSnapshot.eventLabels,
  };
}

export function buildComparisonAlignedTableRows({
  resultsA,
  resultsB,
  purchaseDate,
  granularity,
  language,
  startLabel = 'Start',
}: {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  purchaseDate: string;
  granularity: ComparisonTableGranularity;
  language: 'pl' | 'en';
  startLabel?: string;
}): ComparisonAlignedTableRow[] {
  const firstA = resultsA.timeline[0];
  const firstB = resultsB.timeline[0];
  const lastA = resultsA.timeline.at(-1);
  const lastB = resultsB.timeline.at(-1);

  if (!firstA || !firstB || !lastA || !lastB) {
    return [];
  }

  const startDate = parseISO(purchaseDate);
  const endDate = compareAsc(parseISO(lastA.cycleEndDate), parseISO(lastB.cycleEndDate)) >= 0
    ? parseISO(lastA.cycleEndDate)
    : parseISO(lastB.cycleEndDate);
  const dates: Date[] = [];

  for (
    let cursor = startDate;
    compareAsc(cursor, endDate) <= 0;
    cursor = addMonths(cursor, 1)
  ) {
    dates.push(cursor);
  }

  if (dates.length === 0 || dates.at(-1)?.getTime() !== endDate.getTime()) {
    dates.push(endDate);
  }

  const rawRows = dates.map((date, index) => {
    const scenarioA = projectTimelineSnapshot(resultsA.timeline, date, resultsA.initialInvestment, language);
    const scenarioB = projectTimelineSnapshot(resultsB.timeline, date, resultsB.initialInvestment, language);
    const gap = scenarioB.nominalValue - scenarioA.nominalValue;

    return {
      key: date.toISOString(),
      label: index === 0
        ? startLabel
        : format(date, 'MMM yyyy', { locale: getDateFnsLocale(language) }),
      dateLabel: format(date, 'yyyy-MM-dd'),
      scenarioA,
      scenarioB,
      gap,
      leader: gap === 0 ? 'tie' : gap > 0 ? 'B' : 'A',
    } satisfies ComparisonAlignedTableRow;
  });

  if (granularity === 'monthly') {
    return rawRows;
  }

  const groups = new Map<string, ComparisonAlignedTableRow[]>();

  for (const row of rawRows) {
    const date = parseISO(row.key);
    const monthsFromStart = Math.max(0, differenceInMonths(date, startDate));
    const groupKey = granularity === 'quarterly'
      ? `q-${Math.floor(monthsFromStart / 3)}`
      : `y-${Math.floor(monthsFromStart / 12)}`;
    const bucket = groups.get(groupKey) ?? [];
    bucket.push(row);
    groups.set(groupKey, bucket);
  }

  const aggregated = Array.from(groups.values()).map((bucket) => bucket[0]);
  const terminal = rawRows.at(-1);

  if (terminal && aggregated.at(-1)?.key !== terminal.key) {
    aggregated.push(terminal);
  }

  return aggregated;
}

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
    resultAValue === resultBValue
      ? tieLabel
      : resultAValue > resultBValue
        ? bondTypeA
        : bondTypeB;

  const tableRows = React.useMemo(
    () => buildComparisonAlignedTableRows({
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

  const displayedRows = React.useMemo(() => getComparisonTablePageRows({
    rows: tableRows,
    rowLimit,
    page: currentPage,
  }), [currentPage, rowLimit, tableRows]);
  const visibleRangeLabel = getComparisonVisibleRangeLabel({
    page: currentPage,
    rowLimit,
    visibleRows: displayedRows.length,
    totalRows: tableRows.length,
  });
  const summaryRows = [
    {
      label: t('bonds.net_payout'),
      a: resultAValue,
      b: resultBValue,
    },
    {
      label: t('bonds.real_value_inflation'),
      a: resultsA.finalRealValue,
      b: resultsB.finalRealValue,
    },
    {
      label: t('common.net_profit'),
      a: resultsA.totalProfit,
      b: resultsB.totalProfit,
    },
    {
      label: t('comparison.table_tax_paid'),
      a: resultsA.totalTax,
      b: resultsB.totalTax,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="ui-section-title flex items-center gap-2">
          <Scale className="h-5 w-5 text-foreground" />
          {t('comparison.table_title')}
        </h2>
        <p className="ui-body max-w-3xl text-muted-foreground">
          {t('comparison.table_desc')}
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-0 border-b border-dashed px-2 py-3 md:grid-cols-3 md:px-6">
          <ComparisonTableStat
            label={t('comparison.table_timeline_rows')}
            value={visibleRangeLabel}
          />
          <ComparisonTableStat
            label={t('comparison.table_higher_payout')}
            value={firstLead}
          />
          <ComparisonTableStat
            label={t('comparison.table_compared_pair')}
            value={`${bondTypeA} / ${bondTypeB}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-dashed px-6 py-5 md:grid-cols-3">
          {summaryRows.map((row) => {
            const higherScenario = row.a === row.b ? null : row.a > row.b ? 'A' : 'B';

            return (
              <div key={row.label} className="bg-muted/30 px-4 py-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  {row.label}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">
                      {bondTypeA}: <span className="font-mono">{formatCurrency(row.a)}</span>
                    </p>
                    <p className="font-semibold text-foreground">
                      {bondTypeB}: <span className="font-mono">{formatCurrency(row.b)}</span>
                    </p>
                  </div>
                  {higherScenario ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        'border px-3 py-1 text-xs font-semibold',
                        higherScenario === 'A'
                          ? 'border-border bg-card text-foreground'
                          : 'border-success/30 bg-success/10 text-success',
                      )}
                    >
                      {higherScenario === 'A' ? bondTypeA : bondTypeB}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-border bg-muted text-xs font-semibold text-muted-foreground"
                    >
                      {tieLabel}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-b border-dashed px-6 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(['monthly', 'quarterly', 'yearly'] as ComparisonTableGranularity[]).map((step) => (
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
          <ResponsiveTableSheet
            title={t('comparison.table_mobile_title')}
            description={t('comparison.table_mobile_desc')}
            triggerLabel={t('comparison.table_mobile_trigger')}
            triggerCount={t('comparison.table_mobile_count', { count: tableRows.length })}
          >
            {displayedRows.map((row) => {
              return (
                <div key={`mobile-compare-${row.key}`} className="rounded-lg bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {row.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.dateLabel}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <MobileComparisonScenario
                      label={`${bondTypeA} (A)`}
                      snapshot={row.scenarioA}
                      formatCurrency={formatCurrency}
                      labels={{
                        nominal: t('common.nominal_value'),
                        real: t('common.real_value'),
                        profit: t('common.net_profit'),
                      }}
                    />
                    <MobileComparisonScenario
                      label={`${bondTypeB} (B)`}
                      snapshot={row.scenarioB}
                      formatCurrency={formatCurrency}
                      labels={{
                        nominal: t('common.nominal_value'),
                        real: t('common.real_value'),
                        profit: t('common.net_profit'),
                      }}
                    />
                  </div>
                  <MobileComparisonValue
                    label={higherColumnLabel}
                    value={row.leader === 'tie'
                      ? tieLabel
                      : `${row.leader === 'A' ? bondTypeA : bondTypeB} ${formatCurrency(Math.abs(row.gap))}`}
                  />
                </div>
              );
            })}
          </ResponsiveTableSheet>

          <div className="hidden rounded-lg bg-card lg:block">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              <p>
                {t('comparison.table_desktop_note')}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                {t('comparison.table_mobile_count', { count: tableRows.length })}
              </p>
            </div>

            <div>
              <Table className="w-full table-fixed tabular-nums">
                <TableHeader className="bg-white">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="sticky left-0 top-0 z-10 h-12 w-[22%] bg-card px-4 text-xs font-semibold text-muted-foreground">
                      {t('common.year')}
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[28%] bg-card px-4 text-xs font-semibold text-foreground">
                      {bondTypeA} (A)
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[28%] bg-card px-4 text-xs font-semibold text-foreground">
                      {bondTypeB} (B)
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[22%] bg-card px-4 text-right text-xs font-semibold text-muted-foreground">
                      {higherColumnLabel}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRows.map((row) => {
                    const higherScenario = row.leader === 'tie' ? null : row.leader;

                    return (
                      <TableRow key={row.key} className="border-b border-border transition-colors odd:bg-muted/20 hover:bg-muted/35">
                        <TableCell className="sticky left-0 z-10 bg-inherit px-4 py-5 font-semibold text-foreground">
                          <div className="space-y-1">
                            <p>{row.label}</p>
                            <p className="text-[11px] font-medium text-muted-foreground">
                              {row.dateLabel}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4',
                            higherScenario === 'A'
                              ? 'text-foreground'
                              : 'text-muted-foreground',
                          )}
                        >
                          <ComparisonScenarioCell
                            snapshot={row.scenarioA}
                            formatCurrency={formatCurrency}
                            labels={{
                              nominal: t('common.nominal_value'),
                              real: t('common.real_value'),
                              profit: t('common.net_profit'),
                            }}
                          />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4',
                            higherScenario === 'B'
                              ? 'text-foreground'
                              : 'text-muted-foreground',
                          )}
                        >
                          <ComparisonScenarioCell
                            snapshot={row.scenarioB}
                            formatCurrency={formatCurrency}
                            labels={{
                              nominal: t('common.nominal_value'),
                              real: t('common.real_value'),
                              profit: t('common.net_profit'),
                            }}
                          />
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          {higherScenario ? (
                            <div className="space-y-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'border px-3 py-0.5 text-xs font-semibold',
                                  higherScenario === 'A'
                                    ? 'border-border bg-card text-foreground'
                                    : 'border-success/30 bg-success/10 text-success',
                                )}
                              >
                                {higherScenario === 'A' ? bondTypeA : bondTypeB} {higherBadgeSuffix}
                              </Badge>
                              <p className="font-mono text-xs font-semibold text-foreground">
                                {formatCurrency(Math.abs(row.gap))}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">{tieLabel}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

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

function ComparisonTablePaginationControls({
  page,
  totalPages,
  rowLimit,
  totalRows,
  visibleRangeLabel,
  onPageChange,
  onRowLimitChange,
  labels,
}: {
  page: number;
  totalPages: number;
  rowLimit: TableRowLimit;
  totalRows: number;
  visibleRangeLabel: string;
  onPageChange: (page: number) => void;
  onRowLimitChange: (limit: TableRowLimit) => void;
  labels: {
    rowsShown: string;
    rowsPerPage: string;
    all: string;
    previous: string;
    next: string;
    page: string;
  };
}) {
  const smallestLimit = tableRowLimitOptions.find(
    (option): option is Exclude<TableRowLimit, 'all'> => option !== 'all',
  ) ?? 12;
  const needsDensityControls = totalRows > smallestLimit;
  const needsPageControls = rowLimit !== 'all' && totalPages > 1;

  return (
    <div className="flex flex-col gap-3 md:items-end">
      <p className="text-xs font-semibold text-muted-foreground">
        {labels.rowsShown}: {visibleRangeLabel}
      </p>
      {needsDensityControls ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {labels.rowsPerPage}
          </span>
          {tableRowLimitOptions.map((option) => (
            <Button
              key={String(option)}
              type="button"
              variant={rowLimit === option ? 'default' : 'outline'}
              size="sm"
              className="h-8 min-w-10 px-3 text-xs font-semibold"
              onClick={() => onRowLimitChange(option)}
            >
              {option === 'all' ? labels.all : option}
            </Button>
          ))}
        </div>
      ) : null}
      {needsPageControls ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-semibold"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            {labels.previous}
          </Button>
          <span className="px-2 text-xs font-semibold text-muted-foreground">
            {labels.page} {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-semibold"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            {labels.next}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function MobileComparisonValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-t border-dashed border-border px-1 py-2 first:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ComparisonScenarioCell({
  snapshot,
  formatCurrency,
  labels,
}: {
  snapshot: ComparisonScenarioSnapshot;
  formatCurrency: (val: number) => string;
  labels: {
    nominal: string;
    real: string;
    profit: string;
  };
}) {
  return (
    <div className="space-y-3 text-xs">
      {snapshot.eventLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {snapshot.eventLabels.map((label) => (
            <Badge key={label} variant="secondary" className="h-5 px-2 text-[10px] font-semibold">
              {label}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <ScenarioSnapshotMetric
        label={labels.nominal}
        value={formatCurrency(snapshot.nominalValue)}
        strong
      />
      <ScenarioSnapshotMetric
        label={labels.real}
        value={formatCurrency(snapshot.realValue)}
      />
      <ScenarioSnapshotMetric
        label={labels.profit}
        value={formatCurrency(snapshot.netProfit)}
        tone={snapshot.netProfit >= 0 ? 'positive' : 'negative'}
      />
      </div>
      {snapshot.interestRate !== undefined || snapshot.rateSourceLabel ? (
        <div className="border-t border-dashed border-border pt-2 text-[11px] leading-5 text-muted-foreground">
          {snapshot.interestRate !== undefined ? (
            <span className="font-semibold text-foreground">{snapshot.interestRate.toFixed(2)}%</span>
          ) : null}
          {snapshot.rateSourceLabel ? (
            <span className="ml-2">{snapshot.rateSourceLabel}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MobileComparisonScenario({
  label,
  snapshot,
  formatCurrency,
  labels,
}: {
  label: string;
  snapshot: ComparisonScenarioSnapshot;
  formatCurrency: (val: number) => string;
  labels: {
    nominal: string;
    real: string;
    profit: string;
  };
}) {
  return (
    <div className="border-t border-dashed border-border px-1 py-2 first:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      {snapshot.eventLabels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {snapshot.eventLabels.map((eventLabel) => (
            <Badge key={eventLabel} variant="secondary" className="h-5 px-2 text-[10px] font-semibold">
              {eventLabel}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="mt-2 grid grid-cols-1 gap-2">
        <ScenarioSnapshotMetric
          label={labels.nominal}
          value={formatCurrency(snapshot.nominalValue)}
          strong
        />
        <ScenarioSnapshotMetric
          label={labels.real}
          value={formatCurrency(snapshot.realValue)}
        />
        <ScenarioSnapshotMetric
          label={labels.profit}
          value={formatCurrency(snapshot.netProfit)}
          tone={snapshot.netProfit >= 0 ? 'positive' : 'negative'}
        />
      </div>
      {snapshot.interestRate !== undefined || snapshot.rateSourceLabel ? (
        <p className="mt-2 border-t border-dashed border-border pt-2 text-[11px] leading-5 text-muted-foreground">
          {snapshot.interestRate !== undefined ? (
            <span className="font-semibold text-foreground">{snapshot.interestRate.toFixed(2)}%</span>
          ) : null}
          {snapshot.rateSourceLabel ? (
            <span className="ml-2">{snapshot.rateSourceLabel}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function ScenarioSnapshotMetric({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-mono text-xs',
          strong ? 'font-semibold text-foreground' : 'text-muted-foreground',
          tone === 'positive' ? 'financial-positive' : '',
          tone === 'negative' ? 'text-destructive' : '',
        )}
      >
        {value}
      </p>
    </div>
  );
}




