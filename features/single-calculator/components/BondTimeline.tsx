'use client';

import React, { useMemo, useState } from 'react';
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
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AppLanguage,
  buildBondTimelineDisplayRows,
  getSimulationEventDisplayLabel,
} from '@/shared/lib/bond-display';

interface BondTimelineProps {
  results: CalculationResult;
}

export const BondTimeline: React.FC<BondTimelineProps> = ({ results }) => {
  const { t, language } = useLanguage();
  const [hasMounted, setHasMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const formatCurrency = (value: number) => {
    if (!hasMounted) return '---';
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

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

      const matchesSearch = haystack.includes(searchQuery.toLowerCase());
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
  }, [displayRows, eventTypeFilter, language, searchQuery]);

  const displayedTimeline = isExpanded
    ? filteredTimeline
    : filteredTimeline.slice(0, 12);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search') || 'Search...'}
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
      </div>

      <div className="w-full overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="h-12 w-[190px] text-sm font-semibold text-slate-600">
                {t('common.period')}
              </TableHead>
              <TableHead className="h-12 text-sm font-semibold text-slate-600">
                {language === 'pl' ? 'Znaczenie' : 'Meaning'}
              </TableHead>
              <TableHead className="h-12 text-sm font-semibold text-slate-600">
                {t('bonds.cycle')}
              </TableHead>
              <TableHead className="h-12 text-sm font-semibold text-slate-600">
                {t('common.interest_rate')}
              </TableHead>
              <TableHead className="h-12 text-sm font-semibold text-slate-600">
                {t('bonds.rate_source')}
              </TableHead>
              <TableHead className="h-12 text-sm font-semibold text-slate-600">
                {t('common.nominal_value')}
              </TableHead>
              <TableHead className="h-12 text-sm font-semibold text-slate-600">
                {t('common.net_profit')}
              </TableHead>
              <TableHead className="h-12 text-sm font-semibold text-slate-600">
                {t('common.real_value')}
              </TableHead>
              <TableHead className="h-12 text-right text-sm font-semibold text-slate-600">
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
                  {row.cadenceLabel}
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
          <div className="p-12 text-center text-muted-foreground">
            <p>{t('common.no_results_found') || 'No results found for current filters.'}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
