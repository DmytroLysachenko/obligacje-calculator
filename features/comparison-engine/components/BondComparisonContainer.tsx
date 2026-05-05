'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { getBondSupportMeta } from '@/features/bond-core/support-matrix';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { addYears } from 'date-fns';
import { AlertTriangle, Loader2, Scale, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { BondComparisonCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { getBondColor } from '@/shared/constants/bond-colors';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';

type ComparisonResultItem = BondComparisonCalculationEnvelope['result'][number];
type ChartDataPoint = {
  date: string;
  year: number;
} & Partial<Record<BondType, number>>;

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

  const results = useMemo(() => envelope?.result ?? [], [envelope]);
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
      setEnvelope(data);
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

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Scale className="h-4 w-4 text-primary" />
                Shared Scenario
              </CardTitle>
              <CardDescription>
                Same assumptions for all selected bonds. This mode isolates bond
                structure differences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Initial Sum
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
                      {t('bonds.inflation_adjusted')}
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
                      Allow shorter bonds to roll over if needed.
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
                disabled={loading}
              >
                {loading ? 'Calculating...' : 'Run Bond Ranking'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-sm font-black uppercase tracking-widest">
                Bonds to Compare
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 pt-4">
              {Object.values(BondType).map((type) => (
                <Button
                  key={type}
                  variant={selectedBonds.includes(type) ? 'default' : 'outline'}
                  className={cn(
                    'h-10 text-[10px] font-black uppercase tracking-tight',
                    !selectedBonds.includes(type) && 'text-slate-700',
                  )}
                  onClick={() => toggleBond(type)}
                >
                  <div className="flex flex-col items-start leading-tight">
                    <span>{type}</span>
                    <span
                      className={cn(
                        'text-[9px] font-semibold normal-case opacity-80',
                        selectedBonds.includes(type) ? 'text-primary-foreground/80' : 'text-slate-500',
                      )}
                    >
                      {getBondSupportMeta(type).shortLabel}
                    </span>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                Interpretation Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-amber-900">
              <p>
                This mode ranks modeled outcomes for one shared scenario.
              </p>
              <p>
                Use it to inspect tradeoffs, not as personal advice or a final
                bond choice.
              </p>
              <p>
                ROS and ROD remain available for comparison, but only as conditional
                household-eligibility scenarios.
              </p>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-8">
          {!results.length && !loading ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex h-[420px] flex-col items-center justify-center space-y-4 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/40" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{t('comparison.ready_to_compare')}</p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Select bonds, set the shared scenario, then run the normalized
                    comparison.
                  </p>
                </div>
                <Button onClick={calculateComparison}>{t('common.calculate')}</Button>
              </CardContent>
            </Card>
          ) : null}

          {loading && !results.length ? (
            <div className="flex h-[420px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : null}

          {results.length ? (
            <>
              {isDirty ? (
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-medium text-amber-900">
                    Inputs changed. Rerun the comparison to refresh the chart and cards.
                  </p>
                  <Button variant="outline" className="border-amber-300 bg-white" onClick={calculateComparison}>
                    {t('common.recalculate')}
                  </Button>
                </div>
              ) : null}

              <Card className="border shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="text-xl font-black">
                    {t('comparison.performance_over_time')}
                  </CardTitle>
                  <CardDescription>
                    All selected bonds under the same amount, horizon, and assumptions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer height={420}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                          formatter={(value: ValueType | undefined) => formatCurrency(Number(value ?? 0))}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                        {chartData.length > 24 ? <Brush dataKey="date" height={22} stroke="#64748b" travellerWidth={8} /> : null}
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {results.map((result) => {
                  const finalValue = result.result.netPayoutValue;
                  const profit = result.result.totalProfit;
                  const roi = ((finalValue / initialInvestment - 1) * 100).toFixed(1);

                  return (
                    <Card key={result.type} className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-black text-[10px] tracking-widest">
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
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('comparison.net_profit')}</span>
                          <span className="font-semibold text-green-700">
                            +{formatCurrency(profit)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('bonds.total_roi')}</span>
                          <span className="font-semibold">{roi}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax</span>
                          <span className="font-semibold text-orange-700">
                            {formatCurrency(result.result.totalTax)}
                          </span>
                        </div>
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
