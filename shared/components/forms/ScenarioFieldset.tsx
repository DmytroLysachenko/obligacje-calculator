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
    <section
      className={cn('ui-control-stack', divided && 'border-t border-border pt-6', className)}
    >
      <div className="ui-section-intro">
        <h3 className="ui-card-title">{title}</h3>
        {description ? <p className="ui-field-description ui-pretty">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
