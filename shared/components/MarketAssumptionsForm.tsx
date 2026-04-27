'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { BondType } from '@/features/bond-core/types';

import { TrendingUp, History, Target, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChartData } from '@/shared/hooks/useChartData';

interface InflationDataPoint {
  date: string;
  rate: number;
}

interface InflationApiResponse {
  data: InflationDataPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MarketAssumptionsFormProps<T = Record<string, any>> {
  expectedInflation: number;
  expectedNbpRate?: number;
  bondType: BondType;
  customInflation?: number[];
  inflationScenario?: 'low' | 'base' | 'high';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (key: keyof T, value: any) => void;
  compact?: boolean;
}

const HistoricalInflationContent = () => {
  const { t } = useLanguage();
  const { data, isLoading } = useChartData<InflationApiResponse>('/api/charts/inflation');
  
  if (isLoading) return <div className="p-4 flex justify-center"><History className="h-4 w-4 animate-spin" /></div>;
  if (!data?.data) return <div className="p-4 text-xs italic text-muted-foreground">{t('common.no_data')}</div>;

  const lastFew = data.data.slice(-5).reverse();
  const latest = data.data[data.data.length - 1];

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center gap-2 border-b pb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-xs font-black uppercase tracking-widest">{t('bonds.historical_context')}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-lg border border-primary/10">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('bonds.latest_official')}</span>
          <span className="text-sm font-black text-primary">{latest.rate}% ({latest.date})</span>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {lastFew.map((item: InflationDataPoint, idx: number) => (
            <div key={idx} className="flex justify-between text-[10px] px-1">
              <span className="text-muted-foreground font-medium">{item.date}</span>
              <span className="font-bold">{item.rate}%</span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-dashed">
          <p className="text-[9px] text-muted-foreground leading-tight italic">
            {t('bonds.nbp_target_hint', { target: '2.5%' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export const MarketAssumptionsForm = <T,>({
  expectedInflation,
  expectedNbpRate,
  bondType,
  customInflation,
  inflationScenario = 'base',
  onUpdate,
  compact = false,
}: MarketAssumptionsFormProps<T>) => {
  const { t } = useLanguage();

  const isNbpRelevant = bondType === BondType.ROR || bondType === BondType.DOR;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* ... existing inflation slider and inputs ... */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="expectedInflation" className={cn("font-bold text-primary uppercase tracking-wider", compact ? "text-[10px]" : "text-xs")}>
              {t('bonds.inflation_rate')} (%)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-primary/10">
                  <History className="h-3.5 w-3.5 text-primary/60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <HistoricalInflationContent />
              </PopoverContent>
            </Popover>
          </div>
          <div className={cn("font-black text-primary bg-background px-3 py-1 rounded-lg border shadow-sm flex items-center gap-2", compact ? "text-lg" : "text-2xl")}>
            {expectedInflation}%
            {expectedInflation <= 0 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
            {Math.abs(expectedInflation - 2.5) <= 1 && <Target className="h-4 w-4 text-green-500" />}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[2.5, 10, -1].map((val) => (
            <Button 
              key={val}
              variant="outline" 
              size="sm" 
              className={cn(
                "h-8 text-[10px] font-black uppercase", 
                expectedInflation === val && "bg-primary text-primary-foreground border-primary"
              )} 
              onClick={() => onUpdate('expectedInflation' as keyof T, val)}
            >
              {val === 2.5 ? t('bonds.stable') : val === 10 ? t('bonds.high') : t('bonds.deflation')} ({val}%)
            </Button>
          ))}
        </div>

        <Slider 
          value={[expectedInflation]} 
          disabled={!!customInflation}
          min={-2} 
          max={25} 
          step={0.1} 
          onValueChange={([val]) => onUpdate('expectedInflation' as keyof T, val)}
        />

        <div className="space-y-3 pt-4 border-t border-dashed">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t('bonds.inflation_scenarios')}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'base', 'high'] as const).map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-[9px] font-bold uppercase",
                  inflationScenario === s && "bg-primary/10 text-primary border-primary/50"
                )}
                onClick={() => onUpdate('inflationScenario' as keyof T, s)}
              >
                {t(`bonds.scenario_${s}`)}
              </Button>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground italic leading-tight">
            {inflationScenario === 'low' && "Simulates -1.5% below your base expectation."}
            {inflationScenario === 'base' && "Uses your selected inflation rate exactly."}
            {inflationScenario === 'high' && "Simulates +2.5% above your base expectation."}
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-primary/10 mt-4">
          <Label className="text-xs font-bold">{t('bonds.advanced_inflation')}</Label>
          <Switch 
            checked={!!customInflation} 
            onCheckedChange={(checked) => {
              if (checked) {
                // Default to 10 years or something if we don't have duration here? 
                // Actually we should probably pass the duration or handled it in the parent.
                onUpdate('customInflation' as keyof T, Array(10).fill(expectedInflation));
              } else {
                onUpdate('customInflation' as keyof T, undefined);
              }
            }} 
          />
        </div>
        
        {customInflation && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 max-h-64 overflow-y-auto p-2 bg-muted/20 border rounded-xl custom-scrollbar relative z-10">
            {customInflation.map((val, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-background p-1.5 rounded border">
                <Label className="text-[10px] text-muted-foreground font-black uppercase w-8">Y{idx + 1}</Label>
                <Input 
                  type="number" 
                  step={0.1}
                  className="h-7 text-xs font-bold border-none bg-transparent shadow-none px-1"
                  value={val}
                  onChange={(e) => {
                    const newArr = [...customInflation!];
                    newArr[idx] = Number(e.target.value);
                    onUpdate('customInflation' as keyof T, newArr);
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
            <Label htmlFor="expectedNbpRate" className={cn("font-bold uppercase text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
              {t('bonds.nbp_rate_label')}
            </Label>
            <span className={cn("font-black text-primary", compact ? "text-lg" : "text-xl")}>{expectedNbpRate ?? 5.25}%</span>
          </div>
          <Slider 
            value={[expectedNbpRate ?? 5.25]} 
            min={0} 
            max={20} 
            step={0.05} 
            onValueChange={([val]) => onUpdate('expectedNbpRate' as keyof T, val)}
          />
        </div>
      )}
    </div>
  );
};
