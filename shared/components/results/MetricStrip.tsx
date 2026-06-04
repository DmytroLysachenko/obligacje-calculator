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
    <section className={cn('overflow-hidden rounded-lg border border-border bg-border shadow-sm', className)}>
      <div className={cn('grid gap-px', columns)}>
        {items.map((item) => (
          <div key={item.label} className="space-y-2 bg-card px-4 py-5">
            <p className="ui-meta font-semibold">{item.label}</p>
            <p className={cn('financial-number ui-large-metric text-foreground', item.tone)}>
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
