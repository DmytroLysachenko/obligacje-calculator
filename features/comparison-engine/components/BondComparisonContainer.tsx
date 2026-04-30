"use client";

import React, { useState, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { BondType, TaxStrategy } from "@/features/bond-core/types";
import { BOND_DEFINITIONS } from "@/features/bond-core/constants/bond-definitions";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  Brush,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { addYears } from "date-fns";
import { Loader2, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n";
import { cn } from "@/lib/utils";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";
import { CalculationMetaPanel } from "@/shared/components/CalculationMetaPanel";
import { BondComparisonCalculationEnvelope } from "@/features/bond-core/types/scenarios";
import { getBondColor } from "@/shared/constants/bond-colors";

import { MarketAssumptionsForm } from "@/shared/components/MarketAssumptionsForm";

type ComparisonResultItem = BondComparisonCalculationEnvelope["result"][number];
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
  const [selectedBonds, setSelectedBonds] = useState<BondType[]>([BondType.EDO, BondType.COI, BondType.ROR]);
  const [envelope, setEnvelope] = useState<BondComparisonCalculationEnvelope | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRealValue, setShowRealValue] = useState(false);
  const [reinvest, setReinvest] = useState(true);
  const [isDirty, setIsDirty] = useState(true);

  const results = envelope?.result || [];
  const warnings = envelope?.warnings || [];
  const calculationNotes = envelope?.calculationNotes || [];
  const dataQualityFlags = envelope?.dataQualityFlags || [];

  const purchaseDate = new Date().toISOString().split('T')[0];
  const withdrawalDate = addYears(new Date(purchaseDate), duration).toISOString().split('T')[0];

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
          reinvest
        }),
      });
      const data = await response.json();
      setEnvelope(data);
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBonds, initialInvestment, purchaseDate, withdrawalDate, expectedInflation, expectedNbpRate, reinvest]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isDirty) {
      calculateComparison();
    }
  };

  const onUpdateAssumption = (key: string, value: unknown) => {
    setIsDirty(true);
    if (key === 'expectedInflation') setExpectedInflation(value as number);
    if (key === 'expectedNbpRate') setExpectedNbpRate(value as number);
  };

  const toggleBond = (type: BondType) => {
    setIsDirty(true);
    setSelectedBonds(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Format data for chart
  const prepareChartData = () => {
    if (results.length === 0) return [];
    
    // Map of date string -> chart data point
    const dataMap = new Map<string, ChartDataPoint>();
    
    results.forEach((res: ComparisonResultItem) => {
      res.result.timeline.forEach((point) => {
        const key = point.periodLabel;
        if (!dataMap.has(key)) {
           
          dataMap.set(key, { 
            date: key, 
            year: point.year 
          } as ChartDataPoint);
        }
        const entry = dataMap.get(key) as ChartDataPoint | undefined;
        if (entry) {
          entry[res.type] = showRealValue ? point.realValue : point.totalValue;
        }
      });
    });
    
    // Convert to array and sort by year
    return Array.from(dataMap.values()).sort((a, b) => a.year - b.year);
  };
  
  const chartData = prepareChartData();
const formatCurrency = (val: number) =>
  new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(val);
  return (
    <div className="space-y-8 pb-20" onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Shared Controls */}
        <aside className="lg:col-span-1 space-y-6">
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('comparison.shared_scenario')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="font-bold">{t('comparison.initial_sum')}</Label>
                  <span className="font-black text-primary">{formatCurrency(initialInvestment)}</span>
                </div>
                <Slider 
                  value={[initialInvestment]} 
                  min={1000} max={100000} step={1000} 
                  onValueChange={([v]) => {
                    setInitialInvestment(v);
                    setIsDirty(true);
                  }} 
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed">
                <div className="flex justify-between">
                  <Label className="font-bold">{t('comparison.horizon_years')}</Label>
                  <span className="font-black text-primary">{duration} {t('common.years')}</span>
                </div>
                <Slider 
                  value={[duration]} 
                  min={1} max={30} step={1} 
                  onValueChange={([v]) => {
                    setDuration(v);
                    setIsDirty(true);
                  }} 
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed">
                <MarketAssumptionsForm
                  expectedInflation={expectedInflation}
                  expectedNbpRate={expectedNbpRate}
                  bondType={selectedBonds.includes(BondType.ROR) || selectedBonds.includes(BondType.DOR) ? BondType.ROR : BondType.EDO}
                  onUpdate={(key, value) => onUpdateAssumption(String(key), value)}
                  compact
                />
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-dashed">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <Label className="text-xs font-black uppercase text-primary">{t('bonds.inflation_adjusted')}</Label>
                  <Switch checked={showRealValue} onCheckedChange={setShowRealValue} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-black uppercase text-green-700">{t('bonds.reinvest')}</Label>
                    <p className="text-[8px] text-green-600 font-bold uppercase leading-tight">{t('bonds.rollover_desc')}</p>
                  </div>
                  <Switch checked={reinvest} onCheckedChange={(v) => {
                    setReinvest(v);
                    setIsDirty(true);
                  }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('comparison.bonds_to_compare')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-2">
              {Object.values(BondType).map(type => (
                <Button
                  key={type}
                  variant={selectedBonds.includes(type) ? "default" : "outline"}
                  className={cn(
                    "h-10 text-[10px] font-black uppercase tracking-tighter",
                    selectedBonds.includes(type) ? "bg-primary" : "text-muted-foreground"
                  )}
                  onClick={() => toggleBond(type)}
                >
                  {type}
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Right: Results & Chart */}
        <div className="lg:col-span-3 space-y-8">
          {loading && results.length === 0 ? (
            <div className="h-[500px] flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !results.length ? (
            <div className="flex h-[500px] flex-col items-center justify-center space-y-6 rounded-3xl border-2 border-dashed border-primary/20 bg-muted/10 p-10 text-center">
              <TrendingUp className="h-12 w-12 text-primary/40" />
              <div className="space-y-2">
                <p className="text-lg font-bold">{t('comparison.ready_to_compare')}</p>
                <p className="text-sm text-muted-foreground">{t('comparison.comparison_desc')}</p>
              </div>
              <Button
                className="h-11 px-6 text-sm font-bold"
                onClick={calculateComparison}
              >
                {t('common.calculate')}
              </Button>
            </div>
          ) : (
            <>
              <Card className="border-2 shadow-2xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between px-8 py-6">
                  <div>
                    <CardTitle className="text-xl font-black">{t('comparison.performance_over_time')}</CardTitle>
                    <CardDescription>{t('comparison.comparison_desc')}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full border shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('comparison.live_projection')}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <ChartContainer height={450}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
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
                          tickFormatter={(v) => `${v/1000}k`}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                          formatter={(val: ValueType | undefined) => formatCurrency(Number(val ?? 0))}
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
                            strokeWidth={4}
                            dot={false}
                            animationDuration={1500}
                            connectNulls={true}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {isDirty && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="h-10 px-4 font-bold"
                    onClick={calculateComparison}
                  >
                    {t('common.recalculate')}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.map((res) => {
                  const profit = res.result.totalProfit;
                  const finalVal = res.result.netPayoutValue;
                  const roi = ((finalVal / initialInvestment - 1) * 100).toFixed(1);
                  
                  return (
                    <Card key={res.type} className="border-none shadow-lg bg-gradient-to-br from-card to-muted/20">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="font-black text-[10px] tracking-widest">{res.type}</Badge>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-black pt-2">{formatCurrency(finalVal)}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-muted-foreground uppercase">{t('comparison.net_profit')}</span>
                          <span className="text-green-600">+{formatCurrency(profit)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-muted-foreground uppercase">{t('bonds.total_roi')}</span>
                          <span className="text-primary">{roi}%</span>
                        </div>
                        <div className="pt-4 border-t border-dashed space-y-1">
                          <p className="text-[10px] text-muted-foreground italic font-medium leading-relaxed">
                            {BOND_DEFINITIONS[res.type as BondType].fullName[language]}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <CalculationMetaPanel
        warnings={warnings}
        calculationNotes={calculationNotes}
        dataQualityFlags={dataQualityFlags}
        dataFreshness={envelope?.dataFreshness}
      />
    </div>
  );
};
