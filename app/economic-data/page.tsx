'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { TrendingUp, Info, Activity } from 'lucide-react';

import { PageTransition } from '@/shared/components/PageTransition';

const InflationChart = dynamic(() => import('@/features/economic-data/components/InflationChart').then(mod => mod.InflationChart), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground animate-pulse">Loading chart...</div>
});

const NBPRateChart = dynamic(() => import('@/features/economic-data/components/NBPRateChart').then(mod => mod.NBPRateChart), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground animate-pulse">Loading chart...</div>
});

export default function EconomicDataPage() {
  const { t } = useLanguage();

  return (
    <PageTransition>
      <div className="space-y-8">
      <header className="space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-primary">{t('nav.economic_data')}</h2>
        <p className="text-xl text-muted-foreground max-w-3xl">
          {t('economic.subtitle')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg border-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>{t('economic.inflation_title')}</CardTitle>
              </div>
              <CardDescription>{t('economic.inflation_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <InflationChart />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>NBP Reference Rate</CardTitle>
              </div>
              <CardDescription>Historical reference rate set by the National Bank of Poland</CardDescription>
            </CardHeader>
            <CardContent>
              <NBPRateChart />
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
