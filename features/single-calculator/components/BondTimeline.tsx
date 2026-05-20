'use client';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { CalculationResult } from '../../bond-core/types';
import { SimulationEventType } from '../../bond-core/types/simulation';
import { useLanguage } from '@/i18n';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveTableSheet } from '@/shared/components/ResponsiveTableSheet';
import { AppLanguage, buildBondTimelineDisplayRows, getSimulationEventDisplayLabel, } from '@/shared/lib/bond-display';
import { getIntlLocale } from '@/i18n/locale-utils';
interface BondTimelineProps {
    results: CalculationResult;
}
function TimelineStat({ label, value, }: {
    label: string;
    value: string;
}) {
    return (<div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>);
}
export const BondTimeline: React.FC<BondTimelineProps> = ({ results }) => {
    const { t, language } = useLanguage();
    const [hasMounted, setHasMounted] = React.useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
    const [isExpanded, setIsExpanded] = useState(false);
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
    const displayRows = useMemo(() => buildBondTimelineDisplayRows(results.timeline, language as AppLanguage), [language, results.timeline]);
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
    const displayedTimeline = isExpanded
        ? filteredTimeline
        : filteredTimeline.slice(0, 12);
    const activeFilterCount = (searchQuery.trim().length > 0 ? 1 : 0) + (eventTypeFilter !== 'all' ? 1 : 0);
    const visibleRangeLabel = filteredTimeline.length > 12 && !isExpanded
        ? `${displayedTimeline.length} / ${filteredTimeline.length}`
        : `${filteredTimeline.length}`;
    const projectionCount = displayRows.filter((row) => !!row.projectionLabel).length;
    const exitMarkers = displayRows.filter((row) => row.isWithdrawal).length;
    const resetFilters = () => {
        setSearchQuery('');
        setEventTypeFilter('all');
        setIsExpanded(false);
    };
    return (<div className="space-y-4">
      <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <TimelineStat label={t("generated.features.single_calculator.components.bond_timeline.item_2", undefined, language)} value={visibleRangeLabel}/>
          <TimelineStat label={t("generated.features.single_calculator.components.bond_timeline.item_3", undefined, language)} value={String(projectionCount)}/>
          <TimelineStat label={t("generated.features.single_calculator.components.bond_timeline.item_4", undefined, language)} value={String(exitMarkers)}/>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
          <p className="text-sm leading-7 text-slate-600">
            {t("generated.features.single_calculator.components.bond_timeline.item_5", undefined, language)}
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input placeholder={t('common.search') || 'Search...'} className="pl-9 bg-background" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground"/>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-full md:w-56 bg-background">
                  <SelectValue placeholder={t('bonds.filter_events') || 'Filter Events'}/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('common.all_events') || 'All Events'}
                  </SelectItem>
                  {eventOptions.map((type) => (<SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 ? (<Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4"/>
                {t("generated.features.single_calculator.components.bond_timeline.item_6", undefined, language)}
              </Button>) : null}
          </div>
        </div>
      </div>

      <ResponsiveTableSheet title={t("generated.features.single_calculator.components.bond_timeline.item_7", undefined, language)} description={t("generated.features.single_calculator.components.bond_timeline.item_8", undefined, language)} triggerLabel={t("generated.features.single_calculator.components.bond_timeline.item_9", undefined, language)} triggerCount={`${filteredTimeline.length} ${t("generated.features.single_calculator.components.bond_timeline.item_10", undefined, language)}`}>
        {displayedTimeline.map((row) => (<div key={`mobile-${row.key}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-none">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">{row.periodLabel}</p>
                  {row.projectionLabel ? (<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {row.projectionLabel}
                    </span>) : null}
                </div>
                <p className="text-xs leading-5 text-slate-500">{row.cadenceLabel}</p>
              </div>
              <p className="text-sm font-black text-slate-950">
                {formatCurrency(row.totalWealth)}
              </p>
            </div>

            {row.eventLabels.length > 0 ? (<div className="mt-3 flex flex-wrap gap-1">
                {row.eventLabels.map((label, index) => (<Badge key={`mobile-${row.key}-${index}`} variant="secondary" className="h-5 px-2 text-[11px] font-semibold">
                    {label}
                  </Badge>))}
              </div>) : null}

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <MobileValue label={t("generated.features.single_calculator.components.bond_timeline.item_11", undefined, language)} value={row.interestRateLabel}/>
              <MobileValue label={t("generated.features.single_calculator.components.bond_timeline.item_12", undefined, language)} value={formatCurrency(row.earlyExitValue)}/>
              <MobileValue label={row.cashFlowLabel} value={formatCurrency(row.paidOutCash)}/>
              <MobileValue label={t("generated.features.single_calculator.components.bond_timeline.item_13", undefined, language)} value={formatCurrency(row.netProfit)}/>
              <MobileValue label={t("generated.features.single_calculator.components.bond_timeline.item_14", undefined, language)} value={formatCurrency(row.realValue)}/>
              <MobileValue label={t("generated.features.single_calculator.components.bond_timeline.item_15", undefined, language)} value={row.rateSourceLabel}/>
            </div>

            {row.referenceLabel ? (<p className="mt-3 text-xs leading-5 text-slate-500">{row.referenceLabel}</p>) : null}
          </div>))}
      </ResponsiveTableSheet>

      <div className="hidden w-full rounded-[1.75rem] border border-slate-200 bg-white shadow-none lg:block">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="sticky top-0 z-10 h-12 w-[11%] bg-slate-50/95 text-xs font-semibold text-slate-600">
                {t('common.period')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[18%] bg-slate-50/95 text-xs font-semibold text-slate-600">
                {t("generated.features.single_calculator.components.bond_timeline.item_16", undefined, language)}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[17%] bg-slate-50/95 text-xs font-semibold text-slate-600">
                {t("generated.features.single_calculator.components.bond_timeline.item_17", undefined, language)}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[11%] bg-slate-50/95 text-xs font-semibold text-slate-600">
                {t("generated.features.single_calculator.components.bond_timeline.item_18", undefined, language)}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[11%] bg-slate-50/95 text-xs font-semibold text-slate-600">
                {displayedTimeline[0]?.cashFlowLabel ?? (t("generated.features.single_calculator.components.bond_timeline.item_19", undefined, language))}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[10%] bg-slate-50/95 text-xs font-semibold text-slate-600">
                {t("generated.features.single_calculator.components.bond_timeline.item_20", undefined, language)}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[10%] bg-slate-50/95 text-xs font-semibold text-slate-600">
                {t("generated.features.single_calculator.components.bond_timeline.item_21", undefined, language)}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 w-[12%] bg-slate-50/95 text-right text-xs font-semibold text-slate-600">
                {t('bonds.early_exit_payout')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTimeline.map((row) => (<TableRow key={row.key} className={row.isWithdrawal ? 'bg-primary/5 font-semibold' : 'odd:bg-slate-50/30'}>
                <TableCell className="py-4 align-top">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{row.periodLabel}</span>
                      {row.projectionLabel ? (<span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', row.projectionLabel === 'Prognoza' ||
                    row.projectionLabel === 'Projected'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700')}>
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
                <TableCell className="py-4 align-top text-xs text-slate-600">
                  <div className="space-y-1 pr-2">
                    <p className="font-medium leading-5 text-slate-900">{row.cadenceLabel}</p>
                    <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                      {row.valueMeaningLabel}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <div className="flex flex-col gap-1 pr-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {row.interestRateLabel}
                    </span>
                    <span className="line-clamp-2 text-xs leading-5">{row.rateSourceLabel}</span>
                    {row.referenceLabel ? (<span className="line-clamp-2 text-[10px] italic leading-4 text-muted-foreground">
                        {row.referenceLabel}
                      </span>) : null}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top font-mono text-xs">
                  {formatCurrency(row.totalWealth)}
                </TableCell>
                <TableCell className="py-4 align-top font-mono text-xs text-slate-600">
                  {formatCurrency(row.paidOutCash)}
                </TableCell>
                <TableCell className={cn('py-4 align-top font-mono text-xs', row.netProfit >= 0 ? 'text-green-600' : 'text-destructive')}>
                  {formatCurrency(row.netProfit)}
                </TableCell>
                <TableCell className="py-4 align-top font-mono text-xs text-blue-600">
                  {formatCurrency(row.realValue)}
                </TableCell>
                <TableCell className="py-4 align-top text-right font-mono text-xs font-semibold">
                  {formatCurrency(row.earlyExitValue)}
                </TableCell>
              </TableRow>))}
          </TableBody>
        </Table>

        {filteredTimeline.length > 12 ? (<div className="flex justify-center border-t bg-slate-50/70 p-4">
            <Button variant="ghost" size="sm" className="gap-2 text-sm font-semibold" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? (<>
                  <ChevronUp className="h-4 w-4"/> {t('common.show_less') || 'Show Less'}
                </>) : (<>
                  <ChevronDown className="h-4 w-4"/>{' '}
                  {t('common.show_all', { count: filteredTimeline.length }) ||
                    `Show All (${filteredTimeline.length})`}
                </>)}
            </Button>
          </div>) : null}

        {filteredTimeline.length === 0 ? (<div className="space-y-3 p-12 text-center text-muted-foreground">
            <p>{t('common.no_results_found') || 'No results found for current filters.'}</p>
            {activeFilterCount > 0 ? (<div className="flex justify-center">
                <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4"/>
                  {t("generated.features.single_calculator.components.bond_timeline.item_22", undefined, language)}
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
    return (<div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>);
}

