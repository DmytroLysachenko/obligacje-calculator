'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { YearlyTimelinePoint } from '@/features/bond-core/types';
import { ArrowRight, Info, Scale } from 'lucide-react';

interface CalculationAuditTraceProps {
  point: YearlyTimelinePoint;
  initialInvestment: number;
}

export const CalculationAuditTrace: React.FC<CalculationAuditTraceProps> = ({ point, initialInvestment }) => {
  const { t, language } = useLanguage();

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { 
      style: 'currency', 
      currency: 'PLN',
    }).format(val);

  const formatPercent = (val: number) => `${val.toFixed(2)}%`;

  return (
    <Card className="border-2 border-primary/10 shadow-lg rounded-2xl overflow-hidden bg-card">
      <CardHeader className="bg-primary/5 border-b border-dashed py-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-black uppercase tracking-widest">
            {t('bonds.interest_example_title').replace('{{year}}', point.year.toString())}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{t('bonds.base_value')}</span>
          <span className="font-bold">{formatCurrency(point.nominalValueBeforeInterest)}</span>
        </div>

        <div className="bg-muted/30 rounded-xl p-4 space-y-2 border border-border/50">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-primary tracking-tighter">{t('common.interest_rate')}</span>
              <span className="text-xs font-bold">{formatPercent(point.interestRate)}</span>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground italic leading-tight">
                {point.rateSource}
                {point.rateReferenceValue !== undefined && ` (${formatPercent(point.rateReferenceValue)} ref)`}
                {point.rateMarginApplied !== undefined && ` + ${formatPercent(point.rateMarginApplied)} margin`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Plus className="h-3 w-3 text-green-600" />
              {t('bonds.plus_interest')}
            </span>
            <span className="font-bold text-green-600">+{formatCurrency(point.interestEarned)}</span>
          </div>
          
          {point.taxDeducted > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Minus className="h-3 w-3 text-orange-600" />
                {t('bonds.minus_tax')}
              </span>
              <span className="font-bold text-orange-600">-{formatCurrency(point.taxDeducted)}</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-dashed flex justify-between items-center">
          <span className="font-black uppercase text-xs tracking-widest">{t('bonds.net_period_gain')}</span>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" />
            <span className="text-lg font-black text-primary">{formatCurrency(point.netInterest)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Plus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const Minus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/></svg>
);
