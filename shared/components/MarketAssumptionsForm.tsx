'use client';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { BondInputs, BondType } from '@/features/bond-core/types';
import { Target, AlertTriangle } from 'lucide-react';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { AssumptionHistoryPopover } from '@/shared/components/market-assumptions/AssumptionHistoryPopover';
import { ProjectedRatePathEditor } from '@/shared/components/market-assumptions/ProjectedRatePathEditor';
type UpdateHandler = {
    bivarianceHack: (key: keyof BondInputs | string, value: unknown) => void;
}['bivarianceHack'];
interface MarketAssumptionsFormProps {
    expectedInflation: number;
    expectedNbpRate?: number;
    bondType: BondType;
    customInflation?: number[];
    customNbpRate?: number[];
    inflationScenario?: 'low' | 'base' | 'high';
    onUpdate: UpdateHandler;
    compact?: boolean;
    inflationHorizonYears?: number;
}
const INDEXED_BONDS = new Set<BondType>([
    BondType.COI,
    BondType.EDO,
    BondType.ROS,
    BondType.ROD,
]);
export const MarketAssumptionsForm = ({ expectedInflation, expectedNbpRate, bondType, customInflation, customNbpRate, inflationScenario = 'base', onUpdate, compact = false, inflationHorizonYears = 10, }: MarketAssumptionsFormProps) => {
    const { t } = useAppI18n();
    const isInflationIndexedBond = INDEXED_BONDS.has(bondType);
    const isNbpRelevant = bondType === BondType.ROR || bondType === BondType.DOR;
    const scenarioDescriptions = {
        low: t('bonds.market_assumptions.scenario_descriptions.low'),
        base: t('bonds.market_assumptions.scenario_descriptions.base'),
        high: t('bonds.market_assumptions.scenario_descriptions.high'),
    } as const;
    return (<div className="space-y-6">
      <div className="space-y-2">
        <p className={cn('font-semibold tracking-[0.08em] text-slate-900', compact ? 'text-xs uppercase' : 'text-sm')}>
          {t('bonds.market_assumptions.simple_title')}
        </p>
        <p className="text-[11px] leading-5 text-muted-foreground">
          {t('bonds.market_assumptions.advanced_desc')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-[11px] leading-5 text-slate-600">
          {isInflationIndexedBond
            ? t('bonds.market_assumptions.indexed_context') : isNbpRelevant
            ? t('bonds.market_assumptions.floating_context') : t('bonds.market_assumptions.real_value_context')}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="expectedInflation" className={cn('font-semibold tracking-[0.08em] text-primary', compact ? 'text-xs' : 'text-sm')}>
              {t('bonds.inflation.rate')} (%)
            </Label>
            <AssumptionHistoryPopover
              endpoint="/api/charts/inflation"
              title={t('bonds.historical_context')}
              latestLabel={t('bonds.latest_official')}
              footerNote={t('bonds.nbp_target_hint', { target: '2.5%' })}
            />
          </div>
          <div className={cn('flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 font-black text-primary shadow-sm', compact ? 'text-xl' : 'text-[2rem]')}>
            {expectedInflation}%
            {expectedInflation <= 0 && <AlertTriangle className="h-4 w-4 text-orange-500"/>}
            {Math.abs(expectedInflation - 2.5) <= 1 && <Target className="h-4 w-4 text-green-500"/>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[2.5, 6, -1].map((value) => (<Button key={value} variant="outline" size="sm" className={cn('h-9 text-[11px] font-semibold tracking-[0.08em]', expectedInflation === value && 'border-primary bg-primary text-primary-foreground')} onClick={() => onUpdate('expectedInflation', value)}>
              {value === 2.5 ? t('bonds.stable') : value === 6 ? t('bonds.high') : t('bonds.deflation')} ({value}%)
            </Button>))}
        </div>

        <CommittedSliderInput value={Number.isFinite(expectedInflation) ? expectedInflation : 0} disabled={!!customInflation} min={-2} max={15} step={0.1} unit="%" onCommit={(value) => onUpdate('expectedInflation', value)}/>

        {isInflationIndexedBond ? (<>
            <div className="space-y-3 border-t border-dashed pt-4">
              <Label className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {t('bonds.market_assumptions.post_year_one_label')}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'base', 'high'] as const).map((scenario) => (<Button key={scenario} variant="outline" size="sm" className={cn('h-9 min-w-0 text-[11px] font-semibold tracking-[0.08em]', inflationScenario === scenario && 'border-primary/50 bg-primary/10 text-primary')} onClick={() => onUpdate('inflationScenario', scenario)}>
                    <span className="truncate">{t(`bonds.inflation.scenarios.${scenario}`)}</span>
                  </Button>))}
              </div>
              <p className="text-[11px] italic leading-5 text-muted-foreground">
                {scenarioDescriptions[inflationScenario]}
              </p>
            </div>
          </>) : (<div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-[11px] leading-5 text-slate-600">
            {t('bonds.market_assumptions.non_indexed_note')}
          </div>)}
      </div>

      {isNbpRelevant ? (<div className="space-y-4 border-t border-dashed pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="expectedNbpRate" className={cn('font-semibold tracking-[0.08em] text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
                {t('bonds.nbp_rate_label')}
              </Label>
              <AssumptionHistoryPopover
                endpoint="/api/charts/nbp-rate"
                title={t('bonds.market_assumptions.nbp_history_title')}
                latestLabel={t('bonds.market_assumptions.latest_nbp_label')}
                footerNote={t('bonds.market_assumptions.nbp_flat_default_note')}
              />
            </div>
            <span className={cn('font-black text-primary', compact ? 'text-xl' : 'text-2xl')}>
              {expectedNbpRate ?? 5.25}%
            </span>
          </div>
          <CommittedSliderInput value={Number.isFinite(expectedNbpRate ?? 5.25) ? (expectedNbpRate ?? 5.25) : 5.25} min={0} max={15} step={0.05} unit="%" onCommit={(value) => onUpdate('expectedNbpRate', value)}/>
          <p className="text-[11px] leading-5 text-muted-foreground">
            {t('bonds.market_assumptions.nbp_note')}
          </p>
          <p className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-[11px] leading-5 text-slate-600">
            {t('bonds.market_assumptions.nbp_flat_default_note')}
          </p>
        </div>) : null}

      <Accordion type="multiple" className="space-y-3">
        {isInflationIndexedBond ? (
          <AccordionItem value="inflation-path" className="rounded-xl border px-4">
            <AccordionTrigger className="py-4 text-left">
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {t('bonds.market_assumptions.inflation_path_title')}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t('bonds.market_assumptions.inflation_path_desc')}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-muted/30 p-3.5">
                <Label className="text-sm font-semibold">{t('bonds.advanced_inflation')}</Label>
                <Switch
                  checked={!!customInflation}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onUpdate(
                        'customInflation',
                        Array(Math.max(1, Math.round(inflationHorizonYears))).fill(expectedInflation),
                      );
                      return;
                    }
                    onUpdate('customInflation', undefined);
                  }}
                />
              </div>
              {customInflation ? (
                <ProjectedRatePathEditor
                  values={customInflation}
                  prefix="Y"
                  step={0.1}
                  onChange={(values) => onUpdate('customInflation', values)}
                />
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {isNbpRelevant ? (
          <AccordionItem value="nbp-path" className="rounded-xl border px-4">
            <AccordionTrigger className="py-4 text-left">
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {t('bonds.market_assumptions.nbp_path_title')}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t('bonds.market_assumptions.nbp_path_desc')}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-muted/30 p-3.5">
                <Label className="text-sm font-semibold">{t('bonds.advanced_nbp')}</Label>
                <Switch
                  checked={!!customNbpRate}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onUpdate(
                        'customNbpRate',
                        Array(Math.max(1, Math.round(inflationHorizonYears))).fill(expectedNbpRate ?? 5.25),
                      );
                      return;
                    }
                    onUpdate('customNbpRate', undefined);
                  }}
                />
              </div>
              {customNbpRate ? (
                <ProjectedRatePathEditor
                  values={customNbpRate}
                  prefix="Y"
                  step={0.05}
                  onChange={(values) => onUpdate('customNbpRate', values)}
                />
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ) : null}
      </Accordion>
    </div>);
};





