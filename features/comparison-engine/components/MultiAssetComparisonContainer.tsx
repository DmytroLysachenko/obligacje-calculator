'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMultiAssetComparison } from '../hooks/useMultiAssetComparison';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n';
import { TrendingUp, AlertTriangle, ShieldCheck, Wallet } from 'lucide-react';

export const MultiAssetComparisonContainer = () => {
  const { initialSum, setInitialSum, assets } = useMultiAssetComparison();
  const { t } = useLanguage();

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(val);

  // Combine data for chart (align by index/month)
  const chartData = assets.sp500.map((point, i) => ({
    date: point.date,
    sp500: Math.round(point.nominalValue),
    gold: Math.round(assets.gold[i]?.nominalValue || 0),
    savings: Math.round(assets.savings[i]?.nominalValue || 0),
    // Bonds are yearly, so we only show them occasionally or interpolate.
    // For now, let's just use the monthly assets which have more data points.
  }));

  const finalVals = {
    sp500: assets.sp500[assets.sp500.length - 1].nominalValue,
    gold: assets.gold[assets.gold.length - 1].nominalValue,
    savings: assets.savings[assets.savings.length - 1].nominalValue,
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-primary">Multi-Asset Comparison</h2>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Compare how different investment instruments perform over time. 
          See the trade-off between high-growth potential and capital safety.
        </p>
      </header>

      <Card className="border-primary/10 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-bold">Initial Investment</Label>
                <span className="text-2xl font-black text-primary">{formatCurrency(initialSum)}</span>
              </div>
              <Slider 
                value={[initialSum]} 
                min={1000} 
                max={100000} 
                step={1000} 
                onValueChange={([v]) => setInitialSum(v)}
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1 w-full">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">S&P 500 End</p>
                <p className="text-lg font-bold">{formatCurrency(finalVals.sp500)}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-bold uppercase text-amber-600 mb-1">Gold End</p>
                <p className="text-lg font-bold">{formatCurrency(finalVals.gold)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold uppercase text-slate-600 mb-1">Savings End</p>
                <p className="text-lg font-bold">{formatCurrency(finalVals.savings)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-lg overflow-hidden border-primary/5">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Long-Term Growth (Mocked 3-Year Snapshot)
            </CardTitle>
            <CardDescription>Visualizing nominal value growth based on historical volatility patterns.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="sp500" name="S&P 500 (Stocks)" stroke="#3b82f6" strokeWidth={3} fill="url(#colorSp)" />
                  <Area type="monotone" dataKey="gold" name="Gold (XAU)" stroke="#f59e0b" strokeWidth={3} fill="url(#colorGold)" />
                  <Area type="monotone" dataKey="savings" name="Savings Account" stroke="#94a3b8" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-blue-100 bg-blue-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                S&P 500 Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Represents the 500 largest US companies. Historically offers the highest returns (~10% p.a.) but with significant "drawdowns" (price drops) that can last years.
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                Gold Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Historically acts as a store of value during high inflation or geopolitical crisis. It doesn't pay interest but maintains purchasing power over decades.
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-slate-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-slate-500" />
                Savings Account
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              The safest option but rarely beats inflation. Use this only for emergency funds (liquidity) rather than long-term wealth building.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
