'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface ScenarioFieldsetProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  divided?: boolean;
  className?: string;
}

export function ScenarioFieldset({
  title,
  description,
  children,
  divided = false,
  className,
}: ScenarioFieldsetProps) {
  return (
    <section className={cn('space-y-5', divided && 'border-t border-border pt-6', className)}>
      <div className="space-y-1.5">
        <h3 className="ui-card-title">{title}</h3>
        {description ? (
          <p className="ui-meta max-w-[var(--layout-reading-max)] leading-5">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
