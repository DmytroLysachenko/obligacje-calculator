"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { addYears } from "date-fns";
import { Loader2, ArrowRightLeft, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n";
import { cn } from "@/lib/utils";
import { RecalculateButton } from "@/shared/components/RecalculateButton";

export const BondComparisonContainer = () => {
  const { language } = useLanguage();
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [expectedInflation, setExpectedInflation] = useState(3.5);
  const [duration, setDuration] = useState(10);
  const [selectedBonds, setSelectedBonds] = useState<BondType[]>([BondType.EDO, BondType.COI, BondType.ROR]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<Array<{ type: BondType; results: any }>>([]);
  const [loading, setLoading] = useState(false);
  const [showRealValue, setShowRealValue] = useState(false);
  const [reinvest, setReinvest] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

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
          bondTypes: selectedBonds,
          initialInvestment,
          purchaseDate,
          withdrawalDate,
          expectedInflation,
          taxStrategy: TaxStrategy.STANDARD,
          reinvest
        }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBonds, initialInvestment, purchaseDate, withdrawalDate, expectedInflation, reinvest]);

  // Only run once on mount
  useEffect(() => {
    calculateComparison();
  }, [calculateComparison]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isDirty) {
      calculateComparison();
    }
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
    const dataMap = new Map<string, Record<string, unknown>>();
    
    results.forEach(res => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.results.timeline.forEach((point: any) => {
        const key = point.periodLabel;
        if (!dataMap.has(key)) {
           
          dataMap.set(key, { 
            date: key, 
            year: point.year 
          });
        }
        const entry = dataMap.get(key);
        if (entry) {
          entry[res.type] = showRealValue ? point.realValue : point.totalValue;
        }
      });
    });
    
    // Convert to array and sort by year
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Array.from(dataMap.values()).sort((a: any, b: any) => a.year - b.year);
  };
  
  const chartData = prepareChartData();

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', {
      style: 'currency', currency: 'PLN', maximumFractionDigits: 0
    }).format(val);

  return (
    <div className="space-y-8 pb-20" onKeyDown={handleKeyDown}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-8 rounded-3xl border-4 border-primary/10 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-primary">Bond vs Bond</h2>
          </div>
          <p className="text-muted-foreground font-medium">Compare different Polish Treasury Bonds under the same conditions with automatic rollover.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Shared Controls */}
        <aside className="lg:col-span-1 space-y-6">
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Shared Scenario</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="font-bold">Initial Amount</Label>
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
                  <Label className="font-bold">Horizon (Years)</Label>
                  <span className="font-black text-primary">{duration} Years</span>
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
                <div className="flex justify-between">
                  <Label className="font-bold">Expected Inflation</Label>
                  <span className="font-black text-orange-600">{expectedInflation}%</span>
                </div>
                <Slider 
                  value={[expectedInflation]} 
                  min={0} max={20} step={0.1} 
                  onValueChange={([v]) => {
                    setExpectedInflation(v);
                    setIsDirty(true);
                  }} 
                />
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-dashed">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <Label className="text-xs font-black uppercase text-primary">Real Value</Label>
                  <Switch checked={showRealValue} onCheckedChange={setShowRealValue} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-black uppercase text-green-700">Reinvest</Label>
                    <p className="text-[8px] text-green-600 font-bold uppercase leading-tight">Rollover at maturity</p>
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
              <CardTitle className="text-sm font-black uppercase tracking-widest">Bonds to compare</CardTitle>
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
          ) : (
            <>
              <Card className="border-2 shadow-2xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between px-8 py-6">
                  <div>
                    <CardTitle className="text-xl font-black">Performance Over Time</CardTitle>
                    <CardDescription>Comparison based on automatic renewal at maturity.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full border shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live Projection</span>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="h-[450px] w-full">
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
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(val: any) => formatCurrency(Number(val))}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                        {selectedBonds.map((type, idx) => (
                          <Line
                            key={type}
                            type="monotone"
                            dataKey={type}
                            name={type}
                            stroke={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"][idx % 8]}
                            strokeWidth={4}
                            dot={false}
                            animationDuration={1500}
                            connectNulls={true}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.map((res) => {
                  const profit = res.results.totalProfit;
                  const finalVal = res.results.netPayoutValue;
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
                          <span className="text-muted-foreground uppercase">Net Profit</span>
                          <span className="text-green-600">+{formatCurrency(profit)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-muted-foreground uppercase">Total ROI</span>
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

      <RecalculateButton 
        isDirty={isDirty}
        loading={loading}
        onClick={calculateComparison}
      />
    </div>
  );
};
