'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

export interface RecentLotDisplayItem {
  key: string;
  title: string;
  subtitle: string;
  value: string;
  valueLabel: string;
  details: Array<{
    label: string;
    value: string;
    tone?: 'neutral' | 'positive' | 'warning';
  }>;
}

interface RecentLotListProps {
  title: string;
  description: string;
  note?: string;
  items: RecentLotDisplayItem[];
}

const detailToneClass = {
  neutral: 'text-foreground',
  positive: 'financial-positive',
  warning: 'text-[var(--finance-warning)]',
} as const;

export const RecentLotList = React.memo(function RecentLotList({
  title,
  description,
  note,
  items,
}: RecentLotListProps) {
  return (
    <section className="surface-shell space-y-5 p-5">
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 ui-card-title">
          <Calendar className="h-5 w-5" />
          {title}
        </h2>
        <p className="ui-body text-muted-foreground">{description}</p>
        {note ? (
          <p className="border-l-2 border-border bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
            {note}
          </p>
        ) : null}
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <article key={item.key} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.valueLabel}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
              {item.details.map((detail) => (
                <div key={detail.label}>
                  <p className="text-xs font-semibold text-muted-foreground">{detail.label}</p>
                  <p className={`mt-1 font-medium ${detailToneClass[detail.tone ?? 'neutral']}`}>
                    {detail.value}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});
