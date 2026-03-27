'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { TrendingUp, Info, Activity } from 'lucide-react';
import { PageTransition } from '@/shared/components/PageTransition';
import { InflationChart } from '@/features/economic-data/components/InflationChart';
import { NBPRateChart } from '@/features/economic-data/components/NBPRateChart';
import { cn } from '@/lib/utils';

export default function EconomicDataPage() {
  const { t } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [period, setPeriod] = useState<'1Y' | '5Y' | '10Y' | '30Y' | 'ALL'>('10Y');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  const periods = [
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
    { label: '10Y', value: '10Y' },
    { label: '30Y', value: '30Y' },
    { label: 'MAX', value: 'ALL' },
  ];

  return (
    <PageTransition>
      <div className="space-y-8 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-primary">{t('nav.economic_data')}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl">
              {t('economic.subtitle')}
            </p>
          </div>
          
          <div className="flex bg-muted p-1 rounded-xl border border-border shadow-sm">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value as '1Y' | '5Y' | '10Y' | '30Y' | 'ALL')}
                className={cn(
                  "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all",
                  period === p.value 
                    ? "bg-background text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg border-primary/5 min-h-[500px]">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle>{t('economic.inflation_title')}</CardTitle>
                </div>
                <CardDescription>{t('economic.inflation_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {hasMounted ? <InflationChart period={period} /> : <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground animate-pulse">{t('economic.loading_chart')}</div>}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-primary/5 min-h-[500px]">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle>{t('economic.nbp_rate_title')}</CardTitle>
                </div>
                <CardDescription>{t('economic.nbp_rate_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {hasMounted ? <NBPRateChart period={period} /> : <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground animate-pulse">{t('economic.loading_chart')}</div>}
              </CardContent>
            </Card>
          </div>

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
    </PageTransition>
  );
}
