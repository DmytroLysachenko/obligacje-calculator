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
import {
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';

interface ChartData {
  [key: string]: string | number;
}

interface AreaConfig {
  key: string;
  name: string;
  color: string;
  fillOpacity?: number;
}

interface BaseAreaChartProps {
  data: ChartData[];
  xAxisKey: string;
  areas: AreaConfig[];
  height?: number;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  customTooltip?: React.FC<TooltipProps<ValueType, NameType>>;
}

export const BaseAreaChart: React.FC<BaseAreaChartProps> = ({
  data,
  xAxisKey,
  areas,
  height = 400,
  yAxisFormatter,
  customTooltip: CustomTooltipComponent,
}) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {areas.map((area) => (
              <linearGradient key={area.key} id={`color_${area.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color} stopOpacity={area.fillOpacity || 0.3} />
                <stop offset="95%" stopColor={area.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis 
            dataKey={xAxisKey} 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={yAxisFormatter}
          />
          {CustomTooltipComponent ? <Tooltip content={<CustomTooltipComponent />} /> : <Tooltip />}
          <Legend 
            verticalAlign="top" 
            align="right" 
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
          />
          {areas.map((area) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.name}
              stroke={area.color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#color_${area.key})`}
              animationDuration={1500}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
