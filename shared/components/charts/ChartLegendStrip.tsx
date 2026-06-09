'use client';

import React from 'react';
import {cn} from '@/lib/utils';

export interface ChartLegendItem {
  label: string;
  color: string;
  style?: 'solid' | 'dashed' | 'muted';
}

interface ChartLegendStripProps {
  items: ChartLegendItem[];
  className?: string;
}

export const ChartLegendStrip = React.memo(function ChartLegendStrip({items, className}: ChartLegendStripProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-3', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span
            className={cn(
              'h-0.5 w-6 rounded-full',
              item.style === 'dashed' && 'border-t border-dashed bg-transparent',
              item.style === 'muted' && 'opacity-55',
            )}
            style={{
              backgroundColor: item.style === 'dashed' ? 'transparent' : item.color,
              borderColor: item.color,
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
});
