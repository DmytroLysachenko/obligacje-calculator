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
import { CheckCircle2, FileSpreadsheet, History, LineChart, Scale, TriangleAlert } from 'lucide-react';
import { CalculationResult, TaxStrategy } from '@/features/bond-core/types';
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
import { convertTimelineToCSV, downloadFile } from '@/shared/lib/csv-utils';
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

  const handleExportCSV = (results: CalculationResult | null, bondType: string) => {
    if (!results) return;

    const headers = {
      period: t('bonds.calculation_trace.header_year'),
      capital: t('bonds.calculation_trace.header_capital'),
      rate: t('bonds.calculation_trace.header_rate'),
      interest: t('bonds.calculation_trace.header_interest'),
      tax: t('bonds.calculation_trace.header_tax'),
      nominalValue: t('bonds.calculation_trace.header_value_after'),
      realValue: t('bonds.inflation.adjusted'),
    };

    const csv = convertTimelineToCSV(results.timeline, headers);
    downloadFile(
      csv,
      `bond_comparison_${bondType}_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv',
    );
  };

  const formatCurrency = (value: number) => {
    if (!hasMounted) return '---';

    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(value);
  };

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

    return anchorDates.map((date, index) => ({
      dateKey: date.toISOString(),
      label:
        index === 0
          ? t('comparison.start')
          : format(date, 'MMM yyyy', {
              locale: language === 'pl' ? pl : enGB,
            }),
      valA: seriesA[index],
      valB: seriesB[index],
    }));
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
                {t('comparison.shared_scenario')}
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Keep one shared base scenario, then apply scenario-specific overrides only when they matter.
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
                  bondType={scenarioA.bondType}
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

              <Button
                className="h-11 w-full font-black uppercase tracking-wide"
                onClick={() => calculate()}
                disabled={isCalculating}
              >
                {isCalculating ? t('common.calculating') : 'Run independent comparison'}
              </Button>
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
              <Card className="border shadow-sm">
                <CardContent className="space-y-6 p-6 md:p-8">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                      <Scale className="h-3.5 w-3.5 text-primary" />
                      {t('comparison.ready_to_compare')}
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">
                      Compare two committed scenarios, not two moving targets.
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                      Set the shared base first, change scenario overrides only if needed, then run one clean comparison.
                      Start with the scenario summary before reading the chart row by row.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <ReadyStep
                      title="Shared base"
                      description="Amount, dates, inflation path, and tax wrapper."
                    />
                    <ReadyStep
                      title="Scenario overrides"
                      description="Bond type and optional per-scenario adjustments."
                    />
                    <ReadyStep
                      title="Committed result"
                      description="Run comparison, then inspect snapshot, chart, and table."
                    />
                  </div>

                  <div className="max-w-xs">
                    <Button onClick={() => calculate()} className="w-full">
                      {t('common.calculate')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {isCalculating && !resultsA ? (
              <div className="space-y-6">
                <Skeleton className="h-[360px] w-full rounded-3xl" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Skeleton className="h-[220px] rounded-3xl" />
                  <Skeleton className="h-[220px] rounded-3xl" />
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
                        Inputs changed. Results below are stale until you rerun the comparison.
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
                      Chart points are aligned by actual calendar date so both scenarios share one time axis.
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                        onClick={() => handleExportCSV(resultsA, inputsA.bondType)}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Export
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                          <FileSpreadsheet className="h-4 w-4 text-primary" />
                          CSV ({inputsA.bondType})
                        </div>
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border bg-white px-4 py-3 text-left transition-colors hover:border-primary/40"
                        onClick={() => handleExportCSV(resultsB, inputsB.bondType)}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Export
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                          <FileSpreadsheet className="h-4 w-4 text-primary" />
                          CSV ({inputsB.bondType})
                        </div>
                      </button>
                    </div>

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
                        title={language === 'pl' ? 'Jak czytac wykres porownawczy' : 'How to read the comparison chart'}
                        description={
                          language === 'pl'
                            ? 'Wykres sluzy do wychwycenia ksztaltu scenariusza. Szczegoly kadencji wyplat i rytmu aktualizacji mozna rozwinac tylko wtedy, gdy sa potrzebne.'
                            : 'Use the chart to spot the scenario shape. Payout cadence and update rhythm stay available on demand, not as permanent noise.'
                        }
                        badge={usesMixedTimelineCadence ? (language === 'pl' ? 'Mieszany rytm' : 'Mixed cadence') : undefined}
                        className="mt-0"
                      >
                        <div className="space-y-4 text-sm leading-7 text-slate-600">
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                            <p>
                              {language === 'pl'
                                ? 'Najpierw odczytaj poziom koncowy obu scenariuszy. Dopiero potem patrz na nachylenie linii i odcinki plaskie.'
                                : 'Read the final level of both scenarios first. Only then inspect slope changes and flat stretches.'}
                            </p>
                          </div>
                          {usesMixedTimelineCadence ? (
                            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
                              <p className="font-semibold">
                                {language === 'pl'
                                  ? `To porownanie miesza rozne kadencje wyplat: ${inputsA.bondType} aktualizuje sie ${
                                      inputsA.payoutFrequency === InterestPayout.MONTHLY ? 'miesiecznie' : 'rzadziej'
                                    }, a ${inputsB.bondType} aktualizuje sie ${
                                      inputsB.payoutFrequency === InterestPayout.MONTHLY ? 'miesiecznie' : 'rzadziej'
                                    }.`
                                  : `This comparison mixes payout cadences: ${inputsA.bondType} updates ${
                                      inputsA.payoutFrequency === InterestPayout.MONTHLY ? 'monthly' : 'on longer cycles'
                                    }, while ${inputsB.bondType} updates ${
                                      inputsB.payoutFrequency === InterestPayout.MONTHLY ? 'monthly' : 'on longer cycles'
                                    }.`}
                              </p>
                            </div>
                          ) : null}
                          <div className="grid gap-4 md:grid-cols-2">
                            <ReadyStep
                              title={language === 'pl' ? 'Poziom koncowy' : 'End level'}
                              description={
                                language === 'pl'
                                  ? 'Pokazuje, ktory scenariusz konczy wyzej przy tych samych zalozeniach.'
                                  : 'Shows which scenario finishes higher under the same assumptions.'
                              }
                            />
                            <ReadyStep
                              title={language === 'pl' ? 'Rytm aktualizacji' : 'Update rhythm'}
                              description={
                                language === 'pl'
                                  ? 'Plaskie odcinki nie oznaczaja stagnacji. Czasem oznaczaja tylko rzadsze kapitalizowanie lub wyplate.'
                                  : 'Flat segments do not automatically mean stagnation. They can simply reflect slower crediting or payout timing.'
                              }
                            />
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
                  title={language === 'pl' ? 'Zalozenia i meta scenariuszy' : 'Scenario assumptions and meta'}
                  description={
                    language === 'pl'
                      ? 'Obie strony porownania zachowuja jawne zalozenia i ostrzezenia, ale nie powinny dominowac nad wynikiem i tabela.'
                      : 'Both scenarios keep explicit assumptions and warnings, but they should not dominate the outcome and table.'
                  }
                  badge={language === 'pl' ? 'Pomocnicze' : 'Secondary'}
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
                            {entry.label} {t('common.notes')}
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
        isDirty={isDirty && !!resultsA && !!resultsB}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};

const ReadyStep = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border bg-white p-4">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

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
