'use client';

import React from 'react';
import { useComparison } from '../hooks/useComparison';
import { BondInputsForm } from '../../single-calculator/components/BondInputsForm';
import { useLanguage } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ComparisonContainer: React.FC = () => {
  const { 
    inputsA, inputsB, 
    resultsA, resultsB, 
    updateInputA, updateInputB, 
    setBondTypeA, setBondTypeB 
  } = useComparison();
  const { t, language } = useLanguage();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare combined chart data
  const maxYears = Math.max(resultsA.timeline.length, resultsB.timeline.length);
  const chartData = Array.from({ length: maxYears + 1 }).map((_, i) => {
    const pointA = i === 0 ? { nominalValueAfterInterest: inputsA.initialInvestment } : resultsA.timeline[i - 1];
    const pointB = i === 0 ? { nominalValueAfterInterest: inputsB.initialInvestment } : resultsB.timeline[i - 1];
    
    return {
      label: i === 0 ? 'Start' : `Year ${i}`,
      valA: pointA ? pointA.nominalValueAfterInterest : null,
      valB: pointB ? pointB.nominalValueAfterInterest : null,
    };
  });

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">{t('nav.comparison')}</h2>
        <p className="text-muted-foreground mt-2">Compare two different bond investment scenarios side-by-side.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scenario A</Badge>
          <BondInputsForm inputs={inputsA} onUpdate={updateInputA} onBondTypeChange={setBondTypeA} />
        </div>
        <div className="space-y-6">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Scenario B</Badge>
          <BondInputsForm inputs={inputsB} onUpdate={updateInputB} onBondTypeChange={setBondTypeB} />
        </div>
      </div>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-muted/30">
          <CardTitle>Growth Comparison</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Area 
                  type="monotone" 
                  dataKey="valA" 
                  name={`${inputsA.bondType} (A)`} 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fill="url(#colorA)"
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="valB" 
                  name={`${inputsB.bondType} (B)`} 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fill="url(#colorB)" 
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-blue-100 bg-blue-50/10">
          <CardHeader><CardTitle className="text-lg">Summary A</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Net Payout:</span><span className="font-bold text-blue-700">{formatCurrency(resultsA.netPayoutValue)}</span></div>
            <div className="flex justify-between"><span>Total Profit:</span><span className="font-bold text-green-600">{formatCurrency(resultsA.totalProfit)}</span></div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/10">
          <CardHeader><CardTitle className="text-lg">Summary B</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Net Payout:</span><span className="font-bold text-emerald-700">{formatCurrency(resultsB.netPayoutValue)}</span></div>
            <div className="flex justify-between"><span>Total Profit:</span><span className="font-bold text-green-600">{formatCurrency(resultsB.totalProfit)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
