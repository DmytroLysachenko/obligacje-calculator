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
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { AlertCircle, CalendarIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';

import { Slider } from '@/components/ui/slider';

import { Badge } from '@/components/ui/badge';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RegularInvestmentInputsFormProps {
  inputs: RegularInvestmentInputs;
  onUpdate: (key: keyof RegularInvestmentInputs, value: string | number | boolean | undefined) => void;
  onBondTypeChange: (type: BondType) => void;
}

import { Target } from "lucide-react";

export const RegularInvestmentInputsForm: React.FC<RegularInvestmentInputsFormProps> = ({
  inputs,
  onUpdate,
  onBondTypeChange,
}) => {
  const { t, language } = useLanguage();
  const [showCustomTax, setShowCustomTax] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const currentDef = BOND_DEFINITIONS[inputs.bondType];
  const dateLocale = language === 'pl' ? pl : enGB;

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
              Savings Goal (Optional)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Set a target amount to see a progress bar towards your financial goal.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="e.g. 100000"
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
                  <p className="text-xs">Select the type of bond you plan to purchase regularly. Most people choose EDO (10y) for long-term savings.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={inputs.bondType}
            onValueChange={(value) => onBondTypeChange(value as BondType)}
          >
            <SelectTrigger id="bondType" className="h-11">
              <SelectValue placeholder="Select bond type" />
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
              <Label className="font-semibold">Account Type (Tax Wrap)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">IKE and IKZE accounts help avoid or reduce the 19% Belka tax on your profits.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="secondary" className="text-[10px]">Optimization</Badge>
          </div>
          <Select
            value={inputs.taxStrategy}
            onValueChange={(value) => onUpdate('taxStrategy', value as TaxStrategy)}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaxStrategy.STANDARD}>Standard Account (19% Tax)</SelectItem>
              <SelectItem value={TaxStrategy.IKE}>IKE Account (0% Tax)</SelectItem>
              <SelectItem value={TaxStrategy.IKZE}>IKZE Account (5% Tax at end)</SelectItem>
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
                      <p className="text-xs">The amount you plan to invest periodically.</p>
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
              <Slider 
                value={[inputs.contributionAmount]} 
                min={100} 
                max={20000} 
                step={100} 
                onValueChange={([val]) => onUpdate('contributionAmount', val)}
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
                    <p className="text-xs">How often you plan to make a purchase (Monthly is most common).</p>
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

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                {t('bonds.start_date')}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">When you begin your regular investment plan.</p>
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
                  {hasMounted && inputs.purchaseDate ? format(parseISO(inputs.purchaseDate), 'PPP', { locale: dateLocale }) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  fromYear={2010}
                  toYear={2050}
                  selected={parseISO(inputs.purchaseDate)}
                  onSelect={(date) => date && onUpdate('purchaseDate', date.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
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
                    <p className="text-xs">When you plan to stop investing and withdraw the accumulated capital.</p>
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
                  {hasMounted && inputs.withdrawalDate ? format(parseISO(inputs.withdrawalDate), 'PPP', { locale: dateLocale }) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  fromYear={2010}
                  toYear={2050}
                  selected={parseISO(inputs.withdrawalDate)}
                  onSelect={(date) => date && onUpdate('withdrawalDate', date.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Horizon */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="totalHorizon" className="font-semibold">
              {t('bonds.investment_horizon')}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">How many years you plan to continue this periodic investment.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4">
            <Slider 
              value={[inputs.totalHorizon]} 
              min={1} 
              max={30} 
              step={1} 
              onValueChange={([val]) => onUpdate('totalHorizon', val)}
              className="flex-1"
            />
            <span className="text-lg font-bold min-w-[3rem] text-center">
              {inputs.totalHorizon}
            </span>
            <span className="text-sm text-muted-foreground">{t('common.years')}</span>
          </div>
        </div>

        <Separator />

        {/* Inflation & Margin & First Year Rate */}
        <div className="space-y-6">
          {(inputs.bondType === 'ROR' || inputs.bondType === 'DOR') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="firstYearRate" className="text-xs font-semibold uppercase text-muted-foreground">
                  {language === 'pl' ? 'Oprocentowanie w pierwszym okresie' : 'Initial Interest Rate'} (%)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">For ROR and DOR, the interest rate is tied to the NBP reference rate. You can customize the starting rate here.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="firstYearRate"
                type="number"
                step="0.01"
                className="h-10"
                value={inputs.firstYearRate}
                onChange={(e) => onUpdate('firstYearRate', Number(e.target.value))}
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="expectedInflation" className="text-xs font-semibold uppercase text-muted-foreground">
                  {t('bonds.inflation_rate')} (%)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Expected average inflation over the period. Used for calculating interest and real purchasing power.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-12 text-[10px]" onClick={() => onUpdate('expectedInflation', 2.5)}>Stable</Button>
                <Button variant="ghost" size="icon" className="h-6 w-12 text-[10px]" onClick={() => onUpdate('expectedInflation', 10)}>High</Button>
                <Button variant="ghost" size="icon" className="h-6 w-12 text-[10px]" onClick={() => onUpdate('expectedInflation', -1)}>Deflation</Button>
              </div>
              <span className="text-sm font-bold text-primary">{inputs.expectedInflation}%</span>
            </div>
            <Slider 
              value={[inputs.expectedInflation]} 
              min={-2} 
              max={25} 
              step={0.1} 
              onValueChange={([val]) => onUpdate('expectedInflation', val)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="margin" className="text-xs font-semibold uppercase text-muted-foreground">
                {t('bonds.margin')} (%)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Guaranteed margin added to inflation for year 2+ of each bond lot.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="margin"
              type="number"
              step="0.01"
              className="h-10"
              value={inputs.margin}
              onChange={(e) => onUpdate('margin', Number(e.target.value))}
            />
          </div>
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
                        <p className="text-xs">Check this if you plan to use the &quot;Promocja na zamianę&quot; which offers a small discount on each new bond.</p>
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
                      <p className="text-xs">You can adjust the standard 19% Belka tax rate here.</p>
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

        {/* Summary Details */}
        <div className="pt-2">
          <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg border border-dashed">
            <div className="flex justify-between">
              <span>{t('bonds.duration')}:</span>
              <span className="font-bold">
                {inputs.duration < 1 ? `${inputs.duration * 12} ${language === 'pl' ? 'Miesięcy' : 'Months'}` : `${inputs.duration} ${t('common.years')}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                {inputs.bondType === 'OTS' ? (language === 'pl' ? 'Zysk (3m)' : 'Yield (3m)') : 
                 inputs.bondType === 'ROR' || inputs.bondType === 'DOR' ? (language === 'pl' ? '1. Miesiąc' : '1st Month') : 
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
};
