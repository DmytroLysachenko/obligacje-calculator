'use client';
import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { BondInputs } from '@/features/bond-core/types';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { useAppI18n } from '@/i18n/client';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
import { getBondRateContextCopy } from '@/shared/lib/bond-rate-context';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { ParameterSummary } from '@/shared/components/results/ParameterSummary';

interface BondSummaryFooterProps {
    inputs: BondInputs;
    currentDef: BondDefinition;
    maturityDate: Date;
    hasMounted: boolean;
}
export const BondSummaryFooter: React.FC<BondSummaryFooterProps> = React.memo(({ inputs, currentDef, maturityDate, hasMounted, }) => {
    const { t, locale: language } = useAppI18n();
    const dateLocale = getDateFnsLocale(language);
    const rateContext = getBondRateContextCopy(inputs.bondType, Number(inputs.firstYearRate), Number(inputs.margin), t);
    const summaryItems = [
        {
            label: t('bonds.duration'),
            value: formatBondDuration(inputs.duration, language),
        },
        {
            label: rateContext.firstPeriodLabel,
            value: rateContext.firstPeriodValueLabel,
        },
        ...(currentDef.margin > 0 ? [{
            label: t('bonds.margin'),
            value: `${inputs.margin}%`,
        }] : []),
        ...(rateContext.laterPeriodsLabel ? [{
            label: t('bonds.rate_context.later_periods'),
            value: rateContext.laterPeriodsLabel,
        }] : []),
        {
            label: t('bonds.maturity_date'),
            value: hasMounted ? format(maturityDate, 'PPP', { locale: dateLocale }) : '---',
        },
        {
            label: (<span className="inline-flex items-center gap-1">
              {t('bonds.payout_type')}
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground"/>
                </TooltipTrigger>
                <TooltipContent>
                  {t('bonds.glossary.capitalization')}
                </TooltipContent>
              </Tooltip>
            </span>),
            value: inputs.isCapitalized ? t('bonds.capitalization') : t('bonds.payout'),
        },
        {
            label: (<span className="inline-flex items-center gap-1">
              {t('bonds.early_withdrawal_fee')}
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground"/>
                </TooltipTrigger>
                <TooltipContent>
                  {t('bonds.glossary.early_withdrawal')}
                </TooltipContent>
              </Tooltip>
            </span>),
            value: `${inputs.earlyWithdrawalFee} PLN`,
        },
    ];
    return (<div className="pt-2 px-6 pb-6">
      <ParameterSummary items={summaryItems} variant="compact" />
    </div>);
});
BondSummaryFooter.displayName = 'BondSummaryFooter';




