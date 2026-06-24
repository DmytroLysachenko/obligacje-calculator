import React from 'react';
import { cn } from '@/lib/utils';
import { pageLayout } from './layout-system';

interface CalculatorWorkspaceProps {
  controls: React.ReactNode;
  results: React.ReactNode;
  details?: React.ReactNode;
  className?: string;
  controlsClassName?: string;
  resultsClassName?: string;
  detailsClassName?: string;
}

export function CalculatorWorkspace({
  controls,
  results,
  details,
  className,
  controlsClassName,
  resultsClassName,
  detailsClassName,
}: CalculatorWorkspaceProps) {
  return (
    <div className={cn(pageLayout.compactFlow, className)}>
      <div className={pageLayout.calculatorGrid}>
        <aside className={cn(pageLayout.stickyScenario, controlsClassName)}>{controls}</aside>
        <section className={cn(pageLayout.sectionFlow, resultsClassName)}>{results}</section>
      </div>
      {details ? (
        <section
          className={cn(pageLayout.sectionFlow, pageLayout.sectionDivider, detailsClassName)}
        >
          {details}
        </section>
      ) : null}
    </div>
  );
}
