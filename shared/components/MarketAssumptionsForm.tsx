'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { BondInputs, BondType } from '@/features/bond-core/types';

import { TrendingUp, History, Target, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChartData } from '@/shared/hooks/useChartData';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';

interface InflationDataPoint {
  date: string;
  rate: number;
}

interface InflationApiResponse {
  data: InflationDataPoint[];
}

type UpdateHandler = {
  bivarianceHack: (key: keyof BondInputs | string, value: unknown) => void;
}['bivarianceHack'];

interface MarketAssumptionsFormProps {
  expectedInflation: number;
  expectedNbpRate?: number;
  bondType: BondType;
  customInflation?: number[];
  inflationScenario?: 'low' | 'base' | 'high';
  onUpdate: UpdateHandler;
  compact?: boolean;
  inflationHorizonYears?: number;
}

const HistoricalInflationContent = () => {
  const { t } = useLanguage();
  const { data, isLoading } = useChartData<InflationApiResponse>('/api/charts/inflation');
  
  if (isLoading) return <div className="flex justify-center p-4"><History className="h-4 w-4 animate-spin" /></div>;
  if (!data?.data) return <div className="p-4 text-sm italic text-muted-foreground">{t('common.no_data')}</div>;

  const lastFew = data.data.slice(-5).reverse();
  const latest = data.data[data.data.length - 1];

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center gap-2 border-b pb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold tracking-[0.08em]">{t('bonds.historical_context')}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-lg border border-primary/10">
          <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">{t('bonds.latest_official')}</span>
          <span className="text-sm font-black text-primary">{latest.rate}% ({latest.date})</span>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {lastFew.map((item: InflationDataPoint, idx: number) => (
            <div key={idx} className="flex justify-between px-1 text-xs">
              <span className="text-muted-foreground font-medium">{item.date}</span>
              <span className="font-bold">{item.rate}%</span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-dashed">
          <p className="text-[11px] leading-5 text-muted-foreground italic">
            {t('bonds.nbp_target_hint', { target: '2.5%' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export const MarketAssumptionsForm = ({
  expectedInflation,
  expectedNbpRate,
  bondType,
  customInflation,
  inflationScenario = 'base',
  onUpdate,
  compact = false,
  inflationHorizonYears = 10,
}: MarketAssumptionsFormProps) => {
  const { t, language } = useLanguage();
  const scenarioDescriptions = {
    low:
      language === 'pl'
        ? 'Symuluje inflację o 1.5 p.p. niższą od założenia bazowego.'
        : 'Simulates inflation 1.5 percentage points below your base assumption.',
    base:
      language === 'pl'
        ? 'Używa dokładnie wybranej przez Ciebie stopy inflacji.'
        : 'Uses the exact inflation rate you selected.',
    high:
      language === 'pl'
        ? 'Symuluje inflację o 2.5 p.p. wyższą od założenia bazowego.'
        : 'Simulates inflation 2.5 percentage points above your base assumption.',
  } as const;

  const isNbpRelevant = bondType === BondType.ROR || bondType === BondType.DOR;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* ... existing inflation slider and inputs ... */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="expectedInflation" className={cn('font-semibold tracking-[0.08em] text-primary', compact ? 'text-xs' : 'text-sm')}>
              {t('bonds.inflation.rate')} (%)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/10">
                  <History className="h-3.5 w-3.5 text-primary/60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <HistoricalInflationContent />
              </PopoverContent>
            </Popover>
          </div>
          <div className={cn('flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 font-black text-primary shadow-sm', compact ? 'text-xl' : 'text-[2rem]')}>
            {expectedInflation}%
            {expectedInflation <= 0 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
            {Math.abs(expectedInflation - 2.5) <= 1 && <Target className="h-4 w-4 text-green-500" />}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[2.5, 6, -1].map((val) => (
            <Button 
              key={val}
              variant="outline" 
              size="sm" 
              className={cn(
                'h-9 text-[11px] font-semibold tracking-[0.08em]', 
                expectedInflation === val && "bg-primary text-primary-foreground border-primary"
              )} 
              onClick={() => onUpdate('expectedInflation', val)}
            >
              {val === 2.5 ? t('bonds.stable') : val === 6 ? t('bonds.high') : t('bonds.deflation')} ({val}%)
            </Button>
          ))}
        </div>

        <CommittedSliderInput
          value={Number.isFinite(expectedInflation) ? expectedInflation : 0}
          disabled={!!customInflation}
          min={-2}
          max={15}
          step={0.1}
          unit="%"
          onCommit={(value) => onUpdate('expectedInflation', value)}
        />

        <div className="space-y-3 pt-4 border-t border-dashed">
          <Label className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {t('bonds.inflation.scenarios.label')}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'base', 'high'] as const).map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
              className={cn(
                'h-9 min-w-0 text-[11px] font-semibold tracking-[0.08em]',
                inflationScenario === s && "bg-primary/10 text-primary border-primary/50"
              )}
              onClick={() => onUpdate('inflationScenario', s)}
            >
                <span className="truncate">{t(`bonds.inflation.scenarios.${s}`)}</span>
              </Button>
            ))}
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground italic">
            {scenarioDescriptions[inflationScenario]}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/10 bg-muted/30 p-3.5">
          <Label className="text-sm font-semibold">{t('bonds.advanced_inflation')}</Label>
          <Switch 
            checked={!!customInflation} 
            onCheckedChange={(checked) => {
              if (checked) {
                onUpdate(
                  'customInflation',
                  Array(Math.max(1, Math.round(inflationHorizonYears))).fill(expectedInflation),
                );
              } else {
                onUpdate('customInflation', undefined);
              }
            }} 
          />
        </div>
        
        {customInflation && (
          <div className="relative z-10 mt-4 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-xl border bg-muted/20 p-2 custom-scrollbar md:grid-cols-3">
            {customInflation.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded border bg-background p-2">
                <Label className="w-8 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">Y{idx + 1}</Label>
                <Input 
                  type="number" 
                  step={0.1}
                  className="h-8 border-none bg-transparent px-1 text-sm font-semibold shadow-none"
                  value={val}
                  onChange={(e) => {
                    const newArr = [...customInflation!];
                    newArr[idx] = Number(e.target.value);
                    onUpdate('customInflation', newArr);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {isNbpRelevant && (
        <div className="space-y-4 pt-4 border-t border-dashed">
          <div className="flex justify-between items-center">
            <Label htmlFor="expectedNbpRate" className={cn('font-semibold tracking-[0.08em] text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
              {t('bonds.nbp_rate_label')}
            </Label>
            <span className={cn('font-black text-primary', compact ? 'text-xl' : 'text-2xl')}>{expectedNbpRate ?? 5.25}%</span>
          </div>
          <CommittedSliderInput
            value={Number.isFinite(expectedNbpRate ?? 5.25) ? (expectedNbpRate ?? 5.25) : 5.25}
            min={0}
            max={15}
            step={0.05}
            unit="%"
            onCommit={(value) => onUpdate('expectedNbpRate', value)}
          />
        </div>
      )}
    </div>
  );
};
