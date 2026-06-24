'use client';

import React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartStep } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import {
  loadChartDisplayPreferences,
  saveChartDisplayPreferences,
} from '@/shared/lib/chart-display-preferences';
import { formatMoneyAxisTick } from '@/shared/lib/chart-series';

import { BondValueChartToolbar, BondValueChartTooltip } from './BondValueChartParts';

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
  onGranularityChange?: (step: ChartStep) => void;
  showContextControls?: boolean;
  ariaLabel: string;
  heightClassName?: string;
}

export function BondValueChart({
  data,
  series,
  formatCurrency,
  leftDomain,
  rightDomain,
  summary,
  defaultGranularity = 'yearly',
  onGranularityChange,
  showContextControls = true,
  ariaLabel,
  heightClassName = 'h-[360px] md:h-[460px] xl:h-[520px]',
}: BondValueChartProps) {
  const { t } = useAppI18n();
  const [preferences, setPreferences] = React.useState(() =>
    loadChartDisplayPreferences(defaultGranularity),
  );
  const showInflationOverlay = preferences.showInflationOverlay;
  const showNbpOverlay = preferences.showNbpOverlay;
  const granularity = preferences.granularity;
  const showContextAxis = showInflationOverlay || showNbpOverlay;
  const firstProjectedIndex = React.useMemo(
    () => data.findIndex((point) => point.isProjected),
    [data],
  );

  React.useEffect(() => {
    if (granularity !== defaultGranularity) {
      onGranularityChange?.(granularity);
    }
  }, [defaultGranularity, granularity, onGranularityChange]);

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
      saveChartDisplayPreferences(next);
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
      saveChartDisplayPreferences(next);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <BondValueChartToolbar
        granularity={granularity}
        legendItems={legendItems}
        showContextControls={showContextControls}
        showInflationOverlay={showInflationOverlay}
        showNbpOverlay={showNbpOverlay}
        onGranularityChange={handleGranularityChange}
        onOverlayChange={updateOverlayPreference}
        t={t}
      />

      <ChartContainer
        ariaLabel={ariaLabel}
        summary={<p>{summary}</p>}
        responsiveHeightClassName={heightClassName}
      >
        <ResponsiveContainer width="100%" height="100%" key={`chart-${data.length}`}>
          <ComposedChart data={data} margin={{ top: 12, right: 52, left: 40, bottom: 20 }}>
            <defs>
              {series.map((item) => (
                <linearGradient key={item.key} id={`value-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={item.color}
                    stopOpacity={item.secondary ? 0.06 : 0.12}
                  />
                  <stop offset="95%" stopColor={item.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
              dy={10}
              minTickGap={30}
              tickFormatter={(value: string) => (value.length <= 9 ? value : value.slice(0, 9))}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatMoneyAxisTick(Number(value))}
              domain={leftDomain}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              width={44}
              tick={
                showContextAxis
                  ? { fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }
                  : false
              }
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
              domain={rightDomain}
            />
            <Tooltip content={<BondValueChartTooltip formatCurrency={formatCurrency} t={t} />} />
            {firstProjectedIndex !== -1 ? (
              <ReferenceLine
                x={data[firstProjectedIndex].label}
                stroke="#C89D4F"
                strokeDasharray="3 3"
                label={{
                  value: t('bonds.projection_start'),
                  position: 'top',
                  fill: '#C89D4F',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
            ) : null}
            {series.map((item, index) => {
              const Component = index === 0 ? Area : Line;
              return (
                <Component
                  key={item.key}
                  yAxisId="left"
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={item.secondary ? 2 : 2.25}
                  strokeOpacity={item.secondary ? 0.65 : 1}
                  strokeDasharray={item.dashed ? '4 4' : undefined}
                  fill={index === 0 ? `url(#value-${item.key})` : 'transparent'}
                  fillOpacity={index === 0 ? 1 : 0}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              );
            })}
            {showInflationOverlay ? (
              <Line
                yAxisId="right"
                type="stepAfter"
                dataKey="inflation"
                name={t('bonds.ref_inflation')}
                stroke="#C89D4F"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
            {showNbpOverlay ? (
              <Line
                yAxisId="right"
                type="stepAfter"
                dataKey="nbp"
                name={t('bonds.nbp_rate_short')}
                stroke="#6F7782"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
