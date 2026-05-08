'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { addYears } from 'date-fns';
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { getBondSupportMeta } from '@/features/bond-core/support-matrix';
import { BondComparisonCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { getBondColor } from '@/shared/constants/bond-colors';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';

type ComparisonResultItem = BondComparisonCalculationEnvelope['result'][number];
type ChartDataPoint = {
  date: string;
  year: number;
} & Partial<Record<BondType, number>>;

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function ResultMetric({
  label,
  value,
  tone = 'text-slate-900',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={cn('mt-2 text-lg font-black', tone)}>{value}</p>
    </div>
  );
}

export const BondComparisonContainer = () => {
  const { language, t } = useLanguage();
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [expectedInflation, setExpectedInflation] = useState(3.5);
  const [expectedNbpRate, setExpectedNbpRate] = useState(5.25);
  const [duration, setDuration] = useState(10);
  const [selectedBonds, setSelectedBonds] = useState<BondType[]>([
    BondType.EDO,
    BondType.COI,
    BondType.ROR,
  ]);
  const [envelope, setEnvelope] =
    useState<BondComparisonCalculationEnvelope | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRealValue, setShowRealValue] = useState(false);
  const [reinvest, setReinvest] = useState(true);
  const [isDirty, setIsDirty] = useState(true);

  const results = useMemo(
    () => (Array.isArray(envelope?.result) ? envelope.result : []),
    [envelope],
  );
  const purchaseDate = new Date().toISOString().split('T')[0];
  const withdrawalDate = addYears(new Date(purchaseDate), duration)
    .toISOString()
    .split('T')[0];

  const calculateComparison = useCallback(async () => {
    setLoading(true);
    setIsDirty(false);
    try {
      const response = await fetch('/api/calculate/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'normalized',
          bondTypes: selectedBonds,
          initialInvestment,
          purchaseDate,
          withdrawalDate,
          expectedInflation,
          expectedNbpRate,
          taxStrategy: TaxStrategy.STANDARD,
          reinvest,
        }),
      });
      const data = await response.json();
      const nextEnvelope = data?.data ?? data;
      setEnvelope(nextEnvelope);
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  }, [
    expectedInflation,
    expectedNbpRate,
    initialInvestment,
    purchaseDate,
    reinvest,
    selectedBonds,
    withdrawalDate,
  ]);

  const onUpdateAssumption = (key: string, value: unknown) => {
    setIsDirty(true);
    if (key === 'expectedInflation') setExpectedInflation(value as number);
    if (key === 'expectedNbpRate') setExpectedNbpRate(value as number);
  };

  const toggleBond = (type: BondType) => {
    setIsDirty(true);
    setSelectedBonds((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  };

  const chartData = useMemo(() => {
    if (results.length === 0) return [];

    const dataMap = new Map<string, ChartDataPoint>();

    results.forEach((result: ComparisonResultItem) => {
      result.result.timeline.forEach((point) => {
        const key = point.periodLabel;
        if (!dataMap.has(key)) {
          dataMap.set(key, { date: key, year: point.year });
        }
        const entry = dataMap.get(key);
        if (entry) {
          entry[result.type] = showRealValue ? point.realValue : point.totalValue;
        }
      });
    });

    return Array.from(dataMap.values()).sort((a, b) => a.year - b.year);
  }, [results, showRealValue]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(value);

  const bestResult = useMemo(() => {
    if (results.length === 0) {
      return null;
    }

    return results.reduce((best, current) =>
      current.result.netPayoutValue > best.result.netPayoutValue ? current : best,
    );
  }, [results]);

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Scale className="h-4 w-4 text-primary" />
                Shared scenario
              </CardTitle>
              <CardDescription>
                One amount, one horizon, one assumption set. This isolates bond structure differences under the same setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Initial sum
                </Label>
                <CommittedSliderInput
                  value={initialInvestment}
                  min={1000}
                  max={100000}
                  step={100}
                  unit="PLN"
                  onCommit={(value) => {
                    setInitialInvestment(value);
                    setIsDirty(true);
                  }}
                />
              </div>

              <div className="space-y-2 border-t border-dashed pt-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Horizon
                </Label>
                <CommittedSliderInput
                  value={duration}
                  min={1}
                  max={30}
                  step={1}
                  unit={t('common.years')}
                  onCommit={(value) => {
                    setDuration(value);
                    setIsDirty(true);
                  }}
                />
              </div>

              <div className="space-y-4 border-t border-dashed pt-4">
                <MarketAssumptionsForm
                  expectedInflation={expectedInflation}
                  expectedNbpRate={expectedNbpRate}
                  bondType={
                    selectedBonds.includes(BondType.ROR) ||
                    selectedBonds.includes(BondType.DOR)
                      ? BondType.ROR
                      : BondType.EDO
                  }
                  onUpdate={(key, value) => onUpdateAssumption(String(key), value)}
                  compact
                />
              </div>

              <div className="space-y-3 border-t border-dashed pt-4">
                <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {t('bonds.inflation.adjusted')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Switch chart and cards between nominal and real values.
                    </p>
                  </div>
                  <Switch checked={showRealValue} onCheckedChange={setShowRealValue} />
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{t('bonds.reinvest')}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Allow shorter bonds to roll forward if the comparison horizon runs longer than one cycle.
                    </p>
                  </div>
                  <Switch
                    checked={reinvest}
                    onCheckedChange={(value) => {
                      setReinvest(value);
                      setIsDirty(true);
                    }}
                  />
                </div>
              </div>

              <Button
                className="h-11 w-full font-black uppercase tracking-wide"
                onClick={calculateComparison}
                disabled={loading || selectedBonds.length === 0}
              >
                {loading ? 'Calculating...' : 'Run shared comparison'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-sm font-black uppercase tracking-widest">
                Bonds in this run
              </CardTitle>
              <CardDescription>
                Pick only the bonds you actually want in the same scenario. Fewer bonds usually produce a clearer read.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Selected
                </p>
                <Badge variant="outline" className="font-black">
                  {selectedBonds.length}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(BondType).map((type) => (
                  <Button
                    key={type}
                    variant={selectedBonds.includes(type) ? 'default' : 'outline'}
                    className={cn(
                      'h-auto min-h-12 justify-start px-3 py-2 text-[10px] font-black uppercase tracking-tight',
                      !selectedBonds.includes(type) && 'text-slate-700',
                    )}
                    onClick={() => toggleBond(type)}
                  >
                    <div className="flex flex-col items-start leading-tight">
                      <span>{type}</span>
                      <span
                        className={cn(
                          'text-[9px] font-semibold normal-case opacity-80',
                          selectedBonds.includes(type)
                            ? 'text-primary-foreground/80'
                            : 'text-slate-500',
                        )}
                      >
                        {getBondSupportMeta(type).shortLabel}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                Interpretation note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-amber-900">
              <p>
                This page compares modeled outcomes for one committed scenario at a time.
              </p>
              <p>
                Read differences as scenario tradeoffs, not as personal advice or a universal best bond.
              </p>
              <p>
                ROS and ROD can still appear here, but only as conditional household-eligibility cases.
              </p>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-8">
          {!results.length && !loading ? (
            <Card className="border">
              <CardContent className="space-y-6 p-6 md:p-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    {t('comparison.ready_to_compare')}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">
                    Keep one shared scenario. Compare only what matters.
                  </h3>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                    Select the bonds, commit the shared assumptions, then run one clean comparison.
                    Start with the outcome cards first. Use the chart only to inspect path differences over time.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <ResultMetric
                    label="Step 1"
                    value="Select bonds"
                  />
                  <ResultMetric
                    label="Step 2"
                    value="Set shared assumptions"
                  />
                  <ResultMetric
                    label="Step 3"
                    value="Run comparison"
                  />
                </div>

                <div className="max-w-xs">
                  <Button
                    className="w-full"
                    onClick={calculateComparison}
                    disabled={selectedBonds.length === 0}
                  >
                    {t('common.calculate')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {loading && !results.length ? (
            <div className="flex h-[420px] items-center justify-center rounded-3xl border bg-card">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : null}

          {results.length ? (
            <>
              {isDirty ? (
                <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-medium text-amber-900">
                    Inputs changed. Results below still reflect the previous committed comparison.
                  </p>
                  <Button
                    variant="outline"
                    className="border-amber-300 bg-white"
                    onClick={calculateComparison}
                  >
                    {t('common.recalculate')}
                  </Button>
                </div>
              ) : null}

              {bestResult ? (
                <Card className="border shadow-sm">
                  <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Shared-scenario snapshot
                      </div>
                      <h3 className="text-2xl font-black tracking-tight text-slate-900">
                        {bestResult.type} shows the highest modeled net payout in this setup.
                      </h3>
                      <p className="text-sm leading-7 text-muted-foreground">
                        This only applies to the selected amount, horizon, tax treatment, and assumptions above.
                        Change the scenario and the relative order can change too.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                      <ResultMetric
                        label="Leading bond"
                        value={bestResult.type}
                        tone="text-primary"
                      />
                      <ResultMetric
                        label="Net payout"
                        value={formatCurrency(bestResult.result.netPayoutValue)}
                        tone="text-emerald-700"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="border shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="text-xl font-black">
                    {t('comparison.performance_over_time')}
                  </CardTitle>
                  <CardDescription>
                    Same amount, same horizon, same assumptions. Only bond structure differs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer height={420}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(0,0,0,0.05)"
                        />
                        <XAxis
                          dataKey="date"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={40}
                        />
                        <YAxis
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                          }}
                          formatter={(value: ValueType | undefined) =>
                            formatCurrency(Number(value ?? 0))
                          }
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                        {chartData.length > 24 ? (
                          <Brush
                            dataKey="date"
                            height={22}
                            stroke="#64748b"
                            travellerWidth={8}
                          />
                        ) : null}
                        {selectedBonds.map((type) => (
                          <Line
                            key={type}
                            type="monotone"
                            dataKey={type}
                            name={type}
                            stroke={getBondColor(type)}
                            strokeWidth={3}
                            dot={false}
                            animationDuration={700}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.map((result) => {
                  const finalValue = result.result.netPayoutValue;
                  const profit = result.result.totalProfit;
                  const roi = (finalValue / initialInvestment - 1) * 100;

                  return (
                    <Card key={result.type} className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <Badge
                            variant="outline"
                            className="font-black text-[10px] tracking-widest"
                          >
                            {result.type}
                          </Badge>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            {showRealValue ? 'Real view' : 'Nominal view'}
                          </span>
                        </div>
                        <CardTitle className="pt-2 text-2xl font-black">
                          {formatCurrency(finalValue)}
                        </CardTitle>
                        <CardDescription>
                          {BOND_DEFINITIONS[result.type as BondType].fullName[language]}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        <ResultMetric
                          label={t('comparison.net_profit')}
                          value={`+${formatCurrency(profit)}`}
                          tone="text-emerald-700"
                        />
                        <ResultMetric
                          label={t('bonds.total_roi')}
                          value={formatPct(roi)}
                        />
                        <ResultMetric
                          label="Tax"
                          value={formatCurrency(result.result.totalTax)}
                          tone="text-orange-700"
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <CalculationMetaPanel
        warnings={envelope?.warnings}
        assumptions={envelope?.assumptions}
        calculationNotes={envelope?.calculationNotes}
        dataQualityFlags={envelope?.dataQualityFlags}
        dataFreshness={envelope?.dataFreshness}
      />
    </div>
  );
};
