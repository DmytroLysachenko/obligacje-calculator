'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MetricStripItem {
  label: string;
  value: string;
  description?: string;
  tone?: string;
}

interface MetricStripProps {
  items: MetricStripItem[];
  columns?: string;
}

export const MetricStrip = React.memo(function MetricStrip({
  items,
  columns = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
}: MetricStripProps) {
  return (
    <section className="border-y border-border">
      <div className={cn('grid divide-y divide-border md:divide-y-0 md:divide-x', columns)}>
        {items.map((item) => (
          <div key={item.label} className="space-y-2 px-4 py-5">
            <p className="ui-meta font-semibold">{item.label}</p>
            <p className={cn('ui-large-metric text-foreground', item.tone)}>
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
