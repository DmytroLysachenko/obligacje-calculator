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

        <div className="grid border-y border-border sm:grid-cols-2 sm:border-y-0">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="border-b border-border py-3 last:border-b-0 sm:border-b sm:px-4 sm:first:pl-0 sm:[&:nth-child(2)]:border-l sm:[&:nth-child(2)]:pl-4 sm:[&:nth-child(4)]:border-l sm:[&:nth-child(4)]:pl-4 sm:[&:nth-last-child(-n+2)]:border-b-0"
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
