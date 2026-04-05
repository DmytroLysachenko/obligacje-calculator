'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { CalculationResult, TaxStrategy } from '@/features/bond-core/types';
import { Info, Calculator, ShieldCheck, Landmark } from 'lucide-react';
import { format } from 'date-fns';

interface CalculationExplainerProps {
  results: CalculationResult;
  taxStrategy?: TaxStrategy;
}

export const CalculationExplainer: React.FC<CalculationExplainerProps> = ({ results, taxStrategy }) => {
  const { t, language } = useLanguage();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const initialCapital = results.initialInvestment;
  const taxSaved = taxStrategy === TaxStrategy.IKE || taxStrategy === TaxStrategy.IKZE 
    ? (results.grossValue - results.initialInvestment) * 0.19 // Rough estimate of what would be paid
    : 0;

  return (
    <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          {t('bonds.how_calculated') || 'How it was calculated'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Landmark className="h-3 w-3" />
              {t('bonds.rounding_rules') || 'Rounding & Tax Rules'}
            </h4>
            <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
              <li>{t('bonds.rounding_desc') || 'All interest is calculated per individual bond (100 PLN) and rounded to the nearest penny (0.01 PLN).'}</li>
              <li>{t('bonds.tax_rounding_desc') || 'Taxes are withheld according to Polish law, with rounding applied at the moment of payout.'}</li>
              {taxStrategy === TaxStrategy.IKE && (
                <li className="text-green-600 font-bold">{t('bonds.ike_benefit', { amount: formatCurrency(taxSaved) }) || `IKE wrapper saved approximately ${formatCurrency(taxSaved)} in Belka tax.`}</li>
              )}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" />
              {t('bonds.key_dates') || 'Key Dates & Milestones'}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span>{t('bonds.maturity_date')}:</span>
                <span className="font-bold text-foreground">{results.maturityDate}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>{t('bonds.first_cycle_ends')}:</span>
                <span className="font-bold text-foreground">{results.maturityDate}</span>
              </div>
              {results.isEarlyWithdrawal && (
                <div className="flex justify-between border-b pb-1 text-orange-600">
                  <span>{t('bonds.early_exit_date')}:</span>
                  <span className="font-bold">{results.timeline[results.timeline.length - 1].periodLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-4 border border-dashed flex gap-4">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p className="font-bold text-foreground mb-1">{t('bonds.explanation_title') || 'About these results'}</p>
            <p>
              {t('bonds.explanation_text') || 'These projections are based on current bond terms and your selected macro-economic assumptions. Actual future rates may vary based on NBP decisions and CPI readings.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
