'use client';

import React from 'react';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

interface LadderTimelineProps {
  results: RegularInvestmentResult;
}

export const LadderTimeline: React.FC<LadderTimelineProps> = ({ results }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pl' ? pl : enGB;

  const maturityData = results.lots.reduce((acc, lot) => {
    const maturityDate = parseISO(lot.maturityDate);
    const key = format(maturityDate, 'yyyy-MM');
    
    if (!acc[key]) {
      acc[key] = {
        date: key,
        displayDate: format(maturityDate, 'MMM yyyy', { locale: dateLocale }),
        amount: 0,
        count: 0
      };
    }
    
    acc[key].amount += lot.netValue;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { date: string; displayDate: string; amount: number; count: number }>);

  const chartData = Object.values(maturityData).sort((a, b) => a.date.localeCompare(b.date));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="border-primary/10 shadow-xl overflow-hidden">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          {t('bonds.maturity_schedule')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="displayDate" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v/1000}k`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground">
                        <p className="font-bold text-xs mb-1">{data.displayDate}</p>
                        <p className="text-primary font-black">{formatCurrency(data.amount)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          {data.count} {data.count === 1 ? t('bonds.bond_singular') : t('bonds.bond_plural')} {t('bonds.maturing')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="amount" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fillOpacity={0.8 + (index / chartData.length) * 0.2} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
          <p className="text-xs text-orange-800 leading-relaxed italic">
            <strong>{t('bonds.strategy_tip')}:</strong> {t('bonds.ladder_tip_desc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
