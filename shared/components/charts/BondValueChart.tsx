'use client';

import React from 'react';

import { ChartStep } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import {
  loadChartDisplayPreferences,
  saveChartDisplayPreferences,
} from '@/shared/lib/chart-display-preferences';

import { BondValueChartToolbar } from './BondValueChartParts';
import { BondValueChartPlot } from './BondValueChartPlot';
import { ChartDataTable } from './ChartDataTable';

export interface BondValueChartSeries {
  key: string;
  label: string;
  color: string;
  secondary?: boolean;
  dashed?: boolean;
}

export interface BondValueChartPoint {
  label: string;
  date: string;
  dateKey?: string;
  isProjected?: boolean;
  inflation?: number;
  nbp?: number;
  interestRate?: number;
  rateSource?: string;
  eventLabels?: string[];
  scenarioGroups?: BondValueChartTooltipGroup[];
  [key: string]: string | number | boolean | string[] | BondValueChartTooltipGroup[] | undefined;
}

export interface BondValueChartTooltipMetric {
  label: string;
  value: number;
  color: string;
  currency?: boolean;
}

export interface BondValueChartTooltipGroup {
  id: string;
  title: string;
  color: string;
  projected?: boolean;
  interestRate?: number;
  rateSource?: string;
  eventLabels?: string[];
  metrics: BondValueChartTooltipMetric[];
}

interface BondValueChartProps {
  data: BondValueChartPoint[];
  series: BondValueChartSeries[];
  formatCurrency: (value: number) => string;
  leftDomain: [number, number] | ['auto', 'auto'];
  rightDomain: [number, number] | ['auto', 'auto'];
  summary: string;
  defaultGranularity?: ChartStep;
  availableGranularities?: ChartStep[];
  onGranularityChange?: (step: ChartStep) => void;
  showContextControls?: boolean;
  showInflationControl?: boolean;
  showNbpControl?: boolean;
  ariaLabel: string;
  heightClassName?: string;
  preferenceScope?: string;
  leadingControls?: React.ReactNode;
}

export function BondValueChart({
  data,
  series,
  formatCurrency,
  leftDomain,
  rightDomain,
  summary,
  defaultGranularity = 'yearly',
  availableGranularities = ['monthly', 'quarterly', 'yearly'],
  onGranularityChange,
  showContextControls = true,
  showInflationControl = true,
  showNbpControl = true,
  ariaLabel,
  heightClassName = 'h-[360px] md:h-[460px] xl:h-[520px]',
  preferenceScope,
  leadingControls,
}: BondValueChartProps) {
  const { t } = useAppI18n();
  const [preferences, setPreferences] = React.useState(() =>
    loadChartDisplayPreferences(defaultGranularity, preferenceScope),
  );
  const showInflationOverlay = preferences.showInflationOverlay;
  const showNbpOverlay = preferences.showNbpOverlay;
  const granularity = preferences.granularity;
  const showContextAxis = showInflationOverlay || showNbpOverlay;
  const hasSyncedInitialPreference = React.useRef(false);

  React.useEffect(() => {
    if (!hasSyncedInitialPreference.current) {
      hasSyncedInitialPreference.current = true;
      onGranularityChange?.(granularity);
      return;
    }

    setPreferences((current) => {
      if (current.granularity === defaultGranularity) {
        return current;
      }

      const next = {
        ...current,
        granularity: defaultGranularity,
      };
      saveChartDisplayPreferences(next, preferenceScope);
      return next;
    });
  }, [defaultGranularity, granularity, onGranularityChange, preferenceScope]);

  const legendItems = React.useMemo(
    () => [
      ...series.map((item) => ({
        label: item.label,
        color: item.color,
        style: item.dashed ? ('dashed' as const) : undefined,
      })),
      ...(showContextControls && showInflationOverlay
        ? [{ label: t('bonds.ref_inflation'), color: '#C89D4F', style: 'dashed' as const }]
        : []),
      ...(showContextControls && showNbpOverlay
        ? [{ label: t('bonds.nbp_rate_short'), color: '#6F7782', style: 'dashed' as const }]
        : []),
    ],
    [series, showContextControls, showInflationOverlay, showNbpOverlay, t],
  );

  const handleGranularityChange = (nextStep: ChartStep) => {
    setPreferences((current) => {
      const next = {
        ...current,
        granularity: nextStep,
      };
      saveChartDisplayPreferences(next, preferenceScope);
      return next;
    });
    onGranularityChange?.(nextStep);
  };

  const updateOverlayPreference = (
    key: 'showInflationOverlay' | 'showNbpOverlay',
    value: boolean,
  ) => {
    setPreferences((current) => {
      const next = {
        ...current,
        [key]: value,
      };
      saveChartDisplayPreferences(next, preferenceScope);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <BondValueChartToolbar
        granularity={granularity}
        availableGranularities={availableGranularities}
        legendItems={legendItems}
        showContextControls={showContextControls}
        showInflationOverlay={showInflationOverlay}
        showNbpOverlay={showNbpOverlay}
        showInflationControl={showInflationControl}
        showNbpControl={showNbpControl}
        onGranularityChange={handleGranularityChange}
        onOverlayChange={updateOverlayPreference}
        leadingControls={leadingControls}
        t={t}
      />

      <BondValueChartPlot
        data={data}
        series={series}
        formatCurrency={formatCurrency}
        leftDomain={leftDomain}
        rightDomain={rightDomain}
        showContextAxis={showContextAxis}
        showInflationOverlay={showInflationOverlay}
        showNbpOverlay={showNbpOverlay}
        ariaLabel={ariaLabel}
        summary={summary}
        heightClassName={heightClassName}
        t={t}
      />
      <ChartDataTable data={data} series={series} formatCurrency={formatCurrency} />
    </div>
  );
}
