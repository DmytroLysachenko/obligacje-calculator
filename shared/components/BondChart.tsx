'use client';

import React, { useMemo } from 'react';
import { BaseAreaChart } from './charts/BaseAreaChart';
import { useChartSync } from '@/shared/context/ChartSyncContext';

interface BondChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xAxisKey: string;
  areas: {
    key: string;
    name: string;
    color: string;
    fillOpacity?: number;
  }[];
  height?: number;
  yAxisFormatter?: (value: number) => string;
}

export const BondChart: React.FC<BondChartProps> = ({
  data,
  xAxisKey,
  areas,
  height = 400,
  yAxisFormatter,
}) => {
  const { hoverIndex } = useChartSync();

  // Dynamic decimation: target around 180 points for smooth performance while keeping detail
  const processedData = useMemo(() => {
    const MAX_POINTS = 180;
    if (data.length <= MAX_POINTS) return data;
    
    const step = Math.ceil(data.length / MAX_POINTS);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [data]);

  // Optimization: Disable animations during active interaction (when hovering)
  const isAnimationActive = hoverIndex === null;

  return (
    <BaseAreaChart
      data={processedData}
      xAxisKey={xAxisKey}
      areas={areas}
      height={height}
      yAxisFormatter={yAxisFormatter}
      isAnimationActive={isAnimationActive}
    />
  );
};
