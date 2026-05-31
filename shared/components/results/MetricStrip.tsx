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

export function MetricStrip({
  items,
  columns = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
}: MetricStripProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
      <div className={cn('grid divide-y divide-border md:divide-y-0 md:divide-x', columns)}>
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5 px-4 py-4">
            <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
            <p className={cn('text-xl font-semibold tracking-tight text-foreground', item.tone)}>
              {item.value}
            </p>
            {item.description ? (
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
