'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { BondType, BondInputs, TaxStrategy } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { CalendarIcon, Info, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { getHorizonMonths, getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';

import { Slider } from '@/components/ui/slider';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BondSeries {
  id: string;
  seriesCode: string;
  firstYearRate: string | number;
  baseMargin: string | number;
  emissionMonth: string;
}

interface BondInputsFormProps {
  inputs: BondInputs;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (key: any, value: any) => void;
  onBondTypeChange: (type: BondType) => void;
  availableSeries?: BondSeries[];
  selectedSeriesId?: string | null;
}

export const BondInputsForm: React.FC<BondInputsFormProps> = ({
  inputs,
  onUpdate,
  onBondTypeChange,
  availableSeries = [],
  selectedSeriesId = 'current',
}) => {
  const { t, language } = useLanguage();
  const [showCustomTax, setShowCustomTax] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const currentDef = BOND_DEFINITIONS[inputs.bondType];
  const dateLocale = language === 'pl' ? pl : enGB;
  const investmentHorizonMonths = inputs.investmentHorizonMonths ?? getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);
  const investmentHorizonYears = Math.max(1 / 12, investmentHorizonMonths / 12);

  const handleInvestmentChange = (value: string | number) => {
    const numValue = Number(value);
    onUpdate('initialInvestment', numValue);
  };

  const isDivisibleBy100 = inputs.initialInvestment % 100 === 0 && inputs.initialInvestment > 0;
  const maturityDate = parseISO(getWithdrawalDateFromMonths(inputs.purchaseDate, Math.round(inputs.duration * 12)));

  return (
    <Card className="w-full shadow-lg border-primary/10 overflow-hidden">
      <CardHeader className="pb-4 bg-muted/30 border-b mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t('bonds.single_calculator')}
          </CardTitle>
        </div>
        <CardDescription>
          {t('bonds.bond_type_selection')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="multiple" defaultValue={['core', 'timing']} className="w-full">
          {/* Core Configuration */}
          <AccordionItem value="core" className="border-b px-6 py-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                {t('bonds.step_core')}
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-6">
              {/* Calculator Mode */}
              <div className="p-1 mb-4 bg-muted/50 rounded-xl flex gap-1">
                <Button 
                  variant={(!inputs.calculatorMode || inputs.calculatorMode === 'standard') ? 'default' : 'ghost'} 
                  className="flex-1 rounded-lg h-10 text-xs font-bold"
                  onClick={() => onUpdate('calculatorMode', 'standard')}
                >
                  {t('bonds.standard_payout')}
                </Button>
                <Button 
                  variant={inputs.calculatorMode === 'reverse' ? 'default' : 'ghost'} 
                  className="flex-1 rounded-lg h-10 text-xs font-bold"
                  onClick={() => onUpdate('calculatorMode', 'reverse')}
                >
                  {t('bonds.reverse_target')}
                </Button>
              </div>

              {/* Savings Goal */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="font-semibold flex items-center gap-2">
                    {inputs.calculatorMode === 'reverse' ? t('bonds.target_goal_req') : t('bonds.savings_goal_opt')}
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder={t('bonds.example_goal')}
                    className="h-11 pl-4 pr-12"
                    value={inputs.savingsGoal || ''}
                    onChange={(e) => onUpdate('savingsGoal', e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">
                    PLN
                  </div>
                </div>
              </div>

              {/* Bond Type Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="bondType" className="font-semibold">{t('bonds.bond_type')}</Label>
                </div>
                <Select
                  value={inputs.bondType}
                  onValueChange={(value) => onBondTypeChange(value as BondType)}
                >
                  <SelectTrigger id="bondType" className="h-11">
                    <SelectValue placeholder={t('bonds.select_bond_type')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(BondType).map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex flex-col">
                          <span className="font-bold">{type}</span>
                          <span className="text-xs text-muted-foreground">
                            {BOND_DEFINITIONS[type].fullName[language]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Series Selection */}
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('bonds.bond_series')}</Label>
                  <Select
                    value={selectedSeriesId || 'current'}
                    onValueChange={(value) => onUpdate('selectedSeriesId', value)}
                  >
                    <SelectTrigger className="h-9 text-xs font-bold bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current" className="text-xs font-bold">{t('bonds.current_offer')}</SelectItem>
                      {availableSeries.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.seriesCode} ({s.firstYearRate}% + {s.baseMargin}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-primary/5 rounded-lg text-xs space-y-1 border border-primary/10">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Info className="h-3 w-3" />
                    <span>{currentDef.fullName[language]}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed italic">
                    {currentDef.description[language]}
                  </p>
                </div>
              </div>

              {/* Investment Amount */}
              {(!inputs.calculatorMode || inputs.calculatorMode === 'standard') && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="initialInvestment" className="font-semibold">
                      {t('bonds.initial_investment')}
                    </Label>
                    <span className="text-xs font-medium text-muted-foreground">
                      {Math.floor(inputs.initialInvestment / 100)} {t('bonds.units')}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        id="initialInvestment"
                        type="number"
                        className={cn(
                          "h-11 pl-4 pr-12 text-lg font-medium",
                          !isDivisibleBy100 && "border-destructive focus-visible:ring-destructive"
                        )}
                        value={inputs.initialInvestment}
                        onChange={(e) => handleInvestmentChange(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        PLN
                      </div>
                    </div>
                    <Slider 
                      value={[inputs.initialInvestment]} 
                      min={100} 
                      max={100000} 
                      step={100} 
                      onValueChange={([val]) => handleInvestmentChange(val)}
                      className="py-4"
                    />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Timing & Withdrawal */}
          <AccordionItem value="timing" className="border-b px-6 py-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                {t('bonds.step_timing')}
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-6">
              <div className="space-y-3">
                <Label className="font-semibold">{t('bonds.timing_mode')}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={(!inputs.timingMode || inputs.timingMode === 'general') ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => onUpdate('timingMode', 'general')}
                  >
                    {t('bonds.timing_general')}
                  </Button>
                  <Button
                    type="button"
                    variant={inputs.timingMode === 'exact' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => onUpdate('timingMode', 'exact')}
                  >
                    {t('bonds.timing_exact')}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('bonds.purchase_date')}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11 px-3",
                          !inputs.purchaseDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {hasMounted && inputs.purchaseDate ? format(parseISO(inputs.purchaseDate), 'PPP', { locale: dateLocale }) : <span>{t('bonds.pick_date')}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        fromYear={2010}
                        toYear={2050}
                        selected={parseISO(inputs.purchaseDate)}
                        onSelect={(date) => date && onUpdate('purchaseDate', toDateString(date))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {inputs.timingMode === 'exact' ? (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('bonds.withdrawal_date')}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-11 px-3",
                            !inputs.withdrawalDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {hasMounted && inputs.withdrawalDate ? format(parseISO(inputs.withdrawalDate), 'PPP', { locale: dateLocale }) : <span>{t('bonds.pick_date')}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          fromYear={2010}
                          toYear={2050}
                          selected={parseISO(inputs.withdrawalDate)}
                          onSelect={(date) => date && onUpdate('withdrawalDate', toDateString(date))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold">{t('bonds.investment_horizon')}</Label>
                  <span className="text-sm font-black text-primary">
                    {investmentHorizonYears % 1 === 0 ? investmentHorizonYears.toFixed(0) : investmentHorizonYears.toFixed(2)} {t('common.years')}
                  </span>
                </div>
                <Slider
                  value={[investmentHorizonMonths]}
                  min={1}
                  max={360}
                  step={1}
                  onValueChange={([value]) => onUpdate('investmentHorizonMonths', value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="font-semibold">{t('bonds.tax_strategy')}</Label>
                <Select
                  value={inputs.taxStrategy}
                  onValueChange={(value) => onUpdate('taxStrategy', value as TaxStrategy)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaxStrategy.STANDARD}>{t('bonds.tax_standard')}</SelectItem>
                    <SelectItem value={TaxStrategy.IKE}>{t('bonds.tax_ike')}</SelectItem>
                    <SelectItem value={TaxStrategy.IKZE}>{t('bonds.tax_ikze')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentDef.rebuyDiscount > 0 && (
                <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-xl border border-green-100">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-green-800">{t('bonds.is_rebought')}</Label>
                    <p className="text-[10px] text-green-600 font-medium italic">
                      {t('bonds.discount_per_bond', { amount: currentDef.rebuyDiscount.toFixed(2) })}
                    </p>
                  </div>
                  <Switch
                    checked={inputs.isRebought}
                    onCheckedChange={(checked) => onUpdate('isRebought', checked)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-primary">{t('bonds.reinvest')}</Label>
                  <p className="text-[10px] text-muted-foreground font-medium italic">
                    {t('bonds.rollover_desc')}
                  </p>
                </div>
                <Switch
                  checked={!!inputs.rollover}
                  onCheckedChange={(checked) => onUpdate('rollover', checked)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Market Assumptions */}
          <AccordionItem value="assumptions" className="border-b px-6 py-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                {t('bonds.step_market')}
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-6">
              <MarketAssumptionsForm
                expectedInflation={inputs.expectedInflation}
                expectedNbpRate={inputs.expectedNbpRate}
                bondType={inputs.bondType}
                customInflation={inputs.customInflation}
                onUpdate={onUpdate}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Display & Logic */}
          <AccordionItem value="display" className="border-0 px-6 py-2">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-700">
                {t('bonds.step_display')}
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                  {t('bonds.chart_granularity')}
                </Label>
                <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border">
                  {(['monthly', 'quarterly', 'yearly'] as const).map((step) => (
                    <Button
                      key={step}
                      type="button"
                      variant={inputs.chartStep === step || (!inputs.chartStep && step === 'yearly') ? 'default' : 'ghost'}
                      className={cn(
                        "flex-1 h-8 text-[10px] font-black uppercase tracking-tighter transition-all",
                        (inputs.chartStep === step || (!inputs.chartStep && step === 'yearly')) && "shadow-sm"
                      )}
                      onClick={() => onUpdate('chartStep', step)}
                    >
                      {t(`bonds.granularity_${step}`)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-primary uppercase">{t('bonds.inflation_adjusted')}</Label>
                  <p className="text-[10px] text-muted-foreground font-medium italic">
                    {t('bonds.show_purchasing_power')}
                  </p>
                </div>
                <Switch
                  checked={inputs.showRealValue}
                  onCheckedChange={(checked) => onUpdate('showRealValue', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">{t('bonds.custom_tax_rate')}</Label>
                  <p className="text-[10px] text-muted-foreground font-medium italic">
                    {t('bonds.standard_tax_note')}
                  </p>
                </div>
                <Switch
                  checked={showCustomTax}
                  onCheckedChange={setShowCustomTax}
                />
              </div>

              {showCustomTax && (
                <div className="px-4 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <Input
                    type="number"
                    className="h-10 font-bold"
                    value={inputs.taxRate}
                    onChange={(e) => onUpdate('taxRate', Number(e.target.value))}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Summary Details */}
        <div className="pt-2 px-6 pb-6">
          <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg border border-dashed">
            <div className="flex justify-between">
              <span>{t('bonds.duration')}:</span>
              <span className="font-bold">
                {inputs.duration < 1 ? `${inputs.duration * 12} ${t('comparison.month')}` : `${inputs.duration} ${t('common.years')}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                {inputs.bondType === 'OTS' ? t('bonds.yield_three_months') : 
                 inputs.bondType === 'ROR' || inputs.bondType === 'DOR' ? t('bonds.first_month_rate') : 
                 t('bonds.first_year_rate')}:
              </span>
              <span className="font-bold">{inputs.firstYearRate}%</span>
            </div>
            {currentDef.margin > 0 && (
              <div className="flex justify-between">
                <span>{t('bonds.margin')}:</span>
                <span className="font-bold">{inputs.margin}%</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t('bonds.maturity_date')}:</span>
              <span className="font-bold">{hasMounted ? format(maturityDate, 'PPP', { locale: dateLocale }) : '---'}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('bonds.payout_type')}:</span>
              <span className="font-bold">
                {inputs.isCapitalized ? t('bonds.capitalization') : t('bonds.payout')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('bonds.early_withdrawal_fee')}:</span>
              <span className="font-bold">{inputs.earlyWithdrawalFee} PLN</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
