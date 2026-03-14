'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BondDefinition } from '../../bond-core/constants/bond-definitions';
import { useLanguage } from '@/i18n';
import { 
  Clock, 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BondEducationCardProps {
  bond: BondDefinition;
}

export const BondEducationCard: React.FC<BondEducationCardProps> = ({ bond }) => {
  const { t, language } = useLanguage();

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant={bond.isInflationIndexed ? "default" : "secondary"}>
            {bond.isInflationIndexed ? t('bonds.inflation_indexed') : t('bonds.fixed_rate')}
          </Badge>
          {bond.isFamilyOnly && (
            <Badge variant="outline" className="border-primary text-primary">
              {t('bonds.family_only')}
            </Badge>
          )}
        </div>
        <CardTitle className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">{bond.name}</span>
          <span className="text-sm font-normal text-muted-foreground">{bond.duration} {t('common.years')}</span>
        </CardTitle>
        <CardDescription className="font-medium text-foreground/80">
          {bond.fullName[language]}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm leading-relaxed">
          {bond.description[language]}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{t('bonds.duration')}: <strong>{bond.duration} {t('common.years')}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Coins className="h-3.5 w-3.5 text-primary" />
            <span>{t('bonds.payout')}: <strong>{bond.isCapitalized ? t('bonds.capitalization') : t('bonds.payout')}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span>{t('bonds.margin')}: <strong>{bond.margin}%</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>{t('bonds.first_year')}: <strong>{bond.firstYearRate}%</strong></span>
          </div>
        </div>

        <div className="pt-4 border-t mt-auto">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-muted-foreground">
              <span className="font-bold text-foreground block mb-1">{t('bonds.early_exit_title')}:</span>
              {t('bonds.early_exit_desc').replace('{fee}', bond.earlyWithdrawalFee.toString())}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
