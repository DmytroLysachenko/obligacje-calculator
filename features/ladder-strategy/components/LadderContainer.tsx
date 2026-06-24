'use client';
import React from 'react';
import { ListTree, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { CalculatorWorkspace } from '@/shared/components/page/CalculatorWorkspace';
import { ReadingChecklist } from '@/shared/components/insights/ReadingChecklist';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { RegularInvestmentInputsForm } from '../../regular-investment/components/RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from '../../regular-investment/components/RegularInvestmentResultsSummary';
import { useLadder } from '../hooks/useLadder';
import { LadderTimeline } from './LadderTimeline';
const LadderEmptyState = () => {
  const { t } = useAppI18n();
  return (
    <section className="space-y-5 border-t border-border py-6">
      <div className="space-y-3">
        <div className="surface-chip">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          {t('bonds.simulation.ready')}
        </div>
        <h3 className="ui-section-title">{t('ladder_page.empty_state_title')}</h3>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {t('ladder_page.empty_state_description')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border-t border-border py-5">
          <p className="ui-card-title">{t('ladder_page.empty_cards.plan_title')}</p>
          <p className="ui-body mt-2 text-muted-foreground">
            {t('ladder_page.empty_cards.plan_description')}
          </p>
        </div>
        <div className="border-t border-border py-5">
          <p className="ui-card-title">{t('ladder_page.empty_cards.committed_title')}</p>
          <p className="ui-body mt-2 text-muted-foreground">
            {t('ladder_page.empty_cards.committed_description')}
          </p>
        </div>
        <div className="border-t border-border py-5">
          <p className="ui-card-title">{t('ladder_page.empty_cards.timing_title')}</p>
          <p className="ui-body mt-2 text-muted-foreground">
            {t('ladder_page.empty_cards.timing_description')}
          </p>
        </div>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">
        {t('ladder_page.empty_state_footer')}
      </p>
    </section>
  );
};
const LadderLoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-lg" />
    <Skeleton className="h-48 w-full rounded-lg" />
    <Skeleton className="h-[460px] w-full rounded-lg" />
  </div>
);
export const LadderContainer: React.FC = () => {
  const {
    inputs,
    results,
    updateInput,
    setBondType,
    isDirty,
    isCalculating,
    calculate,
    envelope,
    isPersistenceReady,
  } = useLadder();
  const { t } = useAppI18n();
  const readingGuide = [
    t('ladder_page.reading_guide.check_peak_month'),
    t('ladder_page.reading_guide.check_clustering'),
  ];
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };
  return (
    <CalculatorPageShell
      title={t('nav.ladder')}
      description={t('ladder.what_is_desc')}
      icon={<ListTree className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={isPersistenceReady && !!results}
      onKeyDown={handleKeyDown}
    >
      <CalculatorWorkspace
        controls={
          <RegularInvestmentInputsForm
            inputs={inputs}
            onUpdate={updateInput as (key: string, value: unknown) => void}
            onBondTypeChange={setBondType}
          />
        }
        results={
          <>
            {!results && !isCalculating ? <LadderEmptyState /> : null}
            {isCalculating && !results ? <LadderLoadingState /> : null}

            {results ? (
              <div
                className={cn(
                  'space-y-8 transition-opacity duration-200',
                  isCalculating && 'pointer-events-none opacity-50',
                )}
              >
                {isDirty ? (
                  <div className="ui-inline-notice border-warning/30 bg-warning/5 text-foreground">
                    {t('ladder_page.stale_results')}
                  </div>
                ) : null}

                <RegularInvestmentResultsSummary
                  results={results}
                  dataQualityFlags={envelope?.dataQualityFlags}
                />
              </div>
            ) : null}
          </>
        }
        details={
          results ? (
            <div
              className={cn(
                'space-y-10 transition-opacity duration-200',
                isCalculating && 'pointer-events-none opacity-50',
              )}
            >
              <SecondaryInsightAccordion
                title={t('ladder_page.how_to_read_title')}
                description={t('ladder_page.how_to_read_description')}
                badge={t('ladder_page.how_to_read_badge')}
              >
                <ReadingChecklist items={readingGuide} />
              </SecondaryInsightAccordion>

              <LadderTimeline results={results} />

              <SecondaryInsightAccordion
                title={t('bonds.simulation.calculation_context')}
                description={t('ladder_page.calculation_context_description')}
                badge={t('ladder_page.calculation_context_badge')}
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
          ) : null
        }
      />

      <RecalculateButton
        isDirty={isDirty}
        hasResults={!!results}
        loading={isCalculating}
        onClick={() => calculate()}
      />
    </CalculatorPageShell>
  );
};
