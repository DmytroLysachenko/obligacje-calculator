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
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-none">
      <div className={cn('grid divide-y divide-slate-200 md:divide-y-0 md:divide-x', columns)}>
        {items.map((item) => (
          <div key={item.label} className="space-y-2 px-5 py-5">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className={cn('text-2xl font-black tracking-tight text-slate-950', item.tone)}>
              {item.value}
            </p>
            {item.description ? (
              <p className="text-sm leading-6 text-slate-600">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
