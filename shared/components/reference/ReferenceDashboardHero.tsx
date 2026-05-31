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
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-none md:px-6 md:py-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,440px)] xl:items-start">
        <div className="space-y-3">
          {badge}
          <h2 className="max-w-3xl text-2xl font-black leading-tight tracking-tight text-slate-950 md:text-3xl">{title}</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
        </div>

        <div className="grid gap-0 overflow-hidden rounded-[1.25rem] border border-slate-200 sm:grid-cols-2">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={[
                'px-4 py-3',
                'border-slate-200',
                index >= 2 ? 'border-t' : '',
                index % 2 === 1 ? 'sm:border-l' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                {metric.label}
              </p>
              <p className="mt-1.5 text-lg font-black tracking-tight text-slate-950">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
