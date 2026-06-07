'use client';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { CalculationResult } from '../../bond-core/types';
import { SimulationEventType } from '../../bond-core/types/simulation';
import { useAppI18n } from '@/i18n/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { applyTableRowLimit, getVisibleRowLabel, TableDensityControls, TableRowLimit } from '@/shared/components/results/TableDensityControls';
import { AppLanguage, buildBondTimelineDisplayRows, getSimulationEventDisplayLabel, } from '@/shared/lib/bond-display';
import { getIntlLocale } from '@/i18n/locale-utils';
import { ChartStep } from '@/features/bond-core/types';
interface BondTimelineProps {
    results: CalculationResult;
    chartStep?: ChartStep;
}
function TimelineStat({ label, value, }: {
    label: string;
    value: string;
}) {
    return (<div className="border-b border-border px-1 py-2.5 md:border-b-0 md:px-0">
      <p className="text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>);
}
export const BondTimeline: React.FC<BondTimelineProps> = ({ results, chartStep = 'yearly' }) => {
    const { t, locale: language } = useAppI18n();
    const [hasMounted, setHasMounted] = React.useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
    const [rowLimit, setRowLimit] = useState<TableRowLimit>(12);
    const deferredSearchQuery = useDeferredValue(searchQuery);
    React.useEffect(() => {
        setHasMounted(true);
    }, []);
    const formatCurrency = React.useMemo(() => (value: number) => {
        if (!hasMounted)
            return '---';
        return new Intl.NumberFormat(getIntlLocale(language), {
            style: 'currency',
            currency: 'PLN',
        }).format(value);
    }, [hasMounted, language]);
    const effectiveChartStep = chartStep === 'daily' ? 'monthly' : chartStep;
    const displayRows = useMemo(() => buildBondTimelineDisplayRows(results.timeline, language as AppLanguage, effectiveChartStep), [effectiveChartStep, language, results.timeline]);
    const eventOptions = useMemo(() => Object.values(SimulationEventType).map((type) => ({
        value: type,
        label: getSimulationEventDisplayLabel(type, language as AppLanguage),
    })), [language]);
    const filteredTimeline = useMemo(() => {
        return displayRows.filter((row) => {
            const haystack = [
                row.periodLabel,
                row.cadenceLabel,
                row.cycleLabel,
                row.rateSourceLabel,
                row.referenceLabel,
                ...row.eventLabels,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            const matchesSearch = haystack.includes(deferredSearchQuery.toLowerCase());
            const matchesEvent = eventTypeFilter === 'all' ||
                row.eventLabels.includes(getSimulationEventDisplayLabel(eventTypeFilter as SimulationEventType, language as AppLanguage));
            return matchesSearch && matchesEvent;
        });
    }, [deferredSearchQuery, displayRows, eventTypeFilter, language]);
    const displayedTimeline = useMemo(() => applyTableRowLimit(filteredTimeline, rowLimit), [filteredTimeline, rowLimit]);
    const activeFilterCount = (searchQuery.trim().length > 0 ? 1 : 0) + (eventTypeFilter !== 'all' ? 1 : 0);
    const visibleRangeLabel = getVisibleRowLabel({
        visible: displayedTimeline.length,
        total: filteredTimeline.length,
        allLabel: t('common.rows_visible'),
    });
    const projectionCount = displayRows.filter((row) => !!row.projectionLabel).length;
    const exitMarkers = displayRows.filter((row) => row.isWithdrawal).length;
    const resetFilters = () => {
        setSearchQuery('');
        setEventTypeFilter('all');
        setRowLimit(12);
    };
    return (<div className="space-y-6">
      <div className="space-y-4 bg-transparent">
        <div className="grid gap-3 md:grid-cols-3">
          <TimelineStat label={t('bonds.schedule.rows_after_filters')} value={visibleRangeLabel}/>
          <TimelineStat label={t('bonds.schedule.projected_points')} value={String(projectionCount)}/>
          <TimelineStat label={t('bonds.schedule.exit_markers')} value={String(exitMarkers)}/>
        </div>

        <div className="border-t border-border px-1 pt-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {t('bonds.schedule.summary_note')}
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input placeholder={t('common.search') || 'Search...'} className="bg-background pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground"/>
              <FormSelect
                value={eventTypeFilter}
                onValueChange={setEventTypeFilter}
                placeholder={t('bonds.filter_events') || 'Filter Events'}
                triggerClassName="w-full bg-background md:w-56"
                options={[
                  {
                    value: 'all',
                    label: t('common.all_events') || 'All Events',
                  },
                  ...eventOptions,
                ]}
              />
            </div>

            {activeFilterCount > 0 ? (<Button type="button" variant="outline" size="sm" className="gap-2" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4"/>
                {t('common.reset_filters')}
              </Button>) : null}
          </div>
        </div>
        <TableDensityControls
          value={rowLimit}
          totalRows={filteredTimeline.length}
          visibleRows={displayedTimeline.length}
          onChange={setRowLimit}
          labels={{
            rowsShown: t('common.rows_shown'),
            rowsPerPage: t('common.rows_per_page'),
            all: t('common.all'),
          }}
        />
      </div>

      <ResponsiveTableSheet title={t('bonds.schedule.mobile_sheet_title')} description={t('bonds.schedule.mobile_sheet_description')} triggerLabel={t('bonds.schedule.mobile_sheet_trigger')} triggerCount={`${filteredTimeline.length} ${t('bonds.schedule.mobile_sheet_count_suffix')}`}>
        {displayedTimeline.map((row) => (<div key={`mobile-${row.key}`} className="border-t border-border py-4 first:border-t-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{row.periodLabel}</p>
                  {row.projectionLabel ? (<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {row.projectionLabel}
                    </span>) : null}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{row.cadenceLabel}</p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(row.totalWealth)}
              </p>
            </div>

            {row.eventLabels.length > 0 ? (<div className="mt-3 flex flex-wrap gap-1">
                {row.eventLabels.map((label, index) => (<Badge key={`mobile-${row.key}-${index}`} variant="secondary" className="h-5 px-2 text-[11px] font-semibold">
                    {label}
                  </Badge>))}
              </div>) : null}

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <MobileValue label={t('bonds.schedule.rate_and_basis')} value={row.interestRateLabel}/>
              <MobileValue label={t('bonds.early_exit_payout')} value={formatCurrency(row.earlyExitValue)}/>
              <MobileValue label={row.cashFlowLabel} value={formatCurrency(row.paidOutCash)}/>
              <MobileValue label={t('common.net_profit')} value={formatCurrency(row.netProfit)}/>
              <MobileValue label={t('bonds.real_value')} value={formatCurrency(row.realValue)}/>
              <MobileValue label={t('bonds.schedule.rate_source')} value={row.rateSourceLabel}/>
            </div>

            {row.referenceLabel ? (<p className="mt-3 border-l-2 border-border px-3 text-xs leading-5 text-muted-foreground">{row.referenceLabel}</p>) : null}
          </div>))}
      </ResponsiveTableSheet>

      <div className="hidden w-full border-y border-border lg:block">
        <Table className="w-full table-fixed text-sm tabular-nums">
          <TableHeader>
            <TableRow className="h-12 hover:bg-transparent">
              <TableHead className="sticky top-0 z-10 h-12 w-[11%] bg-background">
                {t('common.period')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[18%] bg-background">
                {t('bonds.schedule.checkpoint_meaning')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[17%] bg-background">
                {t('bonds.schedule.rate_and_basis')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[11%] bg-background">
                {t('bonds.total_wealth')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[11%] bg-background">
                {displayedTimeline[0]?.cashFlowLabel ?? t('bonds.schedule.cash_flow')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[10%] bg-background">
                {t('common.net_profit')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[10%] bg-background">
                {t('bonds.real_value')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[12%] bg-background text-right">
                {t('bonds.early_exit_payout')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTimeline.map((row) => (<TableRow key={row.key} className={cn('h-14 border-b border-border transition-colors hover:bg-muted/25', row.isWithdrawal ? 'bg-muted/45 font-semibold' : '')}>
                <TableCell className="py-4 align-top">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{row.periodLabel}</span>
                      {row.projectionLabel ? (<span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', row.projectionLabel === 'Prognoza' ||
                    row.projectionLabel === 'Projected'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-muted text-muted-foreground')}>
                          {row.projectionLabel}
                        </span>) : null}
                    </div>
                    {row.eventLabels.length > 0 ? (<div className="flex flex-wrap gap-1">
                        {row.eventLabels.map((label, index) => (<Badge key={`${row.key}-${index}`} variant="secondary" className="h-5 px-2 text-[11px] font-semibold">
                            {label}
                          </Badge>))}
                      </div>) : null}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top text-xs text-muted-foreground">
                  <div className="space-y-1 pr-2">
                    <p className="font-medium leading-5 text-foreground">{row.cadenceLabel}</p>
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {row.valueMeaningLabel}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <div className="flex flex-col gap-1 pr-2">
                    <span className="financial-number font-mono text-xs font-semibold text-foreground">
                      {row.interestRateLabel}
                    </span>
                    <span className="line-clamp-2 text-xs leading-5">{row.rateSourceLabel}</span>
                    {row.referenceLabel ? (<span className="line-clamp-2 text-[10px] italic leading-4 text-muted-foreground">
                        {row.referenceLabel}
                      </span>) : null}
                  </div>
                </TableCell>
                <TableCell className="financial-number py-4 align-top font-mono text-xs">
                  {formatCurrency(row.totalWealth)}
                </TableCell>
                <TableCell className="financial-number py-4 align-top font-mono text-xs text-muted-foreground">
                  {formatCurrency(row.paidOutCash)}
                </TableCell>
                <TableCell className={cn('financial-number py-4 align-top font-mono text-xs', row.netProfit >= 0 ? 'financial-positive' : 'text-destructive')}>
                  {formatCurrency(row.netProfit)}
                </TableCell>
                <TableCell className="financial-number py-4 align-top font-mono text-xs text-muted-foreground">
                  {formatCurrency(row.realValue)}
                </TableCell>
                <TableCell className="financial-number py-4 align-top text-right font-mono text-xs font-semibold">
                  {formatCurrency(row.earlyExitValue)}
                </TableCell>
              </TableRow>))}
          </TableBody>
        </Table>

        <TableDensityControls
          value={rowLimit}
          totalRows={filteredTimeline.length}
          visibleRows={displayedTimeline.length}
          onChange={setRowLimit}
          className="border-t border-border px-1"
          labels={{
            rowsShown: t('common.rows_shown'),
            rowsPerPage: t('common.rows_per_page'),
            all: t('common.all'),
          }}
        />

        {filteredTimeline.length === 0 ? (<div className="space-y-3 p-12 text-center text-muted-foreground">
            <p>{t('common.no_results_found') || 'No results found for current filters.'}</p>
            {activeFilterCount > 0 ? (<div className="flex justify-center">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4"/>
                  {t('common.reset_filters')}
                </Button>
              </div>) : null}
          </div>) : null}
      </div>
    </div>);
};
function MobileValue({ label, value, }: {
    label: string;
    value: string;
}) {
    return (<div className="border-t border-border px-1 py-2 first:border-t-0">
      <p className="text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>);
}





