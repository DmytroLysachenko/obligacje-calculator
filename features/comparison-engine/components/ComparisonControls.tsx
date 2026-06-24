'use client';
import { History, Settings2, ShoppingCart } from 'lucide-react';
import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAppI18n } from '@/i18n/client';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { FormSelect } from '@/shared/components/forms/FormSelect';

import { ComparisonControlsProps } from '../types/multi-asset';
export const ComparisonControls: React.FC<ComparisonControlsProps> = ({
  initialSum,
  updateInitialSum,
  monthlyContribution,
  updateMonthlyContribution,
  startYear,
  updateStartYear,
  startMonth,
  updateStartMonth,
  years,
  months,
  showRealValue,
  updateShowRealValue,
  purchasingPowerLoss,
  formatCurrency,
}) => {
  const { t } = useAppI18n();
  const presets = [
    { label: t('comparison.preset_bull_2021'), year: '2021', month: '01' },
    { label: t('comparison.preset_war_2022'), year: '2022', month: '02' },
    { label: t('comparison.preset_recovery_2023'), year: '2023', month: '01' },
  ];
  return (
    <div className="space-y-6">
      <section className="space-y-6">
        <div className="space-y-2 border-b border-border pb-4">
          <h2 className="flex items-center gap-2 ui-section-title">
            <Settings2 className="h-5 w-5" />
            {t('comparison.configuration')}
          </h2>
          <p className="ui-body text-muted-foreground">{t('comparison.controls.description')}</p>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('comparison.initial_sum')}
              </Label>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(initialSum)}
              </span>
            </div>
            <CommittedSliderInput
              value={initialSum}
              min={0}
              max={500000}
              step={1000}
              unit="PLN"
              onCommit={updateInitialSum}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('comparison.monthly_payin')}
              </Label>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(monthlyContribution)}
              </span>
            </div>
            <CommittedSliderInput
              value={monthlyContribution}
              min={0}
              max={20000}
              step={100}
              unit="PLN"
              onCommit={updateMonthlyContribution}
            />
          </div>

          <Accordion type="single" collapsible defaultValue="">
            <AccordionItem value="advanced" className="border-none">
              <AccordionTrigger className="rounded-lg bg-muted/35 px-4 py-4 hover:no-underline">
                <div className="space-y-1 text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {t('comparison.controls.advanced_title')}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t('comparison.controls.advanced_description')}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 px-1 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      {t('comparison.step_timeline')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('comparison.year')}
                      </Label>
                      <FormSelect
                        value={startYear}
                        onValueChange={updateStartYear}
                        triggerClassName="min-h-10"
                        options={years.map((year) => ({
                          value: year,
                          label: year,
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('comparison.month')}
                      </Label>
                      <FormSelect
                        value={startMonth}
                        onValueChange={updateStartMonth}
                        triggerClassName="min-h-10"
                        options={months.map((month) => ({
                          value: month,
                          label: month,
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      className="h-10 w-full justify-start"
                      onClick={() => {
                        updateStartYear(preset.year);
                        updateStartMonth(preset.month);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/35 p-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-foreground">
                      {t('bonds.inflation.adjusted')}
                    </Label>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t('bonds.show_purchasing_power')}
                    </p>
                  </div>
                  <Switch checked={showRealValue} onCheckedChange={updateShowRealValue} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="space-y-3 border-t border-border py-5">
        <h3 className="flex items-center gap-2 ui-card-title">
          <ShoppingCart className="h-4 w-4" />
          {t('comparison.purchasing_power_loss')}
        </h3>
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p className="ui-large-metric text-warning">-{purchasingPowerLoss.toFixed(1)}%</p>
          <p className="ui-body">
            {t('comparison.inflation_loss_context', {
              percent: purchasingPowerLoss.toFixed(1),
            })}
          </p>
        </div>
      </section>

      <section className="space-y-2 border-t border-border py-5">
        <h3 className="ui-card-title">{t('comparison.savings_context_title')}</h3>
        <div className="ui-body text-muted-foreground">
          <p>{t('comparison.savings_context_desc')}</p>
        </div>
      </section>
    </div>
  );
};
