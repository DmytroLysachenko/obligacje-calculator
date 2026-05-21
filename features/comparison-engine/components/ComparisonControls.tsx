'use client';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { History, Settings2, ShoppingCart } from 'lucide-react';
import { useAppI18n } from '@/i18n/client';
import { ComparisonControlsProps } from './types';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
export const ComparisonControls: React.FC<ComparisonControlsProps> = ({ initialSum, updateInitialSum, monthlyContribution, updateMonthlyContribution, startYear, updateStartYear, startMonth, updateStartMonth, years, months, showRealValue, updateShowRealValue, purchasingPowerLoss, formatCurrency, }) => {
    const { t } = useAppI18n();
    const presets = [
        { label: t('comparison.preset_bull_2021'), year: '2021', month: '01' },
        { label: t('comparison.preset_war_2022'), year: '2022', month: '02' },
        { label: t('comparison.preset_recovery_2023'), year: '2023', month: '01' },
    ];
    return (<div className="space-y-6">
      <Card className="rounded-2xl border-2 shadow-none">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg font-black text-primary">
            <Settings2 className="h-5 w-5"/>
            {t('comparison.configuration')}
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("generated.features.comparison_engine.components.comparison_controls.item_1")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('comparison.initial_sum')}
              </Label>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(initialSum)}
              </span>
            </div>
            <CommittedSliderInput value={initialSum} min={0} max={500000} step={1000} unit="PLN" onCommit={updateInitialSum}/>
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
            <CommittedSliderInput value={monthlyContribution} min={0} max={20000} step={100} unit="PLN" onCommit={updateMonthlyContribution}/>
          </div>

          <Accordion type="single" collapsible defaultValue="">
            <AccordionItem value="advanced" className="border-none">
              <AccordionTrigger className="rounded-2xl border bg-slate-50 px-4 py-4 hover:no-underline">
                <div className="space-y-1 text-left">
                  <p className="text-sm font-bold text-slate-950">
                    {t("generated.features.comparison_engine.components.comparison_controls.item_2")}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("generated.features.comparison_engine.components.comparison_controls.item_3")}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 px-1 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary"/>
                    <p className="text-sm font-semibold text-foreground">
                      {t('comparison.step_timeline')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('comparison.year')}
                      </Label>
                      <Select value={startYear} onValueChange={updateStartYear}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (<SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('comparison.month')}
                      </Label>
                      <Select value={startMonth} onValueChange={updateStartMonth}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (<SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {presets.map((preset) => (<Button key={preset.label} variant="outline" className="h-10 w-full justify-start" onClick={() => {
                updateStartYear(preset.year);
                updateStartMonth(preset.month);
            }}>
                      {preset.label}
                    </Button>))}
                </div>

                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-foreground">
                      {t('bonds.inflation.adjusted')}
                    </Label>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t('bonds.show_purchasing_power')}
                    </p>
                  </div>
                  <Switch checked={showRealValue} onCheckedChange={updateShowRealValue}/>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-orange-200 bg-orange-50 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-900">
            <ShoppingCart className="h-4 w-4"/>
            {t('comparison.purchasing_power_loss')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-orange-950">
          <p className="text-2xl font-semibold">
            -{purchasingPowerLoss.toFixed(1)}%
          </p>
          <p className="text-sm text-orange-900/80">
            {t('comparison.inflation_loss_context', {
            percent: purchasingPowerLoss.toFixed(1),
        })}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {t('comparison.savings_context_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          <p>{t('comparison.savings_context_desc')}</p>
        </CardContent>
      </Card>
    </div>);
};





