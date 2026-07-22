'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export interface FinancialInsightItem {
  label: string;
  value: string;
  description: string;
  tone?: 'default' | 'success' | 'warning';
}

interface FinancialInsightStripProps {
  title: string;
  description: string;
  items: FinancialInsightItem[];
}

const toneClass = {
  default: 'border-border text-foreground',
  success: 'border-success/50 text-foreground',
  warning: 'border-warning/50 text-foreground',
} as const;

export const FinancialInsightStrip = React.memo(function FinancialInsightStrip({
  title,
  description,
  items,
}: FinancialInsightStripProps) {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h2 className="ui-card-title">{title}</h2>
        <p className="ui-body max-w-[var(--layout-reading-max)] text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              'border-l-2 px-4 py-3 text-sm leading-6',
              toneClass[item.tone ?? 'default'],
            )}
          >
            <p className="ui-meta font-semibold">{item.label}</p>
            <p className="financial-number mt-1 text-lg font-semibold text-foreground">
              {item.value}
            </p>
            <p className="mt-1 text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
});
