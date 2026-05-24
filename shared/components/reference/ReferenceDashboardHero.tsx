'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_22px_70px_-48px_rgba(15,23,42,0.45)]">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] xl:items-start">
          <div className="space-y-3">
            {badge}
            <h2 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950">{title}</h2>
            <p className="max-w-4xl text-sm leading-8 text-slate-600">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.6rem] border border-white/90 bg-white/85 px-4 py-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.35)] backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-2 text-xl font-black tracking-tight text-slate-950">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
