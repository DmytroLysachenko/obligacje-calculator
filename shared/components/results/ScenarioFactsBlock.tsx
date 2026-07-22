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
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="ui-section-title">{title}</h3>
          <p className="ui-body mt-1 max-w-3xl text-muted-foreground">{description}</p>
        </div>
        {actions}
      </div>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {items.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="ui-meta font-semibold">{fact.label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
