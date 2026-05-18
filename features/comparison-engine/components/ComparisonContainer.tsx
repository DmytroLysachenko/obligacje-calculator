'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { addMonths, compareAsc } from 'date-fns';
import { format, parseISO } from 'date-fns';
import { enGB, pl } from 'date-fns/locale';
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FileSpreadsheet, History, LineChart, Scale, TriangleAlert } from 'lucide-react';
import { TaxStrategy } from '@/features/bond-core/types';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { SecondaryInsightAccordion } from '@/shared/components/SecondaryInsightAccordion';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { ScenarioReadyPanel } from '@/shared/components/ScenarioReadyPanel';
import { buildComparisonExportHeaders } from '@/shared/lib/export-headers';
import {
  buildCombinedComparisonCsvFilename,
  exportComparisonCsv,
} from '@/shared/lib/retained-exports';
import { sampleSeriesPoints } from '@/shared/lib/chart-series';
import { toDateString } from '@/shared/lib/date-timing';
import { InterestPayout } from '@/features/bond-core/types';
import { useComparison } from '../hooks/useComparison';
import { BondComparisonContainer } from './BondComparisonContainer';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonVerdict } from './ComparisonVerdict';
import { ScenarioOverrideCard } from './ScenarioOverrideCard';

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string;
  formatCurrency: (value: number) => string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatCurrency,
}: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="min-w-[150px] rounded border border-border bg-popover p-3 text-popover-foreground shadow-xl">
      <p className="mb-2 border-b border-border/50 pb-1 text-xs font-bold">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold">
              {formatCurrency(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ComparisonContainer: React.FC = () => {
  const {
    sharedConfig,
    scenarioA,
    scenarioB,
    inputsA,
    inputsB,
    resultsA,
    resultsB,
    envelopeA,
    envelopeB,
    warningsA,
    warningsB,
    isCalculating,
    calculate,
    updateSharedConfig,
    updateScenarioA,
    updateScenarioB,
    setBondTypeA,
    setBondTypeB,
    isDirty,
  } = useComparison();
  const { t, language } = useLanguage();
  const [compareMode, setCompareMode] = useState<'independent' | 'normalized'>(
    'independent',
  );
  const hasMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (isDirty || !resultsA)) {
      calculate();
    }
  };

  const handleExportComparisonCSV = () => {
    if (!resultsA || !resultsB) {
      return;
    }

    exportComparisonCsv({
      timelineA: resultsA.timeline,
      timelineB: resultsB.timeline,
      headers: buildComparisonExportHeaders(t),
      language,
      fileName: buildCombinedComparisonCsvFilename(inputsA.bondType, inputsB.bondType),
    });
  };

  const formatCurrency = React.useMemo(
    () => (value: number) => {
      if (!hasMounted) return '---';

      return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
      }).format(value);
    },
    [hasMounted, language],
  );

  const chartData = useMemo(() => {
    if (!resultsA || !resultsB) return [];

    const buildAnchorDates = () => {
      const startDate = parseISO(sharedConfig.purchaseDate);
      const endA = parseISO(inputsA.withdrawalDate);
      const endB = parseISO(inputsB.withdrawalDate);
      const maxEndDate = compareAsc(endA, endB) >= 0 ? endA : endB;
      const dateMap = new Map<number, Date>();

      dateMap.set(startDate.getTime(), startDate);

      for (let cursor = startDate; compareAsc(cursor, maxEndDate) < 0; cursor = addMonths(cursor, 1)) {
        const next = addMonths(cursor, 1);
        dateMap.set(next.getTime(), next);
      }

      for (const point of [...resultsA.timeline, ...resultsB.timeline]) {
        const date = parseISO(point.cycleEndDate);
        dateMap.set(date.getTime(), date);
      }

      return Array.from(dateMap.values()).sort(compareAsc);
    };

    const anchorDates = buildAnchorDates();

    const projectSeries = (
      timeline: typeof resultsA.timeline,
      initialInvestment: number,
      dates: Date[],
    ) => {
      let index = 0;
      let currentValue = initialInvestment;

      return dates.map((date) => {
        while (
          index < timeline.length
          && compareAsc(parseISO(timeline[index].cycleEndDate), date) <= 0
        ) {
          currentValue = timeline[index].nominalValueAfterInterest;
          index += 1;
        }

        return currentValue;
      });
    };

    const seriesA = projectSeries(resultsA.timeline, resultsA.initialInvestment, anchorDates);
    const seriesB = projectSeries(resultsB.timeline, resultsB.initialInvestment, anchorDates);

    return sampleSeriesPoints(
      anchorDates.map((date, index) => ({
        dateKey: date.toISOString(),
        label:
          index === 0
            ? t('comparison.start')
            : format(date, 'MMM yyyy', {
                locale: language === 'pl' ? pl : enGB,
              }),
        valA: seriesA[index],
        valB: seriesB[index],
      })),
      180,
    );
  }, [inputsA.withdrawalDate, inputsB.withdrawalDate, language, resultsA, resultsB, sharedConfig.purchaseDate, t]);

  const usesMixedTimelineCadence = useMemo(() => {
    return inputsA.payoutFrequency !== inputsB.payoutFrequency;
  }, [inputsA.payoutFrequency, inputsB.payoutFrequency]);

  const headerActions = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-xl border bg-muted/30 p-1">
        <Button
          type="button"
          size="sm"
          variant={compareMode === 'independent' ? 'default' : 'ghost'}
          className="h-9 px-3 text-[10px] font-black uppercase tracking-widest"
          onClick={() => setCompareMode('independent')}
        >
          {t('comparison.mode_independent')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={compareMode === 'normalized' ? 'default' : 'ghost'}
          className="h-9 px-3 text-[10px] font-black uppercase tracking-widest"
          onClick={() => setCompareMode('normalized')}
        >
          {t('comparison.mode_normalized')}
        </Button>
      </div>
    </div>
  );

  return (
    <CalculatorPageShell
      title={t('nav.comparison')}
      description={
        compareMode === 'independent'
          ? t('comparison.desc_independent')
          : t('comparison.desc_bond_vs_bond')
      }
      icon={<Scale className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={!!resultsA}
      extraHeaderActions={headerActions}
      onKeyDown={handleKeyDown}
    >
      {compareMode === 'normalized' ? (
        <BondComparisonContainer />
      ) : (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[390px_minmax(0,1fr)]">
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-sm font-black uppercase tracking-widest">
                  {t('comparison.shared_base_title')}
                </CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t('comparison.shared_base_desc')}
                </p>
              </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t('bonds.timing.mode.label')}
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      !sharedConfig.timingMode || sharedConfig.timingMode === 'general'
                        ? 'default'
                        : 'outline'
                    }
                    className="flex-1 h-10 text-xs font-bold"
                    onClick={() => updateSharedConfig('timingMode', 'general')}
                  >
                    {t('bonds.timing.mode.general')}
                  </Button>
                  <Button
                    type="button"
                    variant={sharedConfig.timingMode === 'exact' ? 'default' : 'outline'}
                    className="flex-1 h-10 text-xs font-bold"
                    onClick={() => updateSharedConfig('timingMode', 'exact')}
                  >
                    {t('bonds.timing.mode.exact')}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t('comparison.initial_sum')}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    className="h-11 pr-12 font-bold text-lg"
                    value={sharedConfig.initialInvestment}
                    onChange={(event) =>
                      updateSharedConfig(
                        'initialInvestment',
                        Number(event.target.value),
                      )
                    }
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">
                    PLN
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-dashed pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t('bonds.purchase_date')}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-11 w-full justify-start border text-left font-bold',
                          !sharedConfig.purchaseDate && 'text-muted-foreground',
                        )}
                      >
                        <History className="mr-2 h-4 w-4 text-primary" />
                        {sharedConfig.purchaseDate ? (
                          format(parseISO(sharedConfig.purchaseDate), 'PPP', {
                            locale: language === 'pl' ? pl : enGB,
                          })
                        ) : (
                          <span>{t('bonds.pick_date')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        fromYear={2010}
                        toYear={2050}
                        selected={parseISO(sharedConfig.purchaseDate)}
                        onSelect={(date) =>
                          date &&
                          updateSharedConfig('purchaseDate', toDateString(date))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {sharedConfig.timingMode === 'exact' ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t('bonds.withdrawal_date')}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'h-11 w-full justify-start border text-left font-bold',
                            !sharedConfig.withdrawalDate && 'text-muted-foreground',
                          )}
                        >
                          <History className="mr-2 h-4 w-4 text-primary" />
                          {sharedConfig.withdrawalDate ? (
                            format(parseISO(sharedConfig.withdrawalDate), 'PPP', {
                              locale: language === 'pl' ? pl : enGB,
                            })
                          ) : (
                            <span>{t('bonds.pick_date')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          fromYear={2010}
                          toYear={2050}
                          selected={parseISO(sharedConfig.withdrawalDate)}
                          onSelect={(date) =>
                            date &&
                            updateSharedConfig('withdrawalDate', toDateString(date))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 border-t border-dashed pt-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t('bonds.investment_horizon')}
                </Label>
                <CommittedSliderInput
                  value={sharedConfig.investmentHorizonMonths ?? 120}
                  min={12}
                  max={360}
                  step={1}
                  unit="mo"
                  onCommit={(value) =>
                    updateSharedConfig('investmentHorizonMonths', value)
                  }
                />
              </div>

              <div className="space-y-4 border-t border-dashed pt-4">
                <MarketAssumptionsForm
                  expectedInflation={sharedConfig.expectedInflation}
                  expectedNbpRate={sharedConfig.expectedNbpRate}
                  customInflation={sharedConfig.customInflation}
                  inflationScenario={sharedConfig.inflationScenario}
                  bondType={scenarioA.bondType}
                  inflationHorizonYears={Math.max(1, Math.ceil((sharedConfig.investmentHorizonMonths ?? 120) / 12))}
                  onUpdate={updateSharedConfig as (key: string, value: unknown) => void}
                  compact
                />
              </div>

              <div className="space-y-2 border-t border-dashed pt-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t('bonds.tax_strategy')}
                </Label>
                <Select
                  value={sharedConfig.taxStrategy ?? TaxStrategy.STANDARD}
                  onValueChange={(value) =>
                    updateSharedConfig('taxStrategy', value as TaxStrategy)
                  }
                >
                  <SelectTrigger className="h-11 [&>span]:truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaxStrategy.STANDARD}>
                      {t('bonds.tax_standard')}
                    </SelectItem>
                    <SelectItem value={TaxStrategy.IKE}>
                      {t('bonds.tax_ike')}
                    </SelectItem>
                    <SelectItem value={TaxStrategy.IKZE}>
                      {t('bonds.tax_ikze')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ScenarioOverrideCard
                title={t('comparison.scenario_a')}
                colorClass="bg-blue-100/20 text-slate-900"
                bondType={scenarioA.bondType}
                onBondTypeChange={setBondTypeA}
                rollover={scenarioA.rollover}
                onRolloverChange={(value) => updateScenarioA('rollover', value)}
                isRebought={scenarioA.isRebought}
                onReboughtChange={(value) => updateScenarioA('isRebought', value)}
                taxStrategy={scenarioA.taxStrategy}
                onTaxStrategyChange={(value) =>
                  updateScenarioA('taxStrategy', value)
                }
                customHorizonEnabled={scenarioA.investmentHorizonMonths !== undefined}
                onCustomHorizonEnabledChange={(value) =>
                  updateScenarioA(
                    'investmentHorizonMonths',
                    value ? sharedConfig.investmentHorizonMonths : undefined,
                  )
                }
                customHorizonMonths={scenarioA.investmentHorizonMonths}
                onCustomHorizonMonthsChange={(value) =>
                  updateScenarioA('investmentHorizonMonths', value)
                }
              />
              <ScenarioOverrideCard
                title={t('comparison.scenario_b')}
                colorClass="bg-emerald-100/20 text-slate-900"
                bondType={scenarioB.bondType}
                onBondTypeChange={setBondTypeB}
                rollover={scenarioB.rollover}
                onRolloverChange={(value) => updateScenarioB('rollover', value)}
                isRebought={scenarioB.isRebought}
                onReboughtChange={(value) => updateScenarioB('isRebought', value)}
                taxStrategy={scenarioB.taxStrategy}
                onTaxStrategyChange={(value) =>
                  updateScenarioB('taxStrategy', value)
                }
                customHorizonEnabled={scenarioB.investmentHorizonMonths !== undefined}
                onCustomHorizonEnabledChange={(value) =>
                  updateScenarioB(
                    'investmentHorizonMonths',
                    value ? sharedConfig.investmentHorizonMonths : undefined,
                  )
                }
                customHorizonMonths={scenarioB.investmentHorizonMonths}
                onCustomHorizonMonthsChange={(value) =>
                  updateScenarioB('investmentHorizonMonths', value)
                }
              />
            </div>

            {!resultsA && !isCalculating ? (
              <ScenarioReadyPanel
                badge={t('comparison.ready_to_compare')}
                title={t('comparison.ready_title')}
                description={t('comparison.ready_desc')}
                steps={[
                  {
                    id: 'shared-base',
                    title: t('comparison.ready_shared_base'),
                    description: t('comparison.ready_shared_base_desc'),
                  },
                  {
                    id: 'scenario-overrides',
                    title: t('comparison.ready_overrides'),
                    description: t('comparison.ready_overrides_desc'),
                  },
                  {
                    id: 'committed-result',
                    title: t('comparison.ready_committed'),
                    description: t('comparison.ready_committed_desc'),
                  },
                ]}
                footerText={t('comparison.ready_footer')}
              />
            ) : null}

            {isCalculating && !resultsA ? (
              <div className="space-y-6">
                <Skeleton className="h-[300px] w-full rounded-[1.8rem] md:h-[360px] md:rounded-3xl" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Skeleton className="h-[180px] rounded-[1.6rem] md:h-[220px] md:rounded-3xl" />
                  <Skeleton className="h-[180px] rounded-[1.6rem] md:h-[220px] md:rounded-3xl" />
                </div>
              </div>
            ) : null}

            {resultsA && resultsB ? (
              <div className={cn('space-y-8', isCalculating && 'opacity-60')}>
                {isDirty ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-700" />
                    <div className="flex items-start gap-3">
                      <p className="text-sm text-amber-900">
                        {t('comparison.stale_results')}
                      </p>
                    </div>
                  </div>
                ) : null}

                <Card className="border shadow-sm">
                  <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2 text-xl font-black">
                      <LineChart className="h-5 w-5 text-primary" />
                      {t('comparison.performance_over_time')}
                    </CardTitle>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t('comparison.chart_header_desc')}
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <ActionMetric
                        label={t('comparison.scenario_a')}
                        value={formatCurrency(resultsA.netPayoutValue)}
                        tone="text-blue-700"
                      />
                      <ActionMetric
                        label={t('comparison.scenario_b')}
                        value={formatCurrency(resultsB.netPayoutValue)}
                        tone="text-emerald-700"
                      />
                      <button
                        type="button"
                        className="rounded-2xl border bg-white px-4 py-3 text-left transition-colors hover:border-primary/40"
                        onClick={handleExportComparisonCSV}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {t('comparison.export')}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                          <FileSpreadsheet className="h-4 w-4 text-primary" />
                          {t('comparison.export_comparison_csv')}
                        </div>
                      </button>
                    </div>

                    <ChartSupportNote
                      title={t('comparison.chart_help_title')}
                      description={t('comparison.chart_help_desc')}
                    />

                    <ChartContainer height={420}>
                      {hasMounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="comparison-a" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="comparison-b" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} minTickGap={24} />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                            <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                            {chartData.length > 12 ? <Brush dataKey="label" height={24} stroke="#cbd5e1" travellerWidth={8} /> : null}
                            <Area type="monotone" dataKey="valA" name={`${inputsA.bondType} (A)`} stroke="#3b82f6" strokeWidth={3} fill="url(#comparison-a)" connectNulls activeDot={{ r: 5, strokeWidth: 0 }} />
                            <Area type="monotone" dataKey="valB" name={`${inputsB.bondType} (B)`} stroke="#10b981" strokeWidth={3} fill="url(#comparison-b)" connectNulls activeDot={{ r: 5, strokeWidth: 0 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : null}
                    </ChartContainer>

                    <div className="mt-6">
                      <SecondaryInsightAccordion
                        title={t('comparison.comparison_chart_help_title')}
                        description={t('comparison.comparison_chart_help_desc')}
                        badge={usesMixedTimelineCadence ? t('comparison.mixed_cadence') : undefined}
                        className="mt-0"
                      >
                        <div className="space-y-4 text-sm leading-7 text-slate-600">
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                            <p>
                              {t('comparison.comparison_chart_help_note')}
                            </p>
                          </div>
                          {usesMixedTimelineCadence ? (
                            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
                              <p className="font-semibold">
                                {t('comparison.mixed_cadence_notice', {
                                  bondTypeA: inputsA.bondType,
                                  cadenceA:
                                    inputsA.payoutFrequency === InterestPayout.MONTHLY
                                      ? t('comparison.cadence_monthly')
                                      : t('comparison.cadence_longer'),
                                  bondTypeB: inputsB.bondType,
                                  cadenceB:
                                    inputsB.payoutFrequency === InterestPayout.MONTHLY
                                      ? t('comparison.cadence_monthly')
                                      : t('comparison.cadence_longer'),
                                })}
                              </p>
                            </div>
                          ) : null}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border bg-white p-4">
                              <p className="text-sm font-bold text-slate-900">
                                {t('comparison.end_level')}
                              </p>
                              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                                {t('comparison.end_level_desc')}
                              </p>
                            </div>
                            <div className="rounded-2xl border bg-white p-4">
                              <p className="text-sm font-bold text-slate-900">
                                {t('comparison.update_rhythm')}
                              </p>
                              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                                {t('comparison.update_rhythm_desc')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </SecondaryInsightAccordion>
                    </div>
                  </CardContent>
                </Card>

                <ComparisonVerdict
                  resultsA={resultsA}
                  resultsB={resultsB}
                  inputsA={inputsA}
                  inputsB={inputsB}
                  expectedInflation={sharedConfig.expectedInflation}
                  taxStrategy={sharedConfig.taxStrategy}
                  formatCurrency={formatCurrency}
                />

                <ComparisonTable
                  resultsA={resultsA}
                  resultsB={resultsB}
                  bondTypeA={inputsA.bondType}
                  bondTypeB={inputsB.bondType}
                  formatCurrency={formatCurrency}
                />

                <SecondaryInsightAccordion
                  title={t('comparison.assumptions_meta')}
                  description={t('comparison.assumptions_meta_desc')}
                  badge={t('comparison.helper_secondary')}
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {[
                      {
                        label: t('comparison.scenario_a'),
                        envelope: envelopeA,
                        warnings: warningsA,
                      },
                      {
                        label: t('comparison.scenario_b'),
                        envelope: envelopeB,
                        warnings: warningsB,
                      },
                    ].map((entry) => (
                      <Card key={entry.label} className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/10 pb-3">
                          <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                            {entry.label} {t('comparison.notes_suffix')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <CalculationMetaPanel
                            warnings={entry.warnings}
                            assumptions={entry.envelope?.assumptions}
                            calculationNotes={entry.envelope?.calculationNotes}
                            dataQualityFlags={entry.envelope?.dataQualityFlags}
                            dataFreshness={entry.envelope?.dataFreshness}
                            compact
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </SecondaryInsightAccordion>
              </div>
            ) : null}
          </div>
        </div>
      )}
      <RecalculateButton
        isDirty={isDirty}
        hasResults={!!resultsA && !!resultsB}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};

const ActionMetric = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) => (
  <div className="rounded-2xl border bg-white px-4 py-3">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
      {label}
    </p>
    <p className={cn('mt-2 text-lg font-black', tone)}>{value}</p>
  </div>
);
