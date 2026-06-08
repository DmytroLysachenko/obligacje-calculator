'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { BondInputs, BondType } from '@/features/bond-core/types';
import { Target, AlertTriangle } from 'lucide-react';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';
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
    <SegmentedControl
      value={advancedActive ? 'advanced' : 'simple'}
      options={[
        { value: 'simple', label: simpleLabel },
        { value: 'advanced', label: advancedLabel },
      ]}
      onValueChange={(value) => {
        if (value === 'advanced') {
          onAdvanced();
          return;
        }

        onSimple();
      }}
      className="w-full min-w-[14rem] md:w-auto"
      itemClassName="h-8 text-[11px] tracking-[0.06em]"
    />
  );
}

function CurrentAssumptionValue({
  value,
  unit = '%',
  compact,
  children,
}: {
  value: number;
  unit?: string;
  compact: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-l border-border pl-4 text-right">
      <span className={cn('font-black tabular-nums text-foreground', compact ? 'text-xl' : 'text-2xl')}>
        {value}
        {unit}
      </span>
      {children}
    </div>
  );
}

function AssumptionHeader({
  label,
  htmlFor,
  muted = false,
  compact,
  history,
  value,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  muted?: boolean;
  compact: boolean;
  history: React.ReactNode;
  value: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3 border-y border-border py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={htmlFor}
            className={cn(
              'font-semibold tracking-[0.08em]',
              muted ? 'text-muted-foreground' : 'text-primary',
              compact ? 'text-xs' : 'text-sm',
            )}
          >
            {label}
          </Label>
          {history}
        </div>
        {value}
      </div>
      {children}
    </div>
  );
}

export const MarketAssumptionsForm = ({
  expectedInflation,
  expectedNbpRate,
  bondType,
  customInflation,
  customNbpRate,
  onUpdate,
  compact = false,
  inflationHorizonYears = 10,
}: MarketAssumptionsFormProps) => {
    const { t } = useAppI18n();
    const isInflationIndexedBond = isInflationIndexedBondType(bondType);
    const isNbpRelevant = isFloatingNbpBondType(bondType);
    return (<div className="space-y-6">
      <div className="space-y-3">
        <p className={cn('font-semibold tracking-[0.08em] text-foreground', compact ? 'text-xs uppercase' : 'text-sm')}>
          {t('bonds.market_assumptions.simple_title')}
        </p>
        <p className="text-[11px] leading-5 text-muted-foreground">
          {t('bonds.market_assumptions.advanced_desc')}
        </p>
        <MacroDefaultsSummary
          showNbp={isNbpRelevant}
          compact={compact}
        />
      </div>

      <div className="space-y-4">
        <AssumptionSemanticsNote bondType={bondType} showNbpNote={isNbpRelevant} />

        <AssumptionHeader
          htmlFor="expectedInflation"
          compact={compact}
          label={`${t('bonds.inflation.rate')} (%)`}
          history={(
            <AssumptionHistoryPopover
              endpoint="/api/charts/inflation"
              title={t('bonds.historical_context')}
              latestLabel={t('bonds.latest_official')}
              footerNote={t('bonds.nbp_target_hint', { target: '2.5%' })}
            />
          )}
          value={(
            <CurrentAssumptionValue value={expectedInflation} compact={compact}>
              {expectedInflation <= 0 && <AlertTriangle className="h-4 w-4 text-warning"/>}
              {Math.abs(expectedInflation - 2.5) <= 1 && <Target className="h-4 w-4 text-success"/>}
            </CurrentAssumptionValue>
          )}
        >
          <SegmentedControl
            value={
              !customInflation && expectedInflation === 2.5
                ? 'stable'
                : !customInflation && expectedInflation === 6
                  ? 'high'
                  : !customInflation && expectedInflation === -1
                    ? 'deflation'
                    : 'custom'
            }
            options={[
              { value: 'stable', label: `${t('bonds.stable')} (2.5%)` },
              { value: 'high', label: `${t('bonds.high')} (6%)` },
              { value: 'deflation', label: `${t('bonds.deflation')} (-1%)` },
            ]}
            onValueChange={(value) => {
              const presetValue = value === 'stable' ? 2.5 : value === 'high' ? 6 : -1;
              onUpdate('customInflation', undefined);
              onUpdate('expectedInflation', presetValue);
            }}
            className="grid-cols-3"
            itemClassName="text-[11px] tracking-[0.06em]"
          />
        </AssumptionHeader>

        <CommittedSliderInput
          value={Number.isFinite(expectedInflation) ? expectedInflation : 0}
          disabled={!!customInflation}
          min={-2}
          max={15}
          step={0.1}
          unit="%"
          onCommit={(value) => onUpdate('expectedInflation', value)}
        />

        {isInflationIndexedBond ? null : (<div className="ui-inline-notice text-muted-foreground">
            {t('bonds.market_assumptions.non_indexed_note')}
          </div>)}

        {isInflationIndexedBond ? (
          <div className="space-y-3 border-t border-dashed pt-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="ui-card-title">
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
          <AssumptionHeader
            htmlFor="expectedNbpRate"
            muted
            compact={compact}
            label={t('bonds.nbp_rate_label')}
            history={(
              <AssumptionHistoryPopover
                endpoint="/api/charts/nbp-rate"
                title={t('bonds.market_assumptions.nbp_history_title')}
                latestLabel={t('bonds.market_assumptions.latest_nbp_label')}
                footerNote={t('bonds.market_assumptions.nbp_flat_default_note')}
              />
            )}
            value={<CurrentAssumptionValue value={expectedNbpRate ?? 5.25} compact={compact} />}
          />
          <CommittedSliderInput
            value={Number.isFinite(expectedNbpRate ?? 5.25)
              ? (expectedNbpRate ?? 5.25)
              : 5.25}
            min={0}
            max={15}
            step={0.05}
            unit="%"
            onCommit={(value) => onUpdate('expectedNbpRate', value)}
          />
          <p className="text-[11px] leading-5 text-muted-foreground">
            {t('bonds.market_assumptions.nbp_note')}
          </p>
          <div className="space-y-3 border-t border-dashed pt-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="ui-card-title">
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





