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
    <section className="rounded-lg border border-border bg-card px-5 py-5 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="ui-section-title">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {actions}
      </div>

      <div className="mt-4 grid gap-0 overflow-hidden rounded-md border border-border sm:grid-cols-2">
        {items.map((fact, index) => (
          <div
            key={fact.label}
            className={[
              'px-4 py-3',
              'border-border',
              index >= 2 ? 'border-t' : '',
              index % 2 === 1 ? 'sm:border-l' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <p className="text-xs font-semibold text-muted-foreground">{fact.label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{fact.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
