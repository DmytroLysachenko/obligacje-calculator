'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Coins, ShieldCheck, TrendingUp } from 'lucide-react';
import { BondDefinition } from '../../bond-core/constants/bond-definitions';
import { useAppI18n } from '@/i18n/client';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
import { Notice } from '@/shared/components/feedback/Notice';
interface BondEducationCardProps {
    bond: BondDefinition;
}
export const BondEducationCard: React.FC<BondEducationCardProps> = ({ bond }) => {
    const { t, locale: language } = useAppI18n();
    return (<article className="flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/25">
      <div>
        <div className="mb-3 flex items-start justify-between gap-4">
          <span className={bond.isInflationIndexed ? 'surface-chip border-foreground text-foreground' : 'surface-chip'}>
            {bond.isInflationIndexed ? t('bonds.inflation.indexed') : t('bonds.fixed_rate')}
          </span>
          {bond.isFamilyOnly ? (<span className="surface-chip text-foreground">
              {t('bonds.family_only')}
            </span>) : null}
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

        <dl className="grid grid-cols-1 gap-x-4 divide-y divide-border border-y border-border text-xs text-muted-foreground sm:grid-cols-2 sm:divide-y-0">
          <div className="flex items-center justify-between gap-3 py-3 sm:border-b sm:border-border">
            <dt className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-foreground"/>
              {t('bonds.duration')}
            </dt>
            <dd className="font-semibold text-foreground">{formatBondDuration(bond.duration, language)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3 sm:border-b sm:border-border">
            <dt className="flex items-center gap-2">
              <Coins className="h-3.5 w-3.5 text-foreground"/>
              {t('bonds.payout_type')}
            </dt>
            <dd className="font-semibold text-foreground">{bond.isCapitalized ? t('bonds.capitalization') : t('bonds.payout')}</dd>
          </div>
          {bond.margin > 0 ? (
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-success"/>
                {t('bonds.margin')}
              </dt>
              <dd className="font-semibold text-foreground">{bond.margin}%</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-foreground"/>
              {(bond.type === 'OTS'
            ? t('education_page.rate_labels.fixed_term') : bond.type === 'ROR' || bond.type === 'DOR'
            ? t('education_page.rate_labels.first_month') : t('bonds.first_year'))}
            </dt>
            <dd className="font-semibold text-foreground">{bond.firstYearRate}%</dd>
          </div>
        </dl>

        <div className="mt-auto space-y-4 pt-1">
          <Notice tone="warning" title={t('bonds.early_exit_title')} compact>
            {t('bonds.early_exit_desc', { fee: bond.earlyWithdrawalFee })}
          </Notice>
          <Link
            href="/single-calculator"
            className="inline-flex h-9 items-center gap-2 border-b border-foreground text-sm font-semibold text-foreground"
          >
            {t('education.calculate_this_bond')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>);
};





