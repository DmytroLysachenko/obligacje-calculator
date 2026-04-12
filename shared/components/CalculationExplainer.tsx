'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { CalculationResult, TaxStrategy } from '@/features/bond-core/types';
import { Calculator, ShieldCheck, Landmark, ChevronRight, ChevronLeft, ArrowRight, TrendingDown, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CalculationExplainerProps {
  results: CalculationResult;
  taxStrategy?: TaxStrategy;
}

export const CalculationExplainer: React.FC<CalculationExplainerProps> = ({ results, taxStrategy }) => {
  const { t, language } = useLanguage();
  const [exampleYear, setExampleYear] = useState(Math.min(5, results.timeline.length > 1 ? 2 : 1));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const point = results.timeline[exampleYear - 1];
  if (!point) return null;

  const prevPoint = exampleYear > 1 ? results.timeline[exampleYear - 2] : { nominalValueAfterInterest: results.initialInvestment };
  const baseValue = prevPoint.nominalValueAfterInterest;
  const interestEarned = point.netInterest + point.taxDeducted;
  const effectiveTaxRate = point.taxDeducted > 0 ? (point.taxDeducted / (point.netInterest + point.taxDeducted) * 100) : 19;

  return (
    <div className="space-y-8">
      <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            {t('bonds.how_calculated')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step by Step Interest Trace */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5 text-primary" />
                  {t('bonds.step_by_step')}
                </h4>
                <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                  <button 
                    onClick={() => setExampleYear(Math.max(1, exampleYear - 1))}
                    disabled={exampleYear === 1}
                    className="p-1 hover:bg-background rounded-full disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] font-black px-2">Y{exampleYear}</span>
                  <button 
                    onClick={() => setExampleYear(Math.min(results.timeline.length, exampleYear + 1))}
                    disabled={exampleYear === results.timeline.length}
                    className="p-1 hover:bg-background rounded-full disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="bg-muted/30 rounded-2xl p-5 border border-primary/5 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">{t('bonds.base_value')}</span>
                  <span className="font-mono font-bold">{formatCurrency(baseValue)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-green-600">
                  <span className="font-medium flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    {t('bonds.plus_interest')} ({point.interestRate.toFixed(2)}%)
                  </span>
                  <span className="font-mono font-bold">+{formatCurrency(interestEarned)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-red-500">
                  <span className="font-medium flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    {t('bonds.minus_tax')} ({effectiveTaxRate.toFixed(0)}%)
                  </span>
                  <span className="font-mono font-bold">-{formatCurrency(point.taxDeducted)}</span>
                </div>
                <div className="pt-3 border-t border-dashed flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-primary">{t('bonds.net_period_gain')}</span>
                  <span className="text-lg font-black text-primary">{formatCurrency(point.netInterest)}</span>
                </div>
              </div>
            </div>

            {/* Inflation Protection Visualizer */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {t('bonds.protection_visualizer')}
              </h4>
              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>{t('common.nominal_value')}</span>
                    <span className="text-slate-900">{formatCurrency(results.grossValue)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-500 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>{t('common.real_value')}</span>
                    <span className="text-primary">{formatCurrency(results.finalRealValue)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(results.finalRealValue / results.grossValue) * 100}%` }} 
                    />
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-orange-600" />
                    <span className="text-[10px] font-black uppercase text-orange-800">{t('bonds.nominal_gap')}</span>
                  </div>
                  <Badge variant="outline" className="bg-white text-orange-700 border-orange-200 font-black">
                    -{Math.round((1 - (results.finalRealValue / results.grossValue)) * 100)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Landmark className="h-3 w-3" />
                {t('bonds.rounding_rules')}
              </h4>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
                <li>{t('bonds.rounding_desc')}</li>
                <li>{t('bonds.tax_rounding_desc')}</li>
                {taxStrategy !== TaxStrategy.STANDARD && (
                  <li className="text-green-600 font-bold">
                    {t('bonds.ike_benefit', { amount: formatCurrency((results.grossValue - results.initialInvestment) * 0.19) })}
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" />
                {t('bonds.key_dates')}
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">{t('bonds.maturity_date')}</span>
                  <span className="font-bold text-foreground">{results.maturityDate}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">{t('bonds.first_cycle_ends')}</span>
                  <span className="font-bold text-foreground">{results.maturityDate}</span>
                </div>
                {results.isEarlyWithdrawal && (
                  <div className="flex justify-between border-b pb-2 text-orange-600">
                    <span className="font-medium">{t('bonds.early_exit_date')}</span>
                    <span className="font-bold">{results.timeline[results.timeline.length - 1].periodLabel}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
