'use client';

import React from 'react';
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
    <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-none">
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

      <div className="mt-5 grid gap-0 rounded-[1.5rem] border border-slate-200 sm:grid-cols-2">
        {items.map((fact, index) => (
          <div
            key={fact.label}
            className={[
              'px-5 py-4',
              'border-slate-200',
              index >= 2 ? 'border-t' : '',
              index % 2 === 1 ? 'sm:border-l' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <p className="text-sm font-semibold text-slate-500">{fact.label}</p>
            <p className="mt-1 text-base font-semibold text-slate-950">{fact.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
