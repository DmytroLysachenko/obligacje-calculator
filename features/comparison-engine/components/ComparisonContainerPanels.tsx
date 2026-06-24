'use client';

import { Loader2, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BondInputs, SingleBondCalculationEnvelope } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { Notice } from '@/shared/components/feedback/Notice';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';

interface ComparisonFairnessPanelProps {
  durationMismatchText: string | null;
  hasResults: boolean;
  isCalculating: boolean;
  onCalculate: () => void;
}

interface ComparisonSetupStatePanelProps {
  hasResults: boolean;
  isCalculating: boolean;
}

interface ComparisonAssumptionsMetaPanelProps {
  envelopeA: SingleBondCalculationEnvelope | null;
  envelopeB: SingleBondCalculationEnvelope | null;
  warningsA: string[];
  warningsB: string[];
  inputsA: BondInputs;
  inputsB: BondInputs;
}

export function ComparisonFairnessPanel({
  durationMismatchText,
  hasResults,
  isCalculating,
  onCalculate,
}: ComparisonFairnessPanelProps) {
  const { t } = useAppI18n();

  return (
    <section className="space-y-3 border-y border-border py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="ui-card-title">{t('comparison.fairness.title')}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t('comparison.auto_rollover_fairness_desc')}
          </p>
        </div>
        <div className="ui-metadata text-muted-foreground">
          {t('comparison.fairness.mode_label')}: {t('comparison.auto_rollover_mode_label')}
        </div>
      </div>
      {durationMismatchText ? (
        <Notice tone="info" title={t('comparison.auto_rollover_notice_title')}>
          {durationMismatchText}
        </Notice>
      ) : null}
      <Button
        type="button"
        className="h-11 w-full gap-2 text-sm font-semibold md:w-auto"
        onClick={onCalculate}
        disabled={isCalculating}
      >
        {isCalculating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
        {hasResults ? t('common.recalculate') : t('common.calculate')}
      </Button>
    </section>
  );
}

export function ComparisonSetupStatePanel({
  hasResults,
  isCalculating,
}: ComparisonSetupStatePanelProps) {
  const { t } = useAppI18n();

  return (
    <>
      {!hasResults && !isCalculating ? (
        <ScenarioReadyPanel
          badge={t('comparison.ready_to_compare')}
          title={t('comparison.ready_title')}
          description={t('comparison.ready_desc')}
          steps={[
            {
              id: 'shared-base',
              title: t('comparison.ready_shared_base'),
              description: t('comparison.ready_shared_base_desc'),
            },
            {
              id: 'scenario-overrides',
              title: t('comparison.ready_overrides'),
              description: t('comparison.ready_overrides_desc'),
            },
            {
              id: 'committed-result',
              title: t('comparison.ready_committed'),
              description: t('comparison.ready_committed_desc'),
            },
          ]}
          footerText={t('comparison.ready_footer')}
        />
      ) : null}

      {isCalculating && !hasResults ? (
        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full rounded-lg md:h-[360px]" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="h-[180px] rounded-lg md:h-[220px]" />
            <Skeleton className="h-[180px] rounded-lg md:h-[220px]" />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ComparisonAssumptionsMetaPanel({
  envelopeA,
  envelopeB,
  warningsA,
  warningsB,
  inputsA,
  inputsB,
}: ComparisonAssumptionsMetaPanelProps) {
  const { t } = useAppI18n();
  const entries = [
    {
      label: `${t('comparison.scenario_a')} (${inputsA.bondType})`,
      envelope: envelopeA,
      warnings: warningsA,
    },
    {
      label: `${t('comparison.scenario_b')} (${inputsB.bondType})`,
      envelope: envelopeB,
      warnings: warningsB,
    },
  ];

  return (
    <SecondaryInsightAccordion
      title={t('comparison.assumptions_meta')}
      description={t('comparison.assumptions_meta_desc')}
      badge={t('comparison.helper_secondary')}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {entries.map((entry) => (
          <section key={entry.label} className="space-y-4 border-t border-border py-4">
            <h3 className="ui-card-title">
              {entry.label} {t('comparison.notes_suffix')}
            </h3>
            <CalculationMetaPanel
              warnings={entry.warnings}
              assumptions={entry.envelope?.assumptions}
              calculationNotes={entry.envelope?.calculationNotes}
              dataQualityFlags={entry.envelope?.dataQualityFlags}
              dataFreshness={entry.envelope?.dataFreshness}
              compact
            />
          </section>
        ))}
      </div>
    </SecondaryInsightAccordion>
  );
}
