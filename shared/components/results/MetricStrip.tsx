'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/shared/components/feedback/InfoTooltip';

export interface MetricStripItem {
  label: string;
  value: string;
  description?: string;
  tone?: string;
  emphasis?: 'primary' | 'supporting';
}

interface MetricStripProps {
  items: MetricStripItem[];
  columns?: string;
  className?: string;
}

export const MetricStrip = React.memo(function MetricStrip({
  items,
  columns = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  className,
}: MetricStripProps) {
  return (
    <section className={cn('ui-metric-strip', className)}>
      <div className={cn('grid divide-y divide-border md:divide-y-0', columns)}>
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-0 space-y-2 py-4 md:border-l md:border-border md:px-5 md:first:border-l-0 md:first:pl-0"
          >
            <div className="flex items-center gap-1">
              <p className="ui-meta font-semibold">{item.label}</p>
              {item.description ? <InfoTooltip content={item.description} /> : null}
            </div>
            <p
              className={cn(
                'financial-number min-w-0 whitespace-nowrap text-foreground',
                item.emphasis === 'supporting' ? 'ui-supporting-metric' : 'ui-large-metric',
                item.tone,
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
});
