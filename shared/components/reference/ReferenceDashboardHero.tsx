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
    <section className="border-y border-border py-5 md:py-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,440px)] xl:items-start">
        <div className="space-y-3">
          {badge}
          <h2 className="ui-section-title max-w-3xl">{title}</h2>
          <p className="ui-body max-w-3xl">{description}</p>
        </div>

        <div className="grid gap-x-8 gap-y-5 border-y border-border py-4 sm:grid-cols-2 sm:border-y-0 sm:py-1">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="border-l border-border/70 pl-4 first:border-l-0 first:pl-0 sm:[&:nth-child(odd)]:border-l-0 sm:[&:nth-child(odd)]:pl-0"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {metric.label}
              </p>
              <p className="mt-1.5 text-base font-semibold leading-6 tracking-tight text-foreground">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
