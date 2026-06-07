'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RegularInvestmentInputs } from '@/features/bond-core/types';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';
import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';

type AdvancedSettingsSectionProps = {
  inputs: RegularInvestmentInputs;
  currentDef: BondDefinition;
  showCustomTax: boolean;
  onShowCustomTaxChange: (value: boolean) => void;
  onUpdate: (key: keyof RegularInvestmentInputs | string, value: unknown) => void;
  t: (key: string) => string;
};

export function AdvancedSettingsSection({
  inputs,
  currentDef,
  showCustomTax,
  onShowCustomTaxChange,
  onUpdate,
  t,
}: AdvancedSettingsSectionProps) {
  return (
    <section>
      <AdvancedAssumptionsDisclosure
        title={t('common.advanced')}
        description={t('bonds.form.advanced_desc')}
      >
        <MarketAssumptionsForm
          expectedInflation={inputs.expectedInflation}
          expectedNbpRate={inputs.expectedNbpRate}
          bondType={inputs.bondType}
          customInflation={inputs.customInflation}
          customNbpRate={inputs.customNbpRate}
          inflationHorizonYears={Math.max(1, Math.ceil(inputs.investmentHorizonMonths / 12))}
          onUpdate={onUpdate}
          compact
        />

        {currentDef.rebuyDiscount > 0 ? (
          <div className="space-y-4 border-t border-border pt-6">
            <FormInlineNotice
              tone="success"
              title={(
                <span className="inline-flex items-center gap-2">
                  {t('bonds.is_rebought')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{t('regular_form.rebuy_help')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
              )}
              description={`${t('bonds.is_rebought_desc')} (-${currentDef.rebuyDiscount.toFixed(2)} PLN/szt)`}
              action={(
                <Switch
                  checked={inputs.isRebought}
                  onCheckedChange={(checked) => onUpdate('isRebought', checked)}
                />
              )}
            />
          </div>
        ) : null}

        <div className="space-y-4 border-t border-border pt-6">
          <FormInlineNotice
            title={t('bonds.reinvest')}
            description={t('bonds.rollover_desc')}
            action={(
              <Switch
                checked={!!inputs.rollover}
                onCheckedChange={(checked) => onUpdate('rollover', checked)}
              />
            )}
          />

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">
                  {t('bonds.custom_tax_rate')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('regular_form.tax_help')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted-foreground">{t('bonds.belka_tax_desc')}</p>
            </div>
            <Switch checked={showCustomTax} onCheckedChange={onShowCustomTaxChange} />
          </div>

          {showCustomTax ? (
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-sm font-semibold text-muted-foreground">
                {t('bonds.tax_rate')} (%)
              </Label>
              <Input
                id="taxRate"
                type="number"
                className="h-10"
                value={inputs.taxRate}
                onChange={(e) => onUpdate('taxRate', Number(e.target.value))}
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <Label className="text-sm font-semibold text-muted-foreground">
            {t('bonds.chart.granularity')}
          </Label>
          <SegmentedControl
            value={inputs.chartStep ?? 'quarterly'}
            options={(['monthly', 'quarterly', 'yearly'] as const).map((step) => ({
              value: step,
              label: t(`bonds.chart.periods.${step}`),
            }))}
            onValueChange={(step) => onUpdate('chartStep', step)}
            className="grid-cols-3"
          />
        </div>
      </AdvancedAssumptionsDisclosure>
    </section>
  );
}
