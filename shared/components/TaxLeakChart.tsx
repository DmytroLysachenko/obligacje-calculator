'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from 'recharts';
import { ChartContainer } from './charts/ChartContainer';
import { useChartSync } from '@/shared/context/ChartSyncContext';
import { useAppI18n } from '@/i18n/client';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { SyncedChartMouseState, TooltipPayloadEntry } from './charts/chart-types';

export interface TaxLeakDataPoint {
  year: number;
  month: number;
  taxFreeCapital: number;
  standardCapital: number;
  taxLeak: number; // taxFreeCapital - standardCapital
}

interface TaxLeakChartProps {
  data: TaxLeakDataPoint[];
  height?: number;
}

type SyncedAreaChartProps = React.ComponentProps<typeof AreaChart> & {
  activeTooltipIndex?: number;
  onMouseMove?: (state: SyncedChartMouseState) => void;
};

const AreaChartWithTooltipIndex =
  AreaChart as unknown as React.ComponentType<SyncedAreaChartProps>;

type TaxLeakTooltipEntry = TooltipPayloadEntry<TaxLeakDataPoint>;

interface TaxLeakTooltipProps extends TooltipProps<ValueType, NameType> {
  payload?: TaxLeakTooltipEntry[];
  label?: NameType;
}

const CustomTooltip = ({ active, payload, label }: TaxLeakTooltipProps) => {
  const { t } = useAppI18n();

  if (active && payload && payload.length) {
    const taxFree = Number(
      payload.find((p) => p.dataKey === 'taxFreeCapital')?.value ?? 0,
    );
    const standard = Number(
      payload.find((p) => p.dataKey === 'standardCapital')?.value ?? 0,
    );
    const leak = Number(payload.find((p) => p.dataKey === 'taxLeak')?.value ?? 0);

    return (
      <div className="bg-background border rounded p-3 shadow-md">
        <p className="font-semibold mb-2">
          {t('bonds.tax_leak.year', { year: String(label ?? '') })}
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-emerald-500">IKE/IKZE: {taxFree.toFixed(2)} PLN</p>
          <p className="text-blue-500">{t('bonds.tax_leak.standard_account')}: {standard.toFixed(2)} PLN</p>
          <div className="h-px w-full bg-border my-1" />
          <p className="text-red-500 font-medium">{t('bonds.tax_leak.tax_leak_label')}: {leak.toFixed(2)} PLN</p>
        </div>
      </div>
    );
  }
  return null;
};

export const TaxLeakChart: React.FC<TaxLeakChartProps> = ({
  data,
  height = 400,
}) => {
  const { hoverIndex, setHoverIndex } = useChartSync();
  const { t } = useAppI18n();

  return (
    <ChartContainer height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChartWithTooltipIndex
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          onMouseMove={(state) => {
            if (state.activeTooltipIndex !== undefined) {
              setHoverIndex(Number(state.activeTooltipIndex));
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
          activeTooltipIndex={hoverIndex !== null ? hoverIndex : undefined}
        >
          <defs>
            <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLeak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis 
            dataKey="year" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          {/* Base standard capital area */}
          <Area
            type="monotone"
            dataKey="standardCapital"
            stackId="1"
            stroke="#3b82f6"
            fill="url(#colorStandard)"
            name={t('bonds.tax_leak.standard_account')}
            animationDuration={1500}
          />
          {/* Tax leak area stacked on top to represent total tax-free capital */}
          <Area
            type="monotone"
            dataKey="taxLeak"
            stackId="1"
            stroke="#ef4444"
            fill="url(#colorLeak)"
            name={t('bonds.tax_leak.opportunity_cost')}
            animationDuration={1500}
          />
          {/* Invisible line just for the tooltip to show the total tax-free amount easily */}
          <Area
            type="monotone"
            dataKey="taxFreeCapital"
            stroke="none"
            fill="none"
            name={t('bonds.tax_leak.ike_ikze_potential')}
            activeDot={false}
            legendType="none"
          />
        </AreaChartWithTooltipIndex>
      </ResponsiveContainer>
    </ChartContainer>
  );
};




