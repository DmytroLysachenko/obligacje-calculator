'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalculationResult } from '../../bond-core/types';
import { SimulationEventType } from '../../bond-core/types/simulation';
import { useLanguage } from '@/i18n';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AppLanguage,
  buildBondTimelineDisplayRows,
  getSimulationEventDisplayLabel,
} from '@/shared/lib/bond-display';

interface BondTimelineProps {
  results: CalculationResult;
}

function TimelineStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
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

  const formatCurrency = React.useMemo(
    () => (value: number) => {
      if (!hasMounted) return '---';
      return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
        style: 'currency',
        currency: 'PLN',
      }).format(value);
    },
    [hasMounted, language],
  );

  const displayRows = useMemo(
    () => buildBondTimelineDisplayRows(results.timeline, language as AppLanguage),
    [language, results.timeline],
  );

  const eventOptions = useMemo(
    () =>
      Object.values(SimulationEventType).map((type) => ({
        value: type,
        label: getSimulationEventDisplayLabel(type, language as AppLanguage),
      })),
    [language],
  );

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
      const matchesEvent =
        eventTypeFilter === 'all' ||
        row.eventLabels.includes(
          getSimulationEventDisplayLabel(
            eventTypeFilter as SimulationEventType,
            language as AppLanguage,
          ),
        );

      return matchesSearch && matchesEvent;
    });
  }, [deferredSearchQuery, displayRows, eventTypeFilter, language]);

  const displayedTimeline = isExpanded
    ? filteredTimeline
    : filteredTimeline.slice(0, 12);
  const activeFilterCount =
    (searchQuery.trim().length > 0 ? 1 : 0) + (eventTypeFilter !== 'all' ? 1 : 0);
  const visibleRangeLabel =
    filteredTimeline.length > 12 && !isExpanded
      ? `${displayedTimeline.length} / ${filteredTimeline.length}`
      : `${filteredTimeline.length}`;
  const projectionCount = displayRows.filter((row) => !!row.projectionLabel).length;
  const exitMarkers = displayRows.filter((row) => row.isWithdrawal).length;

  const resetFilters = () => {
    setSearchQuery('');
    setEventTypeFilter('all');
    setIsExpanded(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <TimelineStat
            label={language === 'pl' ? 'Wiersze po filtrach' : 'Rows after filters'}
            value={visibleRangeLabel}
          />
          <TimelineStat
            label={language === 'pl' ? 'Punkty prognozy' : 'Projected points'}
            value={String(projectionCount)}
          />
          <TimelineStat
            label={language === 'pl' ? 'Punkty wyjscia' : 'Exit markers'}
            value={String(exitMarkers)}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
          <p className="text-sm leading-7 text-slate-600">
            {language === 'pl'
              ? 'Kazdy wiersz jest punktem kontrolnym scenariusza, a nie oddzielnym zakupem. Czytaj go od lewej do prawej: kiedy punkt wypada, co oznacza, na jakiej stopie pracowal i jaka wartosc zostawial na tym etapie.'
              : 'Each row is a scenario checkpoint, not a separate purchase. Read it left to right: when it happens, what it represents, which rate basis it used, and what value it leaves at that point.'}
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search') || 'Search...'}
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-full md:w-56 bg-background">
                  <SelectValue placeholder={t('bonds.filter_events') || 'Filter Events'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('common.all_events') || 'All Events'}
                  </SelectItem>
                  {eventOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                onClick={resetFilters}
              >
                <RotateCcw className="h-4 w-4" />
                {language === 'pl' ? 'Wyczysc filtry' : 'Reset filters'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="sticky top-0 z-10 h-12 w-[190px] bg-slate-50/95 text-sm font-semibold text-slate-600">
                {t('common.period')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 bg-slate-50/95 text-sm font-semibold text-slate-600">
                {language === 'pl' ? 'Co dzieje sie w tym punkcie' : 'What happens at this point'}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 bg-slate-50/95 text-sm font-semibold text-slate-600">
                {t('bonds.cycle')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 bg-slate-50/95 text-sm font-semibold text-slate-600">
                {t('common.interest_rate')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 bg-slate-50/95 text-sm font-semibold text-slate-600">
                {t('bonds.rate_source')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 bg-slate-50/95 text-sm font-semibold text-slate-600">
                {t('common.nominal_value')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 bg-slate-50/95 text-sm font-semibold text-slate-600">
                {language === 'pl' ? 'Zysk do tego punktu' : 'Net gain to this point'}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 bg-slate-50/95 text-sm font-semibold text-slate-600">
                {t('common.real_value')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 h-12 bg-slate-50/95 text-right text-sm font-semibold text-slate-600">
                {t('bonds.early_exit_payout')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTimeline.map((row) => (
              <TableRow
                key={row.key}
                className={row.isWithdrawal ? 'bg-primary/5 font-semibold' : 'odd:bg-slate-50/30'}
              >
                <TableCell className="py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.periodLabel}</span>
                      {row.projectionLabel ? (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            row.projectionLabel === 'Prognoza' ||
                              row.projectionLabel === 'Projected'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700',
                          )}
                        >
                          {row.projectionLabel}
                        </span>
                      ) : null}
                    </div>
                    {row.eventLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.eventLabels.map((label, index) => (
                          <Badge
                            key={`${row.key}-${index}`}
                            variant="secondary"
                            className="h-5 px-2 text-[11px] font-semibold"
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="py-4 text-sm text-slate-600">
                  <div className="space-y-1">
                    <p>{row.cadenceLabel}</p>
                    <p className="text-xs leading-5 text-slate-500">
                      {row.valueMeaningLabel}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-muted-foreground">
                  {row.cycleLabel}
                </TableCell>
                <TableCell className="py-4 font-mono text-sm">
                  {row.interestRateLabel}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="text-sm">{row.rateSourceLabel}</span>
                    {row.referenceLabel ? (
                      <span className="text-[10px] italic text-muted-foreground">
                        {row.referenceLabel}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="py-4 font-mono text-sm">
                  {formatCurrency(row.nominalValue)}
                </TableCell>
                <TableCell
                  className={cn(
                    'py-4 font-mono text-sm',
                    row.netProfit >= 0 ? 'text-green-600' : 'text-destructive',
                  )}
                >
                  {formatCurrency(row.netProfit)}
                </TableCell>
                <TableCell className="py-4 font-mono text-sm text-blue-600">
                  {formatCurrency(row.realValue)}
                </TableCell>
                <TableCell className="py-4 text-right font-mono text-sm font-semibold">
                  {formatCurrency(row.earlyExitValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredTimeline.length > 12 ? (
          <div className="flex justify-center border-t bg-slate-50/70 p-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-sm font-semibold"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" /> {t('common.show_less') || 'Show Less'}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />{' '}
                  {t('common.show_all', { count: filteredTimeline.length }) ||
                    `Show All (${filteredTimeline.length})`}
                </>
              )}
            </Button>
          </div>
        ) : null}

        {filteredTimeline.length === 0 ? (
          <div className="space-y-3 p-12 text-center text-muted-foreground">
            <p>{t('common.no_results_found') || 'No results found for current filters.'}</p>
            {activeFilterCount > 0 ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  {language === 'pl' ? 'Wroc do pelnej osi czasu' : 'Return to full timeline'}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
