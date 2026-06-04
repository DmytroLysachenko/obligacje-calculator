'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Info, AlertCircle } from 'lucide-react';
import { BondType, BondInputs } from '@/features/bond-core/types';
import { getBondSupportMeta, isFamilyBondType } from '@/features/bond-core/support-matrix';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { getBondRateContextCopy } from '@/shared/lib/bond-rate-context';
import { getIntlLocale } from '@/i18n/locale-utils';
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
export const BondConfigSection: React.FC<BondConfigSectionProps> = React.memo(({ inputs, onUpdate, onBondTypeChange, definitions, availableSeries, selectedSeriesId, }) => {
    const { t, locale: language } = useAppI18n();
    const currentDef = definitions[inputs.bondType];
    const currentBondSupport = getBondSupportMeta(inputs.bondType);
    const rateContext = getBondRateContextCopy(inputs.bondType, Number(inputs.firstYearRate), Number(inputs.margin), t);
    const formatDurationLabel = (type: BondType) => `${Math.round((definitions[type]?.duration ?? 1) * 12)} ${t('common.month_compact')}`;
    const formatSeriesMonth = (value: string) => new Date(value).toLocaleDateString(getIntlLocale(language), {
        month: 'short',
        year: 'numeric',
    });
    const handleInvestmentChange = (value: number) => {
        onUpdate('initialInvestment', value);
    };
    const isDivisibleBy100 = inputs.initialInvestment % 100 === 0 && inputs.initialInvestment > 0;
    return (<div className="space-y-6">
      <div className="flex gap-1 border-b border-border pb-2">
        <Button variant={(!inputs.calculatorMode || inputs.calculatorMode === 'standard') ? 'default' : 'ghost'} className="h-8 flex-1 text-sm font-medium" onClick={() => onUpdate('calculatorMode', 'standard')}>
          {t('bonds.standard_payout')}
        </Button>
        <Button variant={inputs.calculatorMode === 'reverse' ? 'default' : 'ghost'} className="h-8 flex-1 text-sm font-medium" onClick={() => onUpdate('calculatorMode', 'reverse')}>
          {t('bonds.reverse_target')}
        </Button>
      </div>

      {inputs.calculatorMode === 'reverse' ? (<div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              {t('bonds.target_goal_req')}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help"/>
              </TooltipTrigger>
              <TooltipContent>
                {t('bonds.glossary.savings_goal')}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <Input type="number" placeholder={t('bonds.example_goal')} className="pl-4 pr-12" value={inputs.savingsGoal || ''} onChange={(e) => onUpdate('savingsGoal', e.target.value ? Number(e.target.value) : undefined)}/>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              PLN
            </div>
          </div>
        </div>) : null}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="bondType" className="text-sm font-semibold">{t('bonds.bond.type')}</Label>
          {currentDef.isInflationIndexed && (<Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help"/>
              </TooltipTrigger>
              <TooltipContent>
                {t('bonds.glossary.inflation_indexed')}
              </TooltipContent>
            </Tooltip>)}
        </div>
        <Select value={inputs.bondType} onValueChange={(value) => onBondTypeChange(value as BondType)}>
          <SelectTrigger id="bondType" className="bg-card text-left shadow-none">
            <SelectValue placeholder={t('bonds.select_bond_type')}/>
          </SelectTrigger>
          <SelectContent>
            {Object.values(BondType).map((type) => (<SelectItem key={type} value={type} className="py-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold tracking-tight">{type}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {formatDurationLabel(type)}
                    </span>
                    {isFamilyBondType(type) ? (<span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                        {t('bonds.family_bond_badge')}
                      </span>) : null}
                  </div>
                  <span className="max-w-[280px] text-sm font-medium text-foreground">
                    {definitions[type]?.fullName[language] || type}
                  </span>
                </div>
              </SelectItem>))}
          </SelectContent>
        </Select>

        <div className="space-y-2 pt-2">
          <Label className="text-xs font-semibold text-muted-foreground">{t('bonds.bond.series')}</Label>
          <Select value={selectedSeriesId || 'current'} onValueChange={(value) => onUpdate('selectedSeriesId', value)}>
            <SelectTrigger className="bg-muted/45 text-left text-sm font-medium shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current" className="py-3 text-sm font-medium">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{t('bonds.offer.current')}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('bonds.offer.current_description')}
                  </span>
                </div>
              </SelectItem>
              {availableSeries.map((s) => (<SelectItem key={s.id} value={s.id} className="py-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{s.seriesCode}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatSeriesMonth(s.emissionMonth)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Number(s.firstYearRate).toFixed(2)}% + {Number(s.baseMargin).toFixed(2)}%
                    </span>
                  </div>
                </SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-3 rounded-lg border border-border bg-muted/25 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Info className="h-3 w-3"/>
            <span>{currentDef.fullName[language]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {formatDurationLabel(inputs.bondType)}
            </span>
            {isFamilyBondType(inputs.bondType) ? (<span className="rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-[var(--finance-warning)]">
                {t('bonds.family_bond')}
              </span>) : null}
            <span className="rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {rateContext.styleLabel}
            </span>
          </div>
          <p className="text-muted-foreground leading-relaxed italic">
            {currentDef.description[language]}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {rateContext.narrative}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {currentBondSupport.description}
          </p>
          {isFamilyBondType(inputs.bondType) ? (<p className="font-semibold text-warning">
              {t('bonds.family_bond_notice')}
            </p>) : null}
        </div>
      </div>

      {(!inputs.calculatorMode || inputs.calculatorMode === 'standard') && (<div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="initialInvestment" className="font-semibold">
              {t('bonds.initial_investment')}
            </Label>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.floor(inputs.initialInvestment / 100)} {t('bonds.units')}
            </span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input id="initialInvestment" type="number" className={cn("pl-4 pr-12 text-sm font-medium", !isDivisibleBy100 && inputs.initialInvestment > 0 && "border-destructive focus-visible:ring-destructive")} value={inputs.initialInvestment} onChange={(e) => handleInvestmentChange(Number(e.target.value))}/>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                PLN
              </div>
            </div>
            {!isDivisibleBy100 && inputs.initialInvestment > 0 && (<div className="flex items-center gap-2 text-xs font-medium text-destructive">
                <AlertCircle className="h-3 w-3"/>
                <span>{t('bonds.error_100_pln')}</span>
              </div>)}
            <CommittedSliderInput value={inputs.initialInvestment} min={100} max={100000} step={100} unit="PLN" sliderClassName="py-4" showInput={false} onCommit={handleInvestmentChange}/>
          </div>
        </div>)}
    </div>);
});
BondConfigSection.displayName = 'BondConfigSection';





