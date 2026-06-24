'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface MetricStripItem {
  label: string;
  value: string;
  description?: string;
  tone?: string;
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
    <section className={cn('border-y border-border', className)}>
      <div className={cn('grid divide-y divide-border md:divide-y-0', columns)}>
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-0 space-y-2 py-4 md:border-l md:border-border md:px-4 md:first:border-l-0 md:first:pl-0"
          >
            <p className="ui-meta font-semibold">{item.label}</p>
            <p
              className={cn(
                'financial-number ui-large-metric min-w-0 break-words text-foreground',
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
