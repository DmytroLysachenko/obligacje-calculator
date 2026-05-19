'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { BondInputs } from '@/features/bond-core/types';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { useLanguage } from '@/i18n';
import { GLOSSARY } from '@/shared/constants/glossary';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
import { getBondRateContextCopy } from '@/shared/lib/bond-rate-context';

interface BondSummaryFooterProps {
  inputs: BondInputs;
  currentDef: BondDefinition;
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
  const rateContext = getBondRateContextCopy(
    inputs.bondType,
    Number(inputs.firstYearRate),
    Number(inputs.margin),
    t,
  );

  return (
    <div className="pt-2 px-6 pb-6">
      <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg border border-dashed">
        <div className="flex justify-between">
          <span>{t('bonds.duration')}:</span>
          <span className="font-bold">
            {formatBondDuration(inputs.duration, language)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>{rateContext.firstPeriodLabel}:</span>
          <span className="font-bold">{rateContext.firstPeriodValueLabel}</span>
        </div>
        {currentDef.margin > 0 && (
          <div className="flex justify-between">
            <span>{t('bonds.margin')}:</span>
            <span className="font-bold">{inputs.margin}%</span>
          </div>
        )}
        {rateContext.laterPeriodsLabel ? (
          <div className="flex justify-between gap-4">
            <span>{t('bonds.rate_context.later_periods')}:</span>
            <span className="text-right font-bold">{rateContext.laterPeriodsLabel}</span>
          </div>
        ) : null}
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
