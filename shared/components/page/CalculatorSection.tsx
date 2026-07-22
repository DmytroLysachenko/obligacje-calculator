'use client';

import React from 'react';

import { cn } from '@/lib/utils';

import { pageLayout } from './layout-system';

interface CalculatorSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  divided?: boolean;
  className?: string;
}

export function CalculatorSection({
  title,
  description,
  children,
  divided = false,
  className,
}: CalculatorSectionProps) {
  return (
    <section
      className={cn(pageLayout.sectionFlow, divided && pageLayout.sectionDivider, className)}
    >
      <div className="ui-section-header pb-2">
        <div className="ui-section-intro">
          <h3 className="ui-section-title">{title}</h3>
          {description ? (
            <p className="ui-body ui-pretty text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
