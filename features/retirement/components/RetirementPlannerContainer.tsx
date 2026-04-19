'use client';

import React, { useState } from 'react';
import { 
  Target, 
  Wallet, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { RetirementPlannerCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { formatCurrency } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export const RetirementPlannerContainer: React.FC = () => {
  const { isCalculating, post } = useCalculationRequest();
  
  const [inputs, setInputs] = useState({
    initialCapital: 500000,
    monthlyWithdrawal: 3000,
    expectedInflation: 3.5,
    bondType: BondType.EDO,
    taxStrategy: TaxStrategy.STANDARD,
    horizonYears: 25
  });

  const [results, setResults] = useState<RetirementPlannerCalculationEnvelope | null>(null);

  const handleCalculate = async () => {
    const response = await post<RetirementPlannerCalculationEnvelope>('/api/calculate/retirement', inputs);
    setResults(response);
  };

  const chartData = results?.result.timeline.filter((_, idx) => idx % 12 === 0).map(point => ({
    date: point.date,
    year: point.year,
    balance: point.balance,
  })) || [];

  return (
    <CalculatorPageShell
      title="Retirement Sustainability Planner"
      description="Model how long your capital will last during decumulation."
      icon={<Wallet className="h-8 w-8" />}
      isCalculating={isCalculating}
      hasResults={!!results}
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <aside className="xl:col-span-4 space-y-6">
          <Card className="rounded-2xl border-2">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-widest">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Initial Capital (PLN)</Label>
                <Input 
                  type="number" 
                  value={inputs.initialCapital} 
                  onChange={e => setInputs(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
                  className="rounded-xl font-bold"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Monthly Withdrawal</Label>
                  <span className="text-xs font-black text-primary">{formatCurrency(inputs.monthlyWithdrawal)}</span>
                </div>
                <Slider 
                  value={[inputs.monthlyWithdrawal]} 
                  min={500} 
                  max={20000} 
                  step={100} 
                  onValueChange={([val]) => setInputs(prev => ({ ...prev, monthlyWithdrawal: val }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Horizon (Years)</Label>
                  <span className="text-xs font-black text-primary">{inputs.horizonYears}Y</span>
                </div>
                <Slider 
                  value={[inputs.horizonYears]} 
                  min={1} 
                  max={50} 
                  onValueChange={([val]) => setInputs(prev => ({ ...prev, horizonYears: val }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Reinvestment Bond Type</Label>
                <Select 
                  value={inputs.bondType} 
                  onValueChange={val => setInputs(prev => ({ ...prev, bondType: val as BondType }))}
                >
                  <SelectTrigger className="rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BondType.EDO}>EDO (10Y Inflation Indexed)</SelectItem>
                    <SelectItem value={BondType.COI}>COI (4Y Inflation Indexed)</SelectItem>
                    <SelectItem value={BondType.TOS}>TOS (3Y Fixed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full rounded-xl font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20"
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? "Calculating..." : "Run Simulation"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </aside>

        <div className="xl:col-span-8 space-y-8">
          {results ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={cn(
                  "border-2 rounded-2xl overflow-hidden",
                  results.result.isSustainable ? "border-green-500 bg-green-50/30" : "border-red-500 bg-red-50/30"
                )}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl",
                      results.result.isSustainable ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {results.result.isSustainable ? <CheckCircle2 className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-muted-foreground tracking-tighter">Sustainability Status</p>
                      <h3 className="text-xl font-black">
                        {results.result.isSustainable ? "Sustainable Path" : "Capital Depletion Risk"}
                      </h3>
                      {!results.result.isSustainable && (
                        <p className="text-xs font-bold text-red-600">
                          Capital runs out in Year {results.result.exhaustionYear}, Month {results.result.exhaustionMonth}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 rounded-2xl bg-primary text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Target className="h-24 w-24" />
                  </div>
                  <CardContent className="p-6">
                    <p className="text-xs font-black uppercase text-white/70 tracking-tighter">Final Balance (Real Value)</p>
                    <h3 className="text-3xl font-black">{formatCurrency(results.result.finalBalance)}</h3>
                    <p className="text-[10px] font-bold mt-1 text-white/50 italic">Adjusted for reinvestment yield and taxes.</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl border-2 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase tracking-widest">Capital Evolution</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1} />
                        <XAxis 
                          dataKey="year" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fontWeight: 'bold'}}
                          label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'black' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fontWeight: 'bold'}}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ => [formatCurrency(Number(value || 0)), 'Balance']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorBalance)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-700">Total Payouts</p>
                    <p className="text-sm font-bold">{formatCurrency(results.result.totalWithdrawn)}</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-700">Simulation Period</p>
                    <p className="text-sm font-bold">{inputs.horizonYears} Years</p>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-purple-700">Risk Profile</p>
                    <p className="text-sm font-bold">Bond-Only (Conservative)</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-50 space-y-4">
              <Wallet className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">Adjust parameters and run simulation to see sustainability analysis.</p>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
