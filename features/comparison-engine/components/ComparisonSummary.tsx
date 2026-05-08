'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';
import { ComparisonSummaryProps } from './types';

export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  verdict,
  totalInvested,
  durationMonths,
  isCalculating,
  formatCurrency,
}) => {
  const { t, language } = useLanguage();
  const leadingLabel =
    language === 'pl' ? 'Prowadzacy scenariusz' : 'Leading scenario';
  const insightLabel = language === 'pl' ? 'Wniosek' : 'Takeaway';

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-primary border-y border-r bg-primary/5 shadow-none">
        <CardContent className="flex items-start gap-5 py-6">
          <div className="rounded-2xl bg-primary/10 p-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xl font-black text-primary">
              {leadingLabel}: {verdict.title}
            </h3>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {verdict.text}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Info className="h-3 w-3" />
              {insightLabel}: {verdict.takeaway}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 rounded-2xl border bg-muted/30 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t('comparison.total_invested')}
            </p>
            <p className="text-2xl font-black text-primary">
              {formatCurrency(totalInvested)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t('comparison.duration')}
            </p>
            <p className="text-2xl font-black text-primary">
              {durationMonths} {t('common.period')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-2">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              isCalculating ? 'bg-amber-500' : 'bg-emerald-500',
            )}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isCalculating
              ? t('comparison.live_calculation')
              : t('comparison.sync_data_stable')}
          </span>
        </div>
      </div>
    </div>
  );
};
