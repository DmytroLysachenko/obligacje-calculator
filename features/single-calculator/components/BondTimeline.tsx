'use client';
import { Filter, RotateCcw, Search } from 'lucide-react';
import React, { useDeferredValue, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BondTimelineProps } from '@/features/single-calculator/types/timeline';
import { useAppI18n } from '@/i18n/client';
import { getIntlLocale } from '@/i18n/locale-utils';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import {
  applyTableRowLimit,
  getVisibleRowLabel,
  TableDensityControls,
  TableRowLimit,
} from '@/shared/components/results/TableDensityControls';
import {
  AppLanguage,
  buildBondTimelineDisplayRows,
  getSimulationEventDisplayLabel,
} from '@/shared/lib/bond-display';

import { SimulationEventType } from '../../bond-core/types/simulation';

import { BondTimelineRows } from './BondTimelineRows';
import { TimelineStat } from './BondTimelineValues';

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
  const formatCurrency = React.useMemo(
    () => (value: number) => {
      if (!hasMounted) return '---';
      return new Intl.NumberFormat(getIntlLocale(language), {
        style: 'currency',
        currency: 'PLN',
      }).format(value);
    },
    [hasMounted, language],
  );
  const effectiveChartStep = chartStep === 'daily' ? 'monthly' : chartStep;
  const displayRows = useMemo(
    () =>
      buildBondTimelineDisplayRows(results.timeline, language as AppLanguage, effectiveChartStep),
    [effectiveChartStep, language, results.timeline],
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
  const displayedTimeline = useMemo(
    () => applyTableRowLimit(filteredTimeline, rowLimit),
    [filteredTimeline, rowLimit],
  );
  const activeFilterCount =
    (searchQuery.trim().length > 0 ? 1 : 0) + (eventTypeFilter !== 'all' ? 1 : 0);
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
  return (
    <div className="space-y-6">
      <div className="space-y-4 bg-transparent">
        <div className="grid gap-3 md:grid-cols-3">
          <TimelineStat label={t('bonds.schedule.rows_after_filters')} value={visibleRangeLabel} />
          <TimelineStat
            label={t('bonds.schedule.projected_points')}
            value={String(projectionCount)}
          />
          <TimelineStat label={t('bonds.schedule.exit_markers')} value={String(exitMarkers)} />
        </div>

        <div className="border-t border-border px-1 pt-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {t('bonds.schedule.summary_note')}
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search') || 'Search...'}
              className="bg-background pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
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

            {activeFilterCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={resetFilters}
              >
                <RotateCcw className="h-4 w-4" />
                {t('common.reset_filters')}
              </Button>
            ) : null}
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

      <BondTimelineRows
        displayedTimeline={displayedTimeline}
        filteredTimelineLength={filteredTimeline.length}
        activeFilterCount={activeFilterCount}
        rowLimit={rowLimit}
        onRowLimitChange={setRowLimit}
        onResetFilters={resetFilters}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};
