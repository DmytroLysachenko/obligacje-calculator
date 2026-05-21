'use client';
import React from 'react';
import { AlertCircle, Clock, Coins, ShieldCheck, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BondDefinition } from '../../bond-core/constants/bond-definitions';
import { useAppI18n } from '@/i18n/client';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
interface BondEducationCardProps {
    bond: BondDefinition;
}
export const BondEducationCard: React.FC<BondEducationCardProps> = ({ bond }) => {
    const { t, locale: language } = useAppI18n();
    return (<Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="mb-2 flex items-start justify-between">
          <Badge variant={bond.isInflationIndexed ? 'default' : 'secondary'}>
            {bond.isInflationIndexed ? t('bonds.inflation.indexed') : t('bonds.fixed_rate')}
          </Badge>
          {bond.isFamilyOnly ? (<Badge variant="outline" className="border-primary text-primary">
              {t('bonds.family_only')}
            </Badge>) : null}
        </div>
        <CardTitle className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">{bond.name}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {formatBondDuration(bond.duration, language)}
          </span>
        </CardTitle>
        <CardDescription className="font-medium text-foreground/80">
          {bond.fullName[language]}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm leading-relaxed">{bond.description[language]}</p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-primary"/>
            <span>
              {t('bonds.duration')}: <strong>{formatBondDuration(bond.duration, language)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Coins className="h-3.5 w-3.5 text-primary"/>
            <span>
              {t('bonds.payout_type')}: <strong>{bond.isCapitalized ? t('bonds.capitalization') : t('bonds.payout')}</strong>
            </span>
          </div>
          {bond.margin > 0 ? (<div className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-primary"/>
              <span>
                {t('bonds.margin')}: <strong>{bond.margin}%</strong>
              </span>
            </div>) : null}
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-primary"/>
            <span>
              {(bond.type === 'OTS'
            ? t("generated.features.education.components.bond_education_card.item_1") : bond.type === 'ROR' || bond.type === 'DOR'
            ? t("generated.features.education.components.bond_education_card.item_2") : t('bonds.first_year'))}
              : <strong> {bond.firstYearRate}%</strong>
            </span>
          </div>
        </div>

        <div className="mt-auto border-t pt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500"/>
            <div className="text-[10px] text-muted-foreground">
              <span className="mb-1 block font-bold text-foreground">{t('bonds.early_exit_title')}:</span>
              {t('bonds.early_exit_desc').replace('{fee}', bond.earlyWithdrawalFee.toString())}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);
};





