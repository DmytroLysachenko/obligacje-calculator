'use client';
import React from 'react';
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ReferenceChartFrame } from '@/shared/components/charts/ReferenceChartFrame';
import { useChartData } from '@/shared/hooks/useChartData';
import { sampleSeriesPoints, sliceSeriesByPeriod } from '@/shared/lib/chart-series';
import { getReferenceMetaItems } from '@/shared/lib/data-reference';

import {
  ChartSeriesEnvelope,
  EconomicSeriesPoint,
  PeriodValue,
} from '../lib/economic-dashboard-model';

import { EconomicChartTooltip } from './EconomicChartTooltip';

export const InflationChart = ({
  period = 'ALL',
  scaleMode = 'readable',
  onScaleChange,
}: {
  period?: PeriodValue;
  scaleMode?: 'readable' | 'full';
  onScaleChange?: (mode: 'readable' | 'full') => void;
}) => {
  const { t, locale: language } = useAppI18n();
  const {
    data: response,
    isLoading,
    isError,
  } = useChartData<ChartSeriesEnvelope<EconomicSeriesPoint>>('/api/charts/inflation');
  const chartData = React.useMemo(() => {
    const rawData = response?.data ?? [];
    return sampleSeriesPoints(sliceSeriesByPeriod(rawData, period), 160);
  }, [period, response?.data]);
  const maxRate = Math.max(...chartData.map((point) => point.rate), 0);
  const secondLargest =
    [...chartData.map((point) => point.rate)].sort((a, b) => b - a)[1] ?? maxRate;
  const clippedMax = Math.max(20, Math.ceil(secondLargest * 1.25));
  const yDomain: [number, number] | undefined =
    scaleMode === 'full'
      ? undefined
      : [
          Math.min(0, Math.floor(Math.min(...chartData.map((point) => point.rate), 0))),
          Math.min(maxRate, clippedMax),
        ];
  if (isLoading) {
    return <Skeleton className="h-[470px] w-full rounded-lg" />;
  }
  if (isError) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-destructive">
        {t('economic.failed_to_load')}
      </div>
    );
  }
  return (
    <ReferenceChartFrame
      sourceLabel={t('economic.compact_source_header')}
      metaItems={getReferenceMetaItems(response, language)}
      actions={
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={scaleMode === 'readable' ? 'default' : 'outline'}
            onClick={() => onScaleChange?.('readable')}
            className="rounded-md"
          >
            {t('economic.readable_scale')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={scaleMode === 'full' ? 'default' : 'outline'}
            onClick={() => onScaleChange?.('full')}
            className="rounded-md"
          >
            {t('economic.full_scale')}
          </Button>
        </div>
      }
      notice={
        scaleMode === 'readable' && maxRate > clippedMax
          ? t('economic.inflation_scale_notice', { max: maxRate.toFixed(1) })
          : undefined
      }
      noticeTone="warning"
      fallbackNotice={
        response?.usedFallback
          ? t('economic.fallback_notices.inflation_warning')
          : t('economic.fallback_notices.inflation_live')
      }
      fallbackTone={response?.usedFallback ? 'warning' : 'good'}
      fallbackStatusLabel={t('economic.reference_state.fallback')}
      syncedStatusLabel={t('economic.reference_state.synced')}
    >
      <ChartContainer height={420}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis
              fontSize={12}
              tickFormatter={(value: number) => `${value}%`}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              allowDataOverflow={scaleMode === 'readable'}
            />
            <Tooltip
              content={
                <EconomicChartTooltip
                  metricLabel={t('bonds.inflation.rate')}
                  minWidthClassName="min-w-[140px]"
                />
              }
            />
            <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
            <ReferenceLine
              y={2.5}
              label={{
                value: t('economic.nbp_target'),
                position: 'right',
                fontSize: 10,
                fill: '#C89D4F',
              }}
              stroke="#C89D4F"
              strokeDasharray="3 3"
            />
            {chartData.length > 24 ? (
              <Brush dataKey="date" height={22} stroke="#5C5C5C" travellerWidth={8} />
            ) : null}
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#111111"
              strokeWidth={2}
              dot={
                chartData.length <= 24
                  ? { r: 4, fill: '#111111', strokeWidth: 2, stroke: '#fff' }
                  : false
              }
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ReferenceChartFrame>
  );
};
