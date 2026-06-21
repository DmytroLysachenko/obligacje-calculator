'use client';
import React from 'react';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { BondInputs, BondType } from '@/features/bond-core/types';
import { Target, AlertTriangle } from 'lucide-react';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';
import {
  AssumptionHeader,
  CurrentAssumptionValue,
  ProjectionModeButtons,
} from '@/shared/components/market-assumptions/AssumptionSectionControls';
import { AssumptionHistoryPopover } from '@/shared/components/market-assumptions/AssumptionHistoryPopover';
import { AssumptionSemanticsNote } from '@/shared/components/market-assumptions/AssumptionSemanticsNote';
import { MacroDefaultsSummary } from '@/shared/components/market-assumptions/MacroDefaultsSummary';
import { ProjectedRatePathEditor } from '@/shared/components/market-assumptions/ProjectedRatePathEditor';
import { isFloatingNbpBondType, isInflationIndexedBondType } from '@/shared/lib/market-assumption-semantics';
import {
  getHeaderAssumptionValue,
  resolveAssumptionModeUpdate,
  type AssumptionSetupMode,
} from '@/shared/lib/market-assumptions-form-model';

export type { AssumptionSetupMode } from '@/shared/lib/market-assumptions-form-model';

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
    section?: 'all' | 'inflation' | 'nbp';
    showIntro?: boolean;
    inflationSetupMode?: AssumptionSetupMode;
    nbpSetupMode?: AssumptionSetupMode;
    onInflationSetupModeChange?: (mode: AssumptionSetupMode) => void;
    onNbpSetupModeChange?: (mode: AssumptionSetupMode) => void;
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
  section = 'all',
  showIntro = true,
  inflationSetupMode,
  nbpSetupMode,
  onInflationSetupModeChange,
  onNbpSetupModeChange,
}: MarketAssumptionsFormProps) => {
    const { t } = useAppI18n();
    const isInflationIndexedBond = isInflationIndexedBondType(bondType);
    const isNbpRelevant = isFloatingNbpBondType(bondType);
    const [inflationMode, setInflationMode] = React.useState<AssumptionSetupMode>(
      customInflation ? 'advanced' : 'fixed',
    );
    const [nbpMode, setNbpMode] = React.useState<AssumptionSetupMode>(
      customNbpRate ? 'advanced' : 'fixed',
    );
    const activeInflationMode = inflationSetupMode ?? inflationMode;
    const activeNbpMode = nbpSetupMode ?? nbpMode;
    const inflationHeaderValue = getHeaderAssumptionValue({
      mode: activeInflationMode,
      customPath: customInflation,
      fallback: expectedInflation,
    });
    const nbpHeaderValue = getHeaderAssumptionValue({
      mode: activeNbpMode,
      customPath: customNbpRate,
      fallback: expectedNbpRate ?? 5.25,
    });
    const horizonLength = Math.max(1, Math.round(inflationHorizonYears));
    const showInflationSection = section === 'all' || section === 'inflation';
    const showNbpSection = section === 'all' || section === 'nbp';

    React.useEffect(() => {
      if (customInflation) {
        if (inflationSetupMode === undefined) {
          setInflationMode('advanced');
        }
        onInflationSetupModeChange?.('advanced');
      }
    }, [customInflation, inflationSetupMode, onInflationSetupModeChange]);

    React.useEffect(() => {
      if (customNbpRate) {
        if (nbpSetupMode === undefined) {
          setNbpMode('advanced');
        }
        onNbpSetupModeChange?.('advanced');
      }
    }, [customNbpRate, nbpSetupMode, onNbpSetupModeChange]);

    const updateInflationMode = (mode: AssumptionSetupMode) => {
      const update = resolveAssumptionModeUpdate({
        mode,
        horizonLength,
        currentValue: expectedInflation,
        fixedFallback: 2.5,
      });
      setInflationMode(mode);
      onInflationSetupModeChange?.(mode);
      if (update.customPath) {
        onUpdate('customInflation', update.customPath);
        return;
      }
      onUpdate('customInflation', undefined);
      if (update.fixedValue !== undefined) {
        onUpdate('expectedInflation', update.fixedValue);
      }
    };

    const updateNbpMode = (mode: AssumptionSetupMode) => {
      const baseNbp = expectedNbpRate ?? 5.25;
      const update = resolveAssumptionModeUpdate({
        mode,
        horizonLength,
        currentValue: baseNbp,
        fixedFallback: 5.25,
      });
      setNbpMode(mode);
      onNbpSetupModeChange?.(mode);
      if (update.customPath) {
        onUpdate('customNbpRate', update.customPath);
        return;
      }
      onUpdate('customNbpRate', undefined);
      if (update.fixedValue !== undefined) {
        onUpdate('expectedNbpRate', update.fixedValue);
      }
    };

    return (<div className="space-y-6">
      {showIntro ? (<div className="space-y-3">
        <p className={cn('font-semibold tracking-[0.08em] text-foreground', compact ? 'text-xs uppercase' : 'text-sm')}>
          {t('bonds.market_assumptions.simple_title')}
        </p>
        <p className="text-[11px] leading-5 text-muted-foreground">
          {t('bonds.market_assumptions.advanced_desc')}
        </p>
        <MacroDefaultsSummary
          showNbp={isNbpRelevant || section === 'nbp'}
          compact={compact}
        />
      </div>) : null}

      <div className="space-y-4">
        {section === 'all' ? (
          <AssumptionSemanticsNote bondType={bondType} showNbpNote={isNbpRelevant} />
        ) : null}

        {showInflationSection ? (<>
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
            <CurrentAssumptionValue
              value={inflationHeaderValue}
              unit={activeInflationMode === 'advanced' ? '' : '%'}
              compact={compact}
            >
              {activeInflationMode !== 'advanced' && expectedInflation <= 0 && <AlertTriangle className="h-4 w-4 text-warning"/>}
              {activeInflationMode !== 'advanced' && Math.abs(expectedInflation - 2.5) <= 1 && <Target className="h-4 w-4 text-success"/>}
            </CurrentAssumptionValue>
          )}
        >
          <ProjectionModeButtons value={activeInflationMode} onChange={updateInflationMode} />
        </AssumptionHeader>

        {activeInflationMode === 'fixed' ? (
          <SegmentedControl
            value={
              expectedInflation === 2.5
                ? 'stable'
                : expectedInflation === 6
                  ? 'high'
                  : expectedInflation === -1
                    ? 'deflation'
                    : 'stable'
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
        ) : null}

        {activeInflationMode === 'simple' ? (
          <CommittedSliderInput
            value={Number.isFinite(expectedInflation) ? expectedInflation : 0}
            min={-2}
            max={15}
            step={0.1}
            unit="%"
            onCommit={(value) => onUpdate('expectedInflation', value)}
          />
        ) : null}

        {isInflationIndexedBond ? null : (<div className="ui-inline-notice text-muted-foreground">
            {t('bonds.market_assumptions.non_indexed_note')}
          </div>)}

        {isInflationIndexedBond && activeInflationMode === 'advanced' ? (
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
        ) : null}</>) : null}
      </div>

      {showNbpSection ? (<div className={cn('space-y-4', section === 'all' && 'border-t border-dashed pt-4')}>
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
            value={(
              <CurrentAssumptionValue
                value={nbpHeaderValue}
                unit={activeNbpMode === 'advanced' ? '' : '%'}
                compact={compact}
              />
            )}
          >
            <ProjectionModeButtons value={activeNbpMode} onChange={updateNbpMode} />
          </AssumptionHeader>
          {activeNbpMode === 'fixed' ? (
            <SegmentedControl
              value={
                (expectedNbpRate ?? 5.25) === 5.25
                  ? 'current'
                  : (expectedNbpRate ?? 5.25) === 6.75
                    ? 'high'
                    : (expectedNbpRate ?? 5.25) === 3.75
                      ? 'low'
                      : 'current'
              }
            options={[
                { value: 'current', label: `${t('bonds.market_assumptions.nbp_preset_current')} (5.25%)` },
                { value: 'high', label: `${t('bonds.market_assumptions.nbp_preset_high')} (6.75%)` },
                { value: 'low', label: `${t('bonds.market_assumptions.nbp_preset_low')} (3.75%)` },
              ]}
              onValueChange={(value) => {
                const presetValue = value === 'current' ? 5.25 : value === 'high' ? 6.75 : 3.75;
                onUpdate('customNbpRate', undefined);
                onUpdate('expectedNbpRate', presetValue);
              }}
              className="grid-cols-3"
              itemClassName="text-[11px] tracking-[0.06em]"
            />
          ) : null}
          {activeNbpMode === 'simple' ? (
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
          ) : null}
          <p className="text-[11px] leading-5 text-muted-foreground">
            {isNbpRelevant ? t('bonds.market_assumptions.nbp_note') : t('bonds.market_assumptions.nbp_flat_default_note')}
          </p>
          {activeNbpMode === 'advanced' ? (<div className="space-y-3 border-t border-dashed pt-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="ui-card-title">
                  {t('bonds.market_assumptions.nbp_path_title')}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t('bonds.market_assumptions.nbp_path_desc')}
                </p>
              </div>
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
          </div>) : null}
        </div>) : null}
    </div>);
};





