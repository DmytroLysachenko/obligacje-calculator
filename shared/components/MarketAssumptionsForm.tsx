'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { BondInputs, BondType } from '@/features/bond-core/types';
import { Target, AlertTriangle } from 'lucide-react';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { AssumptionHistoryPopover } from '@/shared/components/market-assumptions/AssumptionHistoryPopover';
import { AssumptionSemanticsNote } from '@/shared/components/market-assumptions/AssumptionSemanticsNote';
import { MacroDefaultsSummary } from '@/shared/components/market-assumptions/MacroDefaultsSummary';
import { ProjectedRatePathEditor } from '@/shared/components/market-assumptions/ProjectedRatePathEditor';
import { isFloatingNbpBondType, isInflationIndexedBondType } from '@/shared/lib/market-assumption-semantics';

type UpdateHandler = {
  bivarianceHack: (key: keyof BondInputs | string, value: unknown) => void;
}['bivarianceHack'];
interface MarketAssumptionsFormProps {
    expectedInflation: number;
    expectedNbpRate?: number;
    bondType: BondType;
    customInflation?: number[];
    customNbpRate?: number[];
    onUpdate: UpdateHandler;
    compact?: boolean;
    inflationHorizonYears?: number;
}

function ProjectionModeButtons({
  simpleLabel,
  advancedLabel,
  advancedActive,
  onSimple,
  onAdvanced,
}: {
  simpleLabel: string;
  advancedLabel: string;
  advancedActive: boolean;
  onSimple: () => void;
  onAdvanced: () => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <Button
        type="button"
        variant={advancedActive ? 'ghost' : 'default'}
        size="sm"
        className="h-8 px-3 text-[11px] font-semibold tracking-[0.06em]"
        onClick={onSimple}
      >
        {simpleLabel}
      </Button>
      <Button
        type="button"
        variant={advancedActive ? 'default' : 'ghost'}
        size="sm"
        className="h-8 px-3 text-[11px] font-semibold tracking-[0.06em]"
        onClick={onAdvanced}
      >
        {advancedLabel}
      </Button>
    </div>
  );
}

export const MarketAssumptionsForm = ({ expectedInflation, expectedNbpRate, bondType, customInflation, customNbpRate, onUpdate, compact = false, inflationHorizonYears = 10, }: MarketAssumptionsFormProps) => {
    const { t } = useAppI18n();
    const isInflationIndexedBond = isInflationIndexedBondType(bondType);
    const isNbpRelevant = isFloatingNbpBondType(bondType);
    return (<div className="space-y-6">
      <div className="space-y-3">
        <p className={cn('font-semibold tracking-[0.08em] text-slate-900', compact ? 'text-xs uppercase' : 'text-sm')}>
          {t('bonds.market_assumptions.simple_title')}
        </p>
        <p className="text-[11px] leading-5 text-muted-foreground">
          {t('bonds.market_assumptions.advanced_desc')}
        </p>
        <MacroDefaultsSummary showNbp={isNbpRelevant} compact={compact} />
      </div>

      <div className="space-y-4">
        <AssumptionSemanticsNote bondType={bondType} showNbpNote={isNbpRelevant} />

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
          {[2.5, 6, -1].map((value) => (<Button key={value} variant="outline" size="sm" className={cn('h-9 text-[11px] font-semibold tracking-[0.08em]', expectedInflation === value && !customInflation && 'border-primary bg-primary text-primary-foreground')} onClick={() => {
              onUpdate('customInflation', undefined);
              onUpdate('expectedInflation', value);
            }}>
              {value === 2.5 ? t('bonds.stable') : value === 6 ? t('bonds.high') : t('bonds.deflation')} ({value}%)
            </Button>))}
        </div>

        <CommittedSliderInput value={Number.isFinite(expectedInflation) ? expectedInflation : 0} disabled={!!customInflation} min={-2} max={15} step={0.1} unit="%" onCommit={(value) => onUpdate('expectedInflation', value)}/>

        {isInflationIndexedBond ? null : (<div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-[11px] leading-5 text-slate-600">
            {t('bonds.market_assumptions.non_indexed_note')}
          </div>)}

        {isInflationIndexedBond ? (
          <div className="space-y-3 border-t border-dashed pt-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-950">
                  {t('bonds.market_assumptions.inflation_path_title')}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t('bonds.market_assumptions.inflation_path_desc')}
                </p>
              </div>
              <ProjectionModeButtons
                simpleLabel={t('bonds.market_assumptions.simple_mode_label')}
                advancedLabel={t('bonds.market_assumptions.advanced_mode_label')}
                advancedActive={!!customInflation}
                onSimple={() => onUpdate('customInflation', undefined)}
                onAdvanced={() =>
                  onUpdate(
                    'customInflation',
                    Array(Math.max(1, Math.round(inflationHorizonYears))).fill(expectedInflation),
                  )
                }
              />
            </div>
            {customInflation ? (
              <ProjectedRatePathEditor
                values={customInflation}
                prefix="Y"
                step={0.1}
                onChange={(values) => onUpdate('customInflation', values)}
              />
            ) : (
              <p className="text-[11px] leading-5 text-muted-foreground">
                {t('bonds.market_assumptions.inflation_simple_mode_note')}
              </p>
            )}
          </div>
        ) : null}
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
          <div className="space-y-3 border-t border-dashed pt-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-950">
                  {t('bonds.market_assumptions.nbp_path_title')}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t('bonds.market_assumptions.nbp_path_desc')}
                </p>
              </div>
              <ProjectionModeButtons
                simpleLabel={t('bonds.market_assumptions.simple_mode_label')}
                advancedLabel={t('bonds.market_assumptions.advanced_mode_label')}
                advancedActive={!!customNbpRate}
                onSimple={() => onUpdate('customNbpRate', undefined)}
                onAdvanced={() =>
                  onUpdate(
                    'customNbpRate',
                    Array(Math.max(1, Math.round(inflationHorizonYears))).fill(expectedNbpRate ?? 5.25),
                  )
                }
              />
            </div>
            {customNbpRate ? (
              <ProjectedRatePathEditor
                values={customNbpRate}
                prefix="Y"
                step={0.05}
                onChange={(values) => onUpdate('customNbpRate', values)}
              />
            ) : (
              <p className="text-[11px] leading-5 text-muted-foreground">
                {t('bonds.market_assumptions.nbp_simple_mode_note')}
              </p>
            )}
          </div>
        </div>) : null}
    </div>);
};





