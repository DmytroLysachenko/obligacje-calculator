'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { getBondSupportMeta, isFamilyBondType } from '@/features/bond-core/support-matrix';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';

interface ScenarioOverrideCardProps {
  title: string;
  colorClass: string;
  bondType: BondType;
  onBondTypeChange: (value: BondType) => void;
  rollover?: boolean;
  onRolloverChange: (value: boolean) => void;
  isRebought?: boolean;
  onReboughtChange: (value: boolean) => void;
  taxStrategy?: TaxStrategy;
  onTaxStrategyChange: (value: TaxStrategy | undefined) => void;
  customHorizonEnabled: boolean;
  onCustomHorizonEnabledChange: (value: boolean) => void;
  customHorizonMonths?: number;
  onCustomHorizonMonthsChange: (value: number | undefined) => void;
}

export const ScenarioOverrideCard: React.FC<ScenarioOverrideCardProps> = ({
  title,
  colorClass,
  bondType,
  onBondTypeChange,
  rollover,
  onRolloverChange,
  isRebought,
  onReboughtChange,
  taxStrategy,
  onTaxStrategyChange,
  customHorizonEnabled,
  onCustomHorizonEnabledChange,
  customHorizonMonths,
  onCustomHorizonMonthsChange,
}) => {
  const { t, language } = useLanguage();
  const { definitions } = useBondDefinitions();
  const formatBondLabel = (type: BondType) =>
    language === 'pl'
      ? {
          [BondType.OTS]: '3 miesiace',
          [BondType.ROR]: '1 rok',
          [BondType.DOR]: '2 lata',
          [BondType.TOS]: '3 lata',
          [BondType.COI]: '4 lata',
          [BondType.ROS]: '6 lat',
          [BondType.EDO]: '10 lat',
          [BondType.ROD]: '12 lat',
        }[type]
      : {
          [BondType.OTS]: '3 months',
          [BondType.ROR]: '1 year',
          [BondType.DOR]: '2 years',
          [BondType.TOS]: '3 years',
          [BondType.COI]: '4 years',
          [BondType.ROS]: '6 years',
          [BondType.EDO]: '10 years',
          [BondType.ROD]: '12 years',
        }[type];
  const formatRateStyle = (type: BondType) => {
    const definition = definitions?.[type];
    if (!definition) {
      return null;
    }

    if (definition.isInflationIndexed) {
      return language === 'pl' ? 'Inflacja + marza' : 'Inflation + margin';
    }

    if (definition.isFloating) {
      return language === 'pl' ? 'NBP + marza' : 'NBP + margin';
    }

    return language === 'pl' ? 'Stala stopa' : 'Fixed rate';
  };

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className={cn('border-b pb-4', colorClass)}>
        <CardTitle className="text-base font-black tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <Label className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {t('bonds.bond.type')}
          </Label>
          <Select
            value={bondType}
            onValueChange={(value) => onBondTypeChange(value as BondType)}
          >
            <SelectTrigger className="h-12 w-full min-w-0 rounded-2xl border-slate-200 bg-white/90 font-bold [&>span]:truncate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(BondType).map((type) => (
                <SelectItem key={type} value={type} className="py-2.5">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-black tracking-tight">{type}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {formatBondLabel(type)}
                      </span>
                      {isFamilyBondType(type) ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          {language === 'pl' ? 'Rodzinne' : 'Family'}
                        </span>
                      ) : null}
                    </div>
                    <span className="truncate text-sm font-medium text-slate-700">
                      {definitions?.[type]?.fullName[language] ?? type}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {formatBondLabel(bondType)}
            </span>
            {formatRateStyle(bondType) ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                {formatRateStyle(bondType)}
              </span>
            ) : null}
          </div>
          {isFamilyBondType(bondType) ? (
            <p className="text-xs leading-5 text-amber-700">
              {language === 'pl'
                ? 'Nadpisania dla obligacji rodzinnych pozostaja dostepne, ale maja sens tylko wtedy, gdy warunek uprawnienia gospodarstwa domowego rzeczywiscie ma zastosowanie.'
                : 'Family-bond overrides stay available, but only make sense if the household eligibility condition really applies.'}
            </p>
          ) : null}
          <p className="text-xs leading-5 text-slate-500">
            {getBondSupportMeta(bondType).description}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3">
          <div>
            <p className="text-sm font-semibold">{t('bonds.reinvest')}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('bonds.rollover_desc')}
            </p>
          </div>
          <Switch checked={!!rollover} onCheckedChange={onRolloverChange} />
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3">
          <div>
            <p className="text-sm font-semibold">{t('bonds.is_rebought')}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('bonds.is_rebought_desc')}
            </p>
          </div>
          <Switch checked={!!isRebought} onCheckedChange={onReboughtChange} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {t('bonds.tax_strategy')}
          </Label>
          <Select
            value={taxStrategy ?? 'shared'}
            onValueChange={(value) =>
              onTaxStrategyChange(
                value === 'shared' ? undefined : (value as TaxStrategy),
              )
            }
          >
            <SelectTrigger className="h-11 w-full min-w-0 [&>span]:truncate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shared">{t('comparison.use_shared_tax')}</SelectItem>
              <SelectItem value={TaxStrategy.STANDARD}>
                {t('bonds.tax_standard')}
              </SelectItem>
              <SelectItem value={TaxStrategy.IKE}>
                {t('bonds.tax_ike')}
              </SelectItem>
              <SelectItem value={TaxStrategy.IKZE}>
                {t('bonds.tax_ikze')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3">
          <div>
            <p className="text-sm font-semibold">{t('comparison.custom_horizon')}</p>
            <p className="text-[10px] text-muted-foreground">
              {t('comparison.custom_horizon_desc')}
            </p>
          </div>
          <Switch
            checked={customHorizonEnabled}
            onCheckedChange={onCustomHorizonEnabledChange}
          />
        </div>

        {customHorizonEnabled ? (
          <div className="space-y-3">
            <Label className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              {t('comparison.scenario_horizon')}
            </Label>
            <CommittedSliderInput
              value={customHorizonMonths ?? 12}
              min={12}
              max={360}
              step={1}
              unit="mo"
              onCommit={(value) => onCustomHorizonMonthsChange(value)}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
