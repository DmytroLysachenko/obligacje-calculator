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
import { BondType, BondInputs, TaxStrategy } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { AlertCircle, CalendarIcon, Info, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addMonths } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';

import { Slider } from '@/components/ui/slider';

import { Badge } from '@/components/ui/badge';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BondInputsFormProps {
  inputs: BondInputs;
  onUpdate: (key: keyof BondInputs, value: string | number | boolean | undefined) => void;
  onBondTypeChange: (type: BondType) => void;
}

export const BondInputsForm: React.FC<BondInputsFormProps> = ({
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

  const handleInvestmentChange = (value: string | number) => {
    const numValue = Number(value);
    onUpdate('initialInvestment', numValue);
  };

  const isDivisibleBy100 = inputs.initialInvestment % 100 === 0 && inputs.initialInvestment > 0;
  const maturityDate = addMonths(parseISO(inputs.purchaseDate), Math.round(inputs.duration * 12));

  return (
    <Card className="w-full shadow-lg border-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{t('bonds.single_calculator')}</CardTitle>
        </div>
        <CardDescription>
          {t('bonds.bond_type_selection')}
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
              placeholder="e.g. 50000"
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

        {/* Bond Type Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="bondType" className="font-semibold">{t('bonds.bond_type')}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Polish Treasury offers various bonds: OTS (3m), TOS (3y), COI (4y), EDO (10y), etc. Each has different interest rules.</p>
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
                    <p className="text-xs">IKE and IKZE are tax-advantaged accounts in Poland that allow you to avoid or defer the 19% &quot;Belka&quot; tax.</p>
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

        {/* Investment Amount */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="initialInvestment" className="font-semibold">
                {t('bonds.initial_investment')}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">The amount you want to invest. Each bond costs 100 PLN.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
          {!isDivisibleBy100 && inputs.initialInvestment > 0 && (
            <div className="flex items-center gap-2 text-destructive text-xs font-medium animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-3 w-3" />
              <span>{t('bonds.error_100_pln')}</span>
            </div>
          )}
        </div>

        {/* Dates Selection */}
        <div className="grid grid-cols-2 gap-4">
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
                    <p className="text-xs">When you buy the bonds. Affects maturity calculation.</p>
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
                    <p className="text-xs">When you plan to cash out. If before maturity, early withdrawal fees may apply.</p>
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

        {/* Inflation & Margin & First Year Rate */}
        <div className="space-y-6">
          {(inputs.bondType === 'ROR' || inputs.bondType === 'DOR') && (
            <div className="space-y-6">
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

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="expectedNbpRate" className="text-xs font-semibold uppercase text-muted-foreground">
                      Expected NBP Rate (%)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">The Narodowy Bank Polski reference rate. Used for ROR and DOR bonds for month 2+.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-sm font-bold text-primary">{inputs.expectedNbpRate}%</span>
                </div>
                <Slider 
                  value={[inputs.expectedNbpRate ?? 5.25]} 
                  min={0} 
                  max={20} 
                  step={0.05} 
                  onValueChange={([val]) => onUpdate('expectedNbpRate', val)}
                />
              </div>
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
                      <p className="text-xs">For inflation-indexed bonds (COI, EDO), this rate determines interest for year 2+. Also used to calculate &quot;Real Value&quot;.</p>
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
                    <p className="text-xs">Guaranteed margin added to the inflation rate or NBP rate for variable bonds.</p>
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

        <Separator />

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
                        <p className="text-xs">If you use money from maturing bonds to buy new ones, you get a discount (usually 0.10 PLN per bond).</p>
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

        {/* Tax Switch */}
        <div className="space-y-4">
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
                      <p className="text-xs">Standard &quot;Belka&quot; tax in Poland is 19%. You can adjust it if laws change.</p>
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
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
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
