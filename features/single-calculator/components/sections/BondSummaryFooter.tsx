'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { BondInputs } from '@/features/bond-core/types';
import { useLanguage } from '@/i18n';
import { GLOSSARY } from '@/shared/constants/glossary';

interface BondSummaryFooterProps {
  inputs: BondInputs;
  currentDef: any;
  maturityDate: Date;
  hasMounted: boolean;
}

export const BondSummaryFooter: React.FC<BondSummaryFooterProps> = React.memo(({
  inputs,
  currentDef,
  maturityDate,
  hasMounted,
}) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pl' ? pl : enGB;

  return (
    <div className="pt-2 px-6 pb-6">
      <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg border border-dashed">
        <div className="flex justify-between">
          <span>{t('bonds.duration')}:</span>
          <span className="font-bold">
            {inputs.duration < 1 ? `${inputs.duration * 12} ${t('comparison.month')}` : `${inputs.duration} ${t('common.years')}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            {inputs.bondType === 'OTS' ? t('bonds.yield_three_months') : 
             inputs.bondType === 'ROR' || inputs.bondType === 'DOR' ? t('bonds.first_month_rate') : 
             t('bonds.first_year_rate')}:
          </span>
          <span className="font-bold">{inputs.firstYearRate}%</span>
        </div>
        {currentDef.margin > 0 && (
          <div className="flex justify-between">
            <span>{t('bonds.margin')}:</span>
            <span className="font-bold">{inputs.margin}%</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{t('bonds.maturity_date')}:</span>
          <span className="font-bold">{hasMounted ? format(maturityDate, 'PPP', { locale: dateLocale }) : '---'}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            {t('bonds.payout_type')}:
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                {GLOSSARY.CAPITALIZATION.definition[language]}
              </TooltipContent>
            </Tooltip>
          </span>
          <span className="font-bold">
            {inputs.isCapitalized ? t('bonds.capitalization') : t('bonds.payout')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            {t('bonds.early_withdrawal_fee')}:
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                {GLOSSARY.EARLY_WITHDRAWAL.definition[language]}
              </TooltipContent>
            </Tooltip>
          </span>
          <span className="font-bold">{inputs.earlyWithdrawalFee} PLN</span>
        </div>
      </div>
    </div>
  );
});

BondSummaryFooter.displayName = 'BondSummaryFooter';
