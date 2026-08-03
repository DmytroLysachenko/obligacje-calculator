import React from 'react';

import { useAppI18n } from '@/i18n/client';
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
  const { t } = useAppI18n();

  return (
    <div className={cn(pageLayout.compactFlow, className)}>
      <nav
        className="flex flex-wrap gap-x-4 gap-y-2 border-y border-border py-3 text-xs font-semibold text-muted-foreground"
        aria-label={t('common.section_navigation')}
      >
        <a className="ui-focus-ring rounded-sm hover:text-foreground" href="#calculator-inputs">
          {t('common.plan')}
        </a>
        <a className="ui-focus-ring rounded-sm hover:text-foreground" href="#calculator-results">
          {t('common.summary')}
        </a>
        {details ? (
          <a className="ui-focus-ring rounded-sm hover:text-foreground" href="#calculator-details">
            {t('common.details')}
          </a>
        ) : null}
      </nav>
      <div className={pageLayout.calculatorGrid}>
        <section
          id="calculator-inputs"
          aria-label={t('common.plan')}
          className={cn('ui-section-anchor', pageLayout.scenarioPlan, controlsClassName)}
        >
          {controls}
        </section>
        <section
          id="calculator-results"
          aria-live="polite"
          className={cn('ui-section-anchor', pageLayout.sectionFlow, resultsClassName)}
        >
          {results}
        </section>
      </div>
      {details ? (
        <section
          id="calculator-details"
          className={cn(
            'ui-section-anchor ui-content-visibility',
            pageLayout.sectionFlow,
            pageLayout.sectionDivider,
            detailsClassName,
          )}
        >
          {details}
        </section>
      ) : null}
    </div>
  );
}
