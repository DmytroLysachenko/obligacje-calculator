'use client';

import React from 'react';
interface ReferenceDashboardHeroMetric {
  label: string;
  value: string;
}

interface ReferenceDashboardHeroProps {
  badge: React.ReactNode;
  title: string;
  description: string;
  metrics: ReferenceDashboardHeroMetric[];
}

export function ReferenceDashboardHero({
  badge,
  title,
  description,
  metrics,
}: ReferenceDashboardHeroProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,440px)] xl:items-start">
        <div className="space-y-3">
          {badge}
          <h2 className="ui-section-title max-w-3xl">{title}</h2>
          <p className="ui-body max-w-3xl">{description}</p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-card px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {metric.label}
              </p>
              <p className="mt-1.5 text-base font-semibold tracking-tight text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
