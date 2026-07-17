'use client';

import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  BondInputs,
  CalculationResult,
  ChartStep,
  SingleBondCalculationEnvelope,
} from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { ReadingChecklist } from '@/shared/components/insights/ReadingChecklist';
import { CalculatorSection } from '@/shared/components/page/CalculatorSection';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';

import { InputGuardrailIssue } from '../lib/input-guardrails';

import { BondChart } from './BondChart';
import { BondResultsSummary } from './BondResultsSummary';
import { BondTimeline } from './BondTimeline';

interface BondCalculatorResultsPanelProps {
  results: CalculationResult | null;
  inputs: BondInputs;
  envelope: SingleBondCalculationEnvelope | null;
  isCalculating: boolean;
  isDirty: boolean;
  blockingGuardrails: InputGuardrailIssue[];
  canManageWorkspace: boolean;
  onSaveScenario: () => void;
  onAddToNotebook: () => void | Promise<void>;
  onExportPDF: () => void | Promise<void>;
}

interface BondCalculatorDetailsPanelProps {
  results: CalculationResult | null;
  inputs: BondInputs;
  envelope: SingleBondCalculationEnvelope | null;
  isCalculating: boolean;
  readingGuide: string[];
}

export function BondCalculatorResultsPanel({
  results,
  inputs,
  envelope,
  isCalculating,
  isDirty,
  blockingGuardrails,
  canManageWorkspace,
  onSaveScenario,
  onAddToNotebook,
  onExportPDF,
}: BondCalculatorResultsPanelProps) {
  const { t } = useAppI18n();

  return (
    <div id="bond-report-content" className="min-w-0" aria-live="polite">
      {!results && !isCalculating ? (
        <ScenarioReadyPanel
          badge={t('bonds.simulation.ready')}
          title={t('bonds.simulation.ready_title')}
          description={t('bonds.simulation.ready_desc')}
          steps={[
            {
              id: 'primary',
              title: t('bonds.simulation.ready_steps.primary.title'),
              description: t('bonds.simulation.ready_steps.primary.desc'),
            },
            {
              id: 'timing',
              title: t('bonds.simulation.ready_steps.timing.title'),
              description: t('bonds.simulation.ready_steps.timing.desc'),
            },
            {
              id: 'advanced',
              title: t('bonds.simulation.ready_steps.advanced.title'),
              description: t('bonds.simulation.ready_steps.advanced.desc'),
            },
          ]}
          footerText={
            blockingGuardrails.length > 0
              ? t('bonds.simulation.fix_blocking')
              : t('bonds.simulation.results_stable')
          }
        />
      ) : null}

      {isCalculating && !results ? (
        <div
          className="ui-control-stack"
          role="status"
          aria-live="polite"
          aria-label={t('common.loading')}
        >
          <div className="ui-surface-flush space-y-4 p-5 md:p-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-2/3 max-w-sm" />
            <Skeleton className="h-5 w-full max-w-xl" />
          </div>
          <div className="ui-metric-grid grid-cols-1 md:grid-cols-3">
            <Skeleton className="h-28 w-full rounded-md" />
            <Skeleton className="h-28 w-full rounded-md" />
            <Skeleton className="h-28 w-full rounded-md" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-md md:h-[420px]" />
        </div>
      ) : null}

      {results ? (
        <div
          className={cn(
            'ui-compact-flow transition-opacity duration-200',
            isCalculating && 'pointer-events-none opacity-50',
          )}
        >
          {isDirty ? (
            <div className="ui-status-note ui-status-note-warning text-foreground" role="status">
              <span className="ui-body text-foreground">{t('bonds.simulation.stale_results')}</span>
              <span className="ui-meta font-semibold text-foreground">
                {t('common.recalculate')}.
              </span>
            </div>
          ) : null}

          <BondResultsSummary
            results={results}
            inputs={inputs}
            onSaveScenario={onSaveScenario}
            onAddToNotebook={onAddToNotebook}
            onExportPDF={onExportPDF}
            canManageWorkspace={canManageWorkspace}
            dataQualityFlags={envelope?.dataQualityFlags}
          />
        </div>
      ) : null}
    </div>
  );
}

export function BondCalculatorDetailsPanel({
  results,
  inputs,
  envelope,
  isCalculating,
  readingGuide,
}: BondCalculatorDetailsPanelProps) {
  const { t } = useAppI18n();
  const [displayStep, setDisplayStep] = React.useState<ChartStep>('yearly');

  if (!results) {
    return null;
  }

  return (
    <div
      className={cn(
        'ui-compact-flow transition-opacity duration-200',
        isCalculating && 'pointer-events-none opacity-50',
      )}
    >
      <CalculatorSection
        title={t('bonds.evolution')}
        description={t('bonds.simulation.chart_section_desc')}
        className="ui-section-divider"
      >
        <ChartSupportNote
          title={t('bonds.simulation.chart_help_title')}
          description={t('bonds.simulation.chart_help_desc')}
        />
        <BondChart
          results={results}
          initialInvestment={results.initialInvestment}
          inputs={inputs}
          showRealValue={inputs.showRealValue}
          displayStep={displayStep}
          onDisplayStepChange={setDisplayStep}
        />
      </CalculatorSection>

      <SecondaryInsightAccordion
        title={t('bonds.simulation.how_to_read_title')}
        description={t('bonds.simulation.how_to_read_desc')}
        badge={t('bonds.simulation.secondary_badge')}
      >
        <ReadingChecklist items={readingGuide} />
      </SecondaryInsightAccordion>

      <CalculatorSection
        title={t('bonds.timeline')}
        description={t('bonds.simulation.timeline_section_desc')}
        className="ui-section-divider"
      >
        <BondTimeline results={results} chartStep={displayStep} />
      </CalculatorSection>

      <SecondaryInsightAccordion
        title={t('bonds.simulation.calculation_context')}
        description={t('bonds.simulation.meta_desc')}
        badge={t('bonds.simulation.meta_badge')}
      >
        <CalculationMetaPanel
          warnings={envelope?.warnings}
          assumptions={envelope?.assumptions}
          calculationNotes={envelope?.calculationNotes}
          dataQualityFlags={envelope?.dataQualityFlags}
          dataFreshness={envelope?.dataFreshness}
        />
      </SecondaryInsightAccordion>
    </div>
  );
}
