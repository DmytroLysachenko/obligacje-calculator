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
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className={cn('border-b pb-4', colorClass)}>
        <CardTitle className="text-sm font-black uppercase tracking-widest">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t('bonds.bond_type')}
          </Label>
          <Select
            value={bondType}
            onValueChange={(value) => onBondTypeChange(value as BondType)}
          >
            <SelectTrigger className="h-11 w-full min-w-0 font-bold [&>span]:truncate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(BondType).map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span>{type}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide",
                          getBondSupportMeta(type).tone === 'caution'
                            ? 'bg-amber-100 text-amber-800'
                            : getBondSupportMeta(type).tone === 'limited'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-emerald-700'
                        )}
                      >
                        {getBondSupportMeta(type).shortLabel}
                      </span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {getBondSupportMeta(type).description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isFamilyBondType(bondType) ? (
            <p className="text-xs leading-5 text-amber-700">
              Family-bond overrides stay available, but only make sense if the household eligibility condition really applies.
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3">
          <div>
            <p className="text-sm font-semibold">{t('bonds.reinvest')}</p>
            <p className="text-[10px] text-muted-foreground">
              {t('bonds.rollover_desc')}
            </p>
          </div>
          <Switch checked={!!rollover} onCheckedChange={onRolloverChange} />
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3">
          <div>
            <p className="text-sm font-semibold">{t('bonds.is_rebought')}</p>
            <p className="text-[10px] text-muted-foreground">
              {t('bonds.is_rebought_desc')}
            </p>
          </div>
          <Switch checked={!!isRebought} onCheckedChange={onReboughtChange} />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
