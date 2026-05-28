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
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-none md:px-8 md:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] xl:items-start">
        <div className="space-y-3">
          {badge}
          <h2 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950">{title}</h2>
          <p className="max-w-4xl text-sm leading-8 text-slate-600">{description}</p>
        </div>

        <div className="grid gap-0 rounded-[1.5rem] border border-slate-200 sm:grid-cols-2">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={[
                'px-4 py-4',
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
              <p className="mt-2 text-xl font-black tracking-tight text-slate-950">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
