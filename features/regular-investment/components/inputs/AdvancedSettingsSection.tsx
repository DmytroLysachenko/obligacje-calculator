'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RegularInvestmentInputs } from '@/features/bond-core/types';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { cn } from '@/lib/utils';

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
    <section className="border-t border-border pt-6">
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">
                    {t('bonds.is_rebought')}
                  </Label>
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
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('bonds.is_rebought_desc')} (-{currentDef.rebuyDiscount.toFixed(2)} PLN/szt)
                </p>
              </div>
              <Switch
                checked={inputs.isRebought}
                onCheckedChange={(checked) => onUpdate('isRebought', checked)}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold text-foreground">{t('bonds.reinvest')}</Label>
              <p className="text-xs font-medium italic text-muted-foreground">
                {t('bonds.rollover_desc')}
              </p>
            </div>
            <Switch
              checked={!!inputs.rollover}
              onCheckedChange={(checked) => onUpdate('rollover', checked)}
            />
          </div>

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
          <div className="flex gap-1 border-b border-border pb-2">
            {(['monthly', 'quarterly', 'yearly'] as const).map((step) => (
              <Button
                key={step}
                type="button"
                variant={
                  inputs.chartStep === step || (!inputs.chartStep && step === 'quarterly')
                    ? 'default'
                    : 'ghost'
                }
                className={cn(
                  'h-9 flex-1 text-[12px] font-semibold transition-all',
                  (inputs.chartStep === step || (!inputs.chartStep && step === 'quarterly')) &&
                    'bg-card',
                )}
                onClick={() => onUpdate('chartStep', step)}
              >
                {t(`bonds.chart.periods.${step}`)}
              </Button>
            ))}
          </div>
        </div>
      </AdvancedAssumptionsDisclosure>
    </section>
  );
}
