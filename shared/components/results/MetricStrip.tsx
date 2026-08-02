'use client';

import React from 'react';

import { cn } from '@/lib/utils';

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
            <p className="ui-meta font-semibold">{item.label}</p>
            <p
              className={cn(
                'financial-number min-w-0 whitespace-nowrap text-foreground',
                item.emphasis === 'supporting' ? 'ui-supporting-metric' : 'ui-large-metric',
                item.tone,
              )}
            >
              {item.value}
            </p>
            {item.description ? (
              <p className="ui-body text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
});
