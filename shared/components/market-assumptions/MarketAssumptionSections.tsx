'use client';

import { AlertTriangle, Target } from 'lucide-react';

import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { AssumptionHistoryPopover } from '@/shared/components/market-assumptions/AssumptionHistoryPopover';
import {
  InflationPresetControls,
  NbpPresetControls,
} from '@/shared/components/market-assumptions/AssumptionPresetControls';
import {
  AssumptionHeader,
  CurrentAssumptionValue,
  ProjectionModeButtons,
} from '@/shared/components/market-assumptions/AssumptionSectionControls';
import { ProjectedRatePathEditor } from '@/shared/components/market-assumptions/ProjectedRatePathEditor';
import { AssumptionSetupMode } from '@/shared/lib/market-assumptions-form-model';

type UpdateHandler = {
  bivarianceHack: (key: string, value: unknown) => void;
}['bivarianceHack'];

interface InflationAssumptionSectionProps {
  compact: boolean;
  expectedInflation: number;
  customInflation?: number[];
  inflationHeaderValue: string | number;
  activeInflationMode: AssumptionSetupMode;
  isInflationIndexedBond: boolean;
  onUpdate: UpdateHandler;
  onModeChange: (mode: AssumptionSetupMode) => void;
}

interface NbpAssumptionSectionProps {
  compact: boolean;
  section: 'all' | 'inflation' | 'nbp';
  expectedNbpRate?: number;
  customNbpRate?: number[];
  nbpHeaderValue: string | number;
  activeNbpMode: AssumptionSetupMode;
  isNbpRelevant: boolean;
  onUpdate: UpdateHandler;
  onModeChange: (mode: AssumptionSetupMode) => void;
}

export function InflationAssumptionSection({
  compact,
  expectedInflation,
  customInflation,
  inflationHeaderValue,
  activeInflationMode,
  isInflationIndexedBond,
  onUpdate,
  onModeChange,
}: InflationAssumptionSectionProps) {
  const { t } = useAppI18n();

  return (
    <>
      <AssumptionHeader
        htmlFor="expectedInflation"
        compact={compact}
        label={`${t('bonds.inflation.rate')} (%)`}
        history={
          <AssumptionHistoryPopover
            endpoint="/api/charts/inflation"
            title={t('bonds.historical_context')}
            latestLabel={t('bonds.latest_official')}
            footerNote={t('bonds.nbp_target_hint', { target: '2.5%' })}
          />
        }
        value={
          <CurrentAssumptionValue
            value={inflationHeaderValue}
            unit={activeInflationMode === 'advanced' ? '' : '%'}
            compact={compact}
          >
            {activeInflationMode !== 'advanced' && expectedInflation <= 0 ? (
              <AlertTriangle className="h-4 w-4 text-warning" />
            ) : null}
            {activeInflationMode !== 'advanced' && Math.abs(expectedInflation - 2.5) <= 1 ? (
              <Target className="h-4 w-4 text-success" />
            ) : null}
          </CurrentAssumptionValue>
        }
      >
        <ProjectionModeButtons value={activeInflationMode} onChange={onModeChange} />
      </AssumptionHeader>

      {activeInflationMode === 'fixed' ? (
        <InflationPresetControls
          value={expectedInflation}
          labels={{
            stable: t('bonds.stable'),
            high: t('bonds.high'),
            deflation: t('bonds.deflation'),
          }}
          onSelect={(presetValue) => {
            onUpdate('customInflation', undefined);
            onUpdate('expectedInflation', presetValue);
          }}
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

      {isInflationIndexedBond ? null : (
        <div className="ui-inline-notice text-muted-foreground">
          {t('bonds.market_assumptions.non_indexed_note')}
        </div>
      )}

      {isInflationIndexedBond && activeInflationMode === 'advanced' ? (
        <div className="space-y-3 border-t border-dashed pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="ui-card-title">{t('bonds.market_assumptions.inflation_path_title')}</p>
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
      ) : null}
    </>
  );
}

export function NbpAssumptionSection({
  compact,
  section,
  expectedNbpRate,
  customNbpRate,
  nbpHeaderValue,
  activeNbpMode,
  isNbpRelevant,
  onUpdate,
  onModeChange,
}: NbpAssumptionSectionProps) {
  const { t } = useAppI18n();

  return (
    <div className={cn('space-y-4', section === 'all' && 'border-t border-dashed pt-4')}>
      <AssumptionHeader
        htmlFor="expectedNbpRate"
        muted
        compact={compact}
        label={t('bonds.nbp_rate_label')}
        history={
          <AssumptionHistoryPopover
            endpoint="/api/charts/nbp-rate"
            title={t('bonds.market_assumptions.nbp_history_title')}
            latestLabel={t('bonds.market_assumptions.latest_nbp_label')}
            footerNote={t('bonds.market_assumptions.nbp_flat_default_note')}
          />
        }
        value={
          <CurrentAssumptionValue
            value={nbpHeaderValue}
            unit={activeNbpMode === 'advanced' ? '' : '%'}
            compact={compact}
          />
        }
      >
        <ProjectionModeButtons value={activeNbpMode} onChange={onModeChange} />
      </AssumptionHeader>
      {activeNbpMode === 'fixed' ? (
        <NbpPresetControls
          value={expectedNbpRate}
          labels={{
            current: t('bonds.market_assumptions.nbp_preset_current'),
            high: t('bonds.market_assumptions.nbp_preset_high'),
            low: t('bonds.market_assumptions.nbp_preset_low'),
          }}
          onSelect={(presetValue) => {
            onUpdate('customNbpRate', undefined);
            onUpdate('expectedNbpRate', presetValue);
          }}
        />
      ) : null}
      {activeNbpMode === 'simple' ? (
        <CommittedSliderInput
          value={Number.isFinite(expectedNbpRate ?? 5.25) ? (expectedNbpRate ?? 5.25) : 5.25}
          min={0}
          max={15}
          step={0.05}
          unit="%"
          onCommit={(value) => onUpdate('expectedNbpRate', value)}
        />
      ) : null}
      <p className="text-[11px] leading-5 text-muted-foreground">
        {isNbpRelevant
          ? t('bonds.market_assumptions.nbp_note')
          : t('bonds.market_assumptions.nbp_flat_default_note')}
      </p>
      {activeNbpMode === 'advanced' ? (
        <div className="space-y-3 border-t border-dashed pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="ui-card-title">{t('bonds.market_assumptions.nbp_path_title')}</p>
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
        </div>
      ) : null}
    </div>
  );
}
