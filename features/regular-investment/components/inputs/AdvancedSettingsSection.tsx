'use client';

import React from 'react';
import { Info, Settings2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RegularInvestmentInputs } from '@/features/bond-core/types';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
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
    <section className="border-t border-dashed pt-6">
      <Accordion type="single" collapsible defaultValue="">
        <AccordionItem value="advanced" className="border-none">
          <AccordionTrigger className="rounded-2xl border bg-slate-50 px-4 py-4 hover:no-underline">
            <div className="flex items-start gap-3 text-left">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Settings2 className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-[0.08em] text-slate-700">
                  {t('common.advanced')}
                </h3>
                <p className="text-[15px] leading-7 text-muted-foreground">
                  Inflation assumptions, rollover behavior, rebuy logic, custom tax, and chart display.
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
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
                <div className="space-y-4 border-t border-dashed pt-6">
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

              <div className="space-y-4 border-t border-dashed pt-6">
                <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-primary">{t('bonds.reinvest')}</Label>
                    <p className="text-xs font-medium italic text-muted-foreground">
                      {t('bonds.rollover_desc')}
                    </p>
                  </div>
                  <Switch
                    checked={!!inputs.rollover}
                    onCheckedChange={(checked) => onUpdate('rollover', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
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

              <div className="space-y-4 border-t border-dashed pt-6">
                <Label className="text-sm font-semibold text-muted-foreground">
                  {t('bonds.chart.granularity')}
                </Label>
                <div className="flex gap-1 rounded-xl border bg-muted/50 p-1">
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
                        'h-9 flex-1 text-[12px] font-semibold tracking-[0.08em] transition-all',
                        (inputs.chartStep === step || (!inputs.chartStep && step === 'quarterly')) &&
                          'shadow-sm',
                      )}
                      onClick={() => onUpdate('chartStep', step)}
                    >
                      {t(`bonds.chart.periods.${step}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
