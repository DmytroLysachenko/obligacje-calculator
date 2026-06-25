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

import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { formatMoneyAxisTick } from '@/shared/lib/chart-series';

import type { BondValueChartPoint, BondValueChartSeries } from './BondValueChart';
import { BondValueChartTooltip } from './BondValueChartParts';

type ChartTranslate = (key: string) => string;

interface BondValueChartPlotProps {
  data: BondValueChartPoint[];
  series: BondValueChartSeries[];
  formatCurrency: (value: number) => string;
  leftDomain: [number, number] | ['auto', 'auto'];
  rightDomain: [number, number] | ['auto', 'auto'];
  showContextAxis: boolean;
  showInflationOverlay: boolean;
  showNbpOverlay: boolean;
  ariaLabel: string;
  summary: string;
  heightClassName: string;
  t: ChartTranslate;
}

export function BondValueChartPlot({
  data,
  series,
  formatCurrency,
  leftDomain,
  rightDomain,
  showContextAxis,
  showInflationOverlay,
  showNbpOverlay,
  ariaLabel,
  summary,
  heightClassName,
  t,
}: BondValueChartPlotProps) {
  const firstProjectedIndex = React.useMemo(
    () => data.findIndex((point) => point.isProjected),
    [data],
  );

  return (
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
  );
}
