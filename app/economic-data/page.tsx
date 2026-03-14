'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { TrendingUp, Info, Activity } from 'lucide-react';

// Historical Inflation Data for Poland (approximate YoY %)
const INFLATION_DATA = [
  { year: '2015', rate: -0.9 },
  { year: '2016', rate: -0.6 },
  { year: '2017', rate: 2.0 },
  { year: '2018', rate: 1.6 },
  { year: '2019', rate: 2.3 },
  { year: '2020', rate: 3.4 },
  { year: '2021', rate: 5.1 },
  { year: '2022', rate: 14.4 },
  { year: '2023', rate: 11.4 },
  { year: '2024', rate: 3.7 },
  { year: '2025', rate: 4.5 }, // Estimated
];

export default function EconomicDataPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-primary">{t('nav.economic_data')}</h2>
        <p className="text-xl text-muted-foreground max-w-3xl">
          {t('economic.subtitle')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-lg border-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>{t('economic.inflation_title')}</CardTitle>
            </div>
            <CardDescription>{t('economic.inflation_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={INFLATION_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="year" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number | string) => [`${value}%`, t('common.inflation')]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
                  <ReferenceLine y={2.5} label={{ value: 'NBP Target', position: 'right', fontSize: 10, fill: '#ef4444' }} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-md border-blue-100 bg-blue-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                {t('economic.why_it_matters')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              {t('economic.inflation_impact_desc')}
            </CardContent>
          </Card>

          <Card className="shadow-md border-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                {t('economic.data_source')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {t('economic.source_desc')}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
