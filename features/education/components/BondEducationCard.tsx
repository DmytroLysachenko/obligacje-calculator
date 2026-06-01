'use client';
import React from 'react';
import { AlertCircle, Clock, Coins, ShieldCheck, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BondDefinition } from '../../bond-core/constants/bond-definitions';
import { useAppI18n } from '@/i18n/client';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
interface BondEducationCardProps {
    bond: BondDefinition;
}
export const BondEducationCard: React.FC<BondEducationCardProps> = ({ bond }) => {
    const { t, locale: language } = useAppI18n();
    return (<article className="flex h-full flex-col border-t border-border py-5 transition-colors hover:border-foreground/20">
      <div>
        <div className="mb-3 flex items-start justify-between gap-4">
          <Badge variant={bond.isInflationIndexed ? 'default' : 'secondary'}>
            {bond.isInflationIndexed ? t('bonds.inflation.indexed') : t('bonds.fixed_rate')}
          </Badge>
          {bond.isFamilyOnly ? (<Badge variant="outline" className="border-border text-foreground">
              {t('bonds.family_only')}
            </Badge>) : null}
        </div>
        <h4 className="flex items-baseline gap-3">
          <span className="text-[32px] font-semibold leading-none text-foreground">{bond.name}</span>
          <span className="text-sm font-medium text-muted-foreground">
            {formatBondDuration(bond.duration, language)}
          </span>
        </h4>
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
          {bond.fullName[language]}
        </p>
      </div>
      <div className="flex-1 space-y-4 pt-4">
        <p className="text-sm leading-relaxed">{bond.description[language]}</p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-foreground"/>
            <span>
              {t('bonds.duration')}: <strong>{formatBondDuration(bond.duration, language)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Coins className="h-3.5 w-3.5 text-foreground"/>
            <span>
              {t('bonds.payout_type')}: <strong>{bond.isCapitalized ? t('bonds.capitalization') : t('bonds.payout')}</strong>
            </span>
          </div>
          {bond.margin > 0 ? (<div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-success"/>
              <span>
                {t('bonds.margin')}: <strong>{bond.margin}%</strong>
              </span>
            </div>) : null}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-foreground"/>
            <span>
              {(bond.type === 'OTS'
            ? t('education_page.rate_labels.fixed_term') : bond.type === 'ROR' || bond.type === 'DOR'
            ? t('education_page.rate_labels.first_month') : t('bonds.first_year'))}
              : <strong> {bond.firstYearRate}%</strong>
            </span>
          </div>
        </div>

        <div className="mt-auto pt-1">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning"/>
            <div className="text-[10px] text-muted-foreground">
              <span className="mb-1 block font-bold text-foreground">{t('bonds.early_exit_title')}:</span>
              {t('bonds.early_exit_desc', { fee: bond.earlyWithdrawalFee })}
            </div>
          </div>
        </div>
      </div>
    </article>);
};





