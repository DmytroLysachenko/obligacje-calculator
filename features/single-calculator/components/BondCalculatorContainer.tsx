'use client';

import React, { useMemo, useState } from 'react';
import { Link2, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { CalculatorSection } from '@/shared/components/page/CalculatorSection';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { pageLayout } from '@/shared/components/page/layout-system';
import { ReadingChecklist } from '@/shared/components/insights/ReadingChecklist';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { unwrapApiData } from '@/shared/lib/api-response';
import { generateSingleBondReportPdf } from '@/shared/lib/pdf-utils';
import { buildSharedSingleScenarioPayload } from '@/shared/lib/single-scenario-share';
import {
  getStoredCurrentPortfolioId,
  setStoredCurrentPortfolioId,
} from '@/shared/lib/workspace/current-portfolio';
import { getWorkspaceSaveTarget } from '@/shared/lib/workspace/portfolio-selection';
import { useBondCalculator } from '../hooks/useBondCalculator';
import { applyGuardrailFix, getInputGuardrails, InputGuardrailIssue } from '../lib/input-guardrails';
import { createSavedScenario, saveScenarioRecord } from '../lib/scenario-storage';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { BondChart } from './BondChart';
import { BondInputsForm } from './BondInputsForm';
import { BondResultsSummary } from './BondResultsSummary';
import { BondTimeline } from './BondTimeline';

interface BondCalculatorContainerProps {
  initialInputs?: import('@/features/bond-core/types').BondInputs;
  sharedScenarioTitle?: string;
}

export const BondCalculatorContainer: React.FC<BondCalculatorContainerProps> = ({
  initialInputs,
  sharedScenarioTitle,
}) => {
  const {
    inputs,
    results,
    envelope,
    isCalculating,
    isError,
    calculate,
    updateInput,
    replaceInputs,
    setBondType,
    isDirty,
    availableSeries,
    selectedSeriesId,
    lastCommittedInputs,
    isPersistenceReady,
  } = useBondCalculator(initialInputs);
  const { t, locale: language } = useAppI18n();
  const { canManageWorkspace } = usePortfolioAccess();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error'>('success');
  const translate = useMemo(
    () => (key: string, params?: Record<string, string | number>) => t(key, params),
    [t],
  );
  const guardrails = useMemo(() => getInputGuardrails(inputs, translate), [inputs, translate]);
  const blockingGuardrails = useMemo(
    () => guardrails.filter((issue) => issue.severity === 'blocking'),
    [guardrails],
  );

  const readingGuide = [
    t('bonds.simulation.reading_guide.summary_first'),
    t('bonds.simulation.reading_guide.chart_then_timeline'),
    t('bonds.simulation.reading_guide.stale_until_recalculated'),
  ];

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (isDirty || !results)) {
      calculate();
    }
  };

  const handleAddToNotebook = async () => {
    if (!results) return;
    if (!canManageWorkspace) {
      return;
    }

    try {
      const portfolioResponse = await fetch('/api/portfolio');
      const portfolioData = await portfolioResponse.json();
      const portfolioList = unwrapApiData<Array<{ id: string; name: string }>>(portfolioData) ?? [];
      const storedPortfolioId = getStoredCurrentPortfolioId();
      const saveTarget = getWorkspaceSaveTarget(storedPortfolioId, portfolioList);
      let portfolioId: string | undefined = saveTarget.portfolioId ?? undefined;
      let portfolioName: string | null = saveTarget.portfolioName;

      if (saveTarget.needsPortfolioCreation) {
        const createResponse = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: t('notebook.my_first_portfolio'),
            description: '',
          }),
        });
        const createData = await createResponse.json();
        const createdPortfolio = unwrapApiData<{ id: string; name: string }>(createData);
        portfolioId = createdPortfolio?.id;
        portfolioName = createdPortfolio?.name ?? t('notebook.my_first_portfolio');
      }

      if (!portfolioId) {
        throw new Error('Could not resolve a portfolio id for notebook save.');
      }
      setStoredCurrentPortfolioId(portfolioId);

      await fetch('/api/portfolio/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId,
          bondType: inputs.bondType,
          selectedSeriesId: selectedSeriesId && selectedSeriesId !== 'current' ? selectedSeriesId : null,
          purchaseDate: inputs.purchaseDate,
          amount: Math.floor(inputs.initialInvestment / 100),
          isRebought: inputs.isRebought,
        }),
      });
      setStatusTone('success');
      setStatusMessage(
        portfolioName
          ? t('notebook.current_lot_added_to_active', { name: portfolioName })
          : t('notebook.current_lot_added'),
      );
    } catch (error) {
      console.error(error);
      setStatusTone('error');
      setStatusMessage(t('notebook.create_error'));
    }
  };

  const handleSaveScenario = () => {
    const label = `Single ${inputs.bondType} ${
      inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12)
    }M`;

    saveScenarioRecord(
      createSavedScenario(inputs, {
        name: label,
        description: `Net payout ${
          results ? results.netPayoutValue.toFixed(2) : 'pending'
        } PLN`,
      }),
    );
  };

  const handleExportPDF = async () => {
    if (!results) {
      return;
    }

    await generateSingleBondReportPdf(
      results,
      inputs,
      language,
      `bond_report_${inputs.bondType}_${new Date().toISOString().split('T')[0]}.pdf`,
    );
  };

  const handleShareScenario = async () => {
    if (!results || !lastCommittedInputs) {
      return;
    }

    const payload = buildSharedSingleScenarioPayload(
      lastCommittedInputs,
      `Committed single-bond scenario for ${lastCommittedInputs.bondType}.`,
    );

    const response = await fetch('/api/scenarios/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const shareUrl = data?.data?.shareUrl as string | undefined;

    if (!response.ok || !shareUrl) {
      throw new Error(data?.error?.message || 'Failed to create share link.');
    }

    return shareUrl;
  };

  const handleApplyGuardrailFix = (issue: InputGuardrailIssue) => {
    replaceInputs(applyGuardrailFix(issue, inputs));
  };

  return (
    <CalculatorPageShell
      title={t('nav.single_calculator')}
      description={t('bonds.single_calculator')}
      icon={<Target className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      isError={isError}
      hasResults={isPersistenceReady && !!results}
      onShare={handleShareScenario}
      showImplicitShare={false}
      onKeyDown={handleKeyDown}
    >
      <div className={pageLayout.compactFlow}>
        {sharedScenarioTitle ? (
          <div className="ui-inline-notice">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              <Link2 className="h-4 w-4" />
              {t('bonds.shared_scenario_badge')}
            </div>
            <p className="mt-2 leading-7">
              {sharedScenarioTitle}
              {' - '}
              {t('bonds.shared_scenario_snapshot')}
            </p>
          </div>
        ) : null}

        <div className={pageLayout.calculatorGrid}>
          <aside className={pageLayout.stickyScenario}>
            <BondInputsForm
              inputs={inputs}
              onUpdate={updateInput}
              onBondTypeChange={setBondType}
              availableSeries={availableSeries}
              selectedSeriesId={selectedSeriesId}
              guardrails={guardrails}
              onApplyGuardrailFix={handleApplyGuardrailFix}
            />
          </aside>

          <div className={pageLayout.sectionFlow} id="bond-report-content">
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
              <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-lg md:h-32" />
                <Skeleton className="h-52 w-full rounded-lg md:h-60" />
                <Skeleton className="h-[320px] w-full rounded-lg md:h-[420px]" />
              </div>
            ) : null}

            {results ? (
              <div
                className={cn(
                  'space-y-8 transition-opacity duration-300',
                  isCalculating && 'pointer-events-none opacity-50',
                )}
              >
                {isDirty ? (
                  <div className="ui-inline-notice border-l-2 border-warning text-foreground">
                    {t('bonds.simulation.stale_results')}{' '}
                    <span className="font-semibold">{t('common.recalculate')}</span>.
                  </div>
                ) : null}

                <BondResultsSummary
                  results={results}
                  inputs={inputs}
                  onSaveScenario={handleSaveScenario}
                  onAddToNotebook={handleAddToNotebook}
                  onExportPDF={handleExportPDF}
                  canManageWorkspace={canManageWorkspace}
                />
              </div>
            ) : null}
          </div>
        </div>

        {results ? (
          <div
            className={cn(
              'space-y-10 transition-opacity duration-300',
              isCalculating && 'pointer-events-none opacity-50',
            )}
          >
            <SecondaryInsightAccordion
              title={t('bonds.simulation.how_to_read_title')}
              description={t('bonds.simulation.how_to_read_desc')}
              badge={t('bonds.simulation.secondary_badge')}
            >
              <ReadingChecklist items={readingGuide} />
            </SecondaryInsightAccordion>

            <CalculatorSection
              title={t('bonds.evolution')}
              description={t('bonds.simulation.chart_section_desc')}
            >
              <ChartSupportNote
                title={t('bonds.simulation.chart_help_title')}
                description={t('bonds.simulation.chart_help_desc')}
              />
              <BondChart
                results={results}
                initialInvestment={results.initialInvestment}
                chartStep={inputs.chartStep}
                showRealValue={inputs.showRealValue}
              />
            </CalculatorSection>

            <CalculatorSection
              title={t('bonds.timeline')}
              description={t('bonds.simulation.timeline_section_desc')}
            >
              <BondTimeline results={results} chartStep={inputs.chartStep} />
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
        ) : null}
      </div>

      <RecalculateButton
        isDirty={isDirty}
        hasResults={!!results}
        loading={isCalculating}
        disabled={blockingGuardrails.length > 0}
        onClick={() => calculate()}
      />

      <AppToast
        message={statusMessage}
        tone={statusTone}
        onDismiss={() => setStatusMessage(null)}
      />
    </CalculatorPageShell>
  );
};




