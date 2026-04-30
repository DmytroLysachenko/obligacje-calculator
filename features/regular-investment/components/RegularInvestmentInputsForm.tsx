'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { BondType, RegularInvestmentInputs, InvestmentFrequency, TaxStrategy } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { AlertCircle, CalendarIcon, Info, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { getHorizonMonths, toDateString } from '@/shared/lib/date-timing';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { Badge } from '@/components/ui/badge';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RegularInvestmentInputsFormProps {
  inputs: RegularInvestmentInputs;
  onUpdate: {
    bivarianceHack: (key: keyof RegularInvestmentInputs | string, value: unknown) => void;
  }['bivarianceHack'];
  onBondTypeChange: (type: BondType) => void;
}

export const RegularInvestmentInputsForm: React.FC<RegularInvestmentInputsFormProps> = React.memo(({
  inputs,
  onUpdate,
  onBondTypeChange,
}) => {
  const { t, language } = useLanguage();
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const [showCustomTax, setShowCustomTax] = useState(false);

  if (isLoadingDefs || !definitions) {
    return (
      <Card className="w-full shadow-lg border-primary/10 animate-pulse">
        <CardContent className="h-[600px] flex items-center justify-center">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  const currentDef = definitions[inputs.bondType];
  const dateLocale = language === 'pl' ? pl : enGB;
  const investmentHorizonMonths = inputs.investmentHorizonMonths ?? getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);
  const investmentHorizonYears = Math.max(1 / 12, investmentHorizonMonths / 12);

  const isDivisibleBy100 = inputs.contributionAmount % 100 === 0 && inputs.contributionAmount > 0;

  return (
    <Card className="w-full shadow-lg border-primary/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{t('bonds.regular_calculator')}</CardTitle>
        <CardDescription>
          {t('bonds.regular_calc_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Savings Goal */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {t('bonds.savings_goal_opt')}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('bonds.savings_goal_opt')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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

        <Separator />

        {/* Bond Type */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="bondType" className="font-semibold">{t('bonds.bond_type')}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs">{t('bonds.bond_type_selection')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                      {definitions[type]?.fullName[language] || type}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1 border border-primary/5">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Info className="h-3 w-3" />
              <span>{currentDef.fullName[language]}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {currentDef.description[language]}
            </p>
          </div>
        </div>

        <Separator />

        {/* Tax Wrap (IKE/IKZE) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="font-semibold">{t('bonds.tax_strategy')}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                  <p className="text-xs">{t('bonds.tax_strategy')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="secondary" className="text-[10px]">{t('comparison.configuration')}</Badge>
          </div>
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

        <Separator />

        {/* Amount & Frequency */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="contributionAmount" className="font-semibold">
                  {t('bonds.monthly_investment')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('regular_form.contribution_help')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-bold text-primary">{inputs.contributionAmount} PLN</span>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  id="contributionAmount"
                  type="number"
                  className={cn(
                    "h-11 pl-4 pr-12 text-lg font-medium",
                    !isDivisibleBy100 && "border-destructive focus-visible:ring-destructive"
                  )}
                  value={inputs.contributionAmount}
                  onChange={(e) => onUpdate('contributionAmount', Number(e.target.value))}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">
                  PLN
                </div>
              </div>
              <CommittedSliderInput
                value={inputs.contributionAmount}
                min={100}
                max={20000}
                step={100}
                unit="PLN"
                onCommit={(value) => onUpdate('contributionAmount', value)}
              />
            </div>
            {!isDivisibleBy100 && inputs.contributionAmount > 0 && (
              <div className="flex items-center gap-2 text-destructive text-[10px] font-medium">
                <AlertCircle className="h-3 w-3" />
                <span>{t('bonds.error_100_pln')}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="frequency" className="font-semibold">
                {t('bonds.frequency')}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('regular_form.frequency_help')}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={inputs.frequency}
              onValueChange={(value) => onUpdate('frequency', value as InvestmentFrequency)}
            >
              <SelectTrigger id="frequency" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(InvestmentFrequency).map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {t(`bonds.freq_${freq.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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

        <div className={cn("grid gap-4", inputs.timingMode === 'exact' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                {t('bonds.purchase_date')}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{t('regular_form.start_date_help')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 px-3",
                    !inputs.purchaseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inputs.purchaseDate ? format(parseISO(inputs.purchaseDate), 'PPP', { locale: dateLocale }) : <span>{t('bonds.pick_date')}</span>}
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
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  {t('bonds.withdrawal_date')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('regular_form.withdrawal_date_help')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 px-3",
                      !inputs.withdrawalDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {inputs.withdrawalDate ? format(parseISO(inputs.withdrawalDate), 'PPP', { locale: dateLocale }) : <span>{t('bonds.pick_date')}</span>}
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

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="investmentHorizonMonths" className="font-semibold">
              {t('bonds.investment_horizon')}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('regular_form.horizon_help')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {inputs.timingMode === 'exact' ? (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {investmentHorizonYears % 1 === 0 ? investmentHorizonYears.toFixed(0) : investmentHorizonYears.toFixed(2)} {t('common.years')}
              </span>
              {' '}· {t('regular_form.horizon_help')}
            </div>
          ) : (
            <CommittedSliderInput
              value={investmentHorizonYears}
              min={1}
              max={30}
              step={1}
              unit="Y"
              onCommit={(value) => onUpdate('investmentHorizonMonths', value * 12)}
            />
          )}
        </div>

        <Separator />

        {/* Market Assumptions */}
        <div className="space-y-4">
          <MarketAssumptionsForm
            expectedInflation={inputs.expectedInflation}
            expectedNbpRate={inputs.expectedNbpRate}
            bondType={inputs.bondType}
            customInflation={inputs.customInflation}
            onUpdate={onUpdate}
          />
        </div>

        {/* Rebuy / Swap Toggle (if applicable) */}
        {currentDef.rebuyDiscount > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">{t('bonds.is_rebought')}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{t('regular_form.rebuy_help')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {t('bonds.is_rebought_desc')} (-{currentDef.rebuyDiscount.toFixed(2)} PLN/szt)
                </p>
              </div>
              <Switch
                checked={inputs.isRebought}
                onCheckedChange={(checked) => onUpdate('isRebought', checked)}
              />
            </div>
            <Separator />
          </div>
        )}

        {/* Tax */}
        <div className="space-y-4 pt-2">
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">{t('bonds.custom_tax_rate')}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('regular_form.tax_help')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {t('bonds.belka_tax_desc')}
              </p>
            </div>
            <Switch
              checked={showCustomTax}
              onCheckedChange={setShowCustomTax}
            />
          </div>

          {showCustomTax && (
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-xs font-semibold uppercase text-muted-foreground">
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
          )}
        </div>

        <Separator />

        {/* Display & Logic */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              {t('bonds.chart_granularity')}
            </Label>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border">
              {(['monthly', 'quarterly', 'yearly'] as const).map((step) => (
                <Button
                  key={step}
                  type="button"
                  variant={inputs.chartStep === step || (!inputs.chartStep && step === 'quarterly') ? 'default' : 'ghost'}
                  className={cn(
                    "flex-1 h-8 text-[10px] font-black uppercase tracking-tighter transition-all",
                    (inputs.chartStep === step || (!inputs.chartStep && step === 'quarterly')) && "shadow-sm"
                  )}
                  onClick={() => onUpdate('chartStep', step)}
                >
                  {t(`bonds.granularity_${step}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Details */}
        <div className="pt-2">
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
});

RegularInvestmentInputsForm.displayName = 'RegularInvestmentInputsForm';
