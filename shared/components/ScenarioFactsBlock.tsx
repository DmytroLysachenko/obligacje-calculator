'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ScenarioFactsItem {
  label: string;
  value: string;
}

interface ScenarioFactsBlockProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  items: ScenarioFactsItem[];
}

export function ScenarioFactsBlock({
  title,
  description,
  actions,
  items,
}: ScenarioFactsBlockProps) {
  return (
    <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-7 text-slate-600">
              {description}
            </p>
          </div>
          {actions}
        </div>

        {items.map((fact) => (
          <div key={fact.label} className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <p className="text-sm font-semibold text-slate-500">{fact.label}</p>
            <p className="mt-1 text-base font-semibold text-slate-950">{fact.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
