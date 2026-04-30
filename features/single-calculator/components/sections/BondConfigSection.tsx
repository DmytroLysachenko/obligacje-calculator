'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Info, AlertCircle } from 'lucide-react';
import { BondType, BondInputs } from '@/features/bond-core/types';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { useLanguage } from '@/i18n';
import { GLOSSARY } from '@/shared/constants/glossary';
import { cn } from '@/lib/utils';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';

interface BondSeries {
  id: string;
  seriesCode: string;
  firstYearRate: string | number;
  baseMargin: string | number;
  emissionMonth: string;
}

interface BondConfigSectionProps {
  inputs: BondInputs;
  onUpdate: (key: keyof BondInputs, value: string | number | boolean | undefined) => void;
  onBondTypeChange: (type: BondType) => void;
  definitions: Record<BondType, BondDefinition>;
  availableSeries: BondSeries[];
  selectedSeriesId: string | null;
}

export const BondConfigSection: React.FC<BondConfigSectionProps> = React.memo(({
  inputs,
  onUpdate,
  onBondTypeChange,
  definitions,
  availableSeries,
  selectedSeriesId,
}) => {
  const { t, language } = useLanguage();
  const currentDef = definitions[inputs.bondType];

  const handleInvestmentChange = (value: number) => {
    onUpdate('initialInvestment', value);
  };

  const isDivisibleBy100 = inputs.initialInvestment % 100 === 0 && inputs.initialInvestment > 0;

  return (
    <div className="space-y-6 pb-6">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              {GLOSSARY.SAVINGS_GOAL.definition[language]}
            </TooltipContent>
          </Tooltip>
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
          {currentDef.isInflationIndexed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                {GLOSSARY.INFLATION_INDEXED.definition[language]}
              </TooltipContent>
            </Tooltip>
          )}
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
                  !isDivisibleBy100 && inputs.initialInvestment > 0 && "border-destructive focus-visible:ring-destructive"
                )}
                value={inputs.initialInvestment}
                onChange={(e) => handleInvestmentChange(Number(e.target.value))}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                PLN
              </div>
            </div>
            {!isDivisibleBy100 && inputs.initialInvestment > 0 && (
              <div className="flex items-center gap-2 text-destructive text-[10px] font-medium animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-3 w-3" />
                <span>{t('bonds.error_100_pln')}</span>
              </div>
            )}
            <CommittedSliderInput
              value={inputs.initialInvestment}
              min={100}
              max={100000}
              step={100}
              unit="PLN"
              sliderClassName="py-4"
              onCommit={handleInvestmentChange}
            />
          </div>
        </div>
      )}
    </div>
  );
});

BondConfigSection.displayName = 'BondConfigSection';
