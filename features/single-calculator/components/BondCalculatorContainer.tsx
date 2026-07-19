'use client';

import { Target } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { useAppI18n } from '@/i18n/client';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { CalculatorWorkspace } from '@/shared/components/page/CalculatorWorkspace';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { logClientError } from '@/shared/lib/client-logger';
import { generateSingleBondReportPdf } from '@/shared/lib/pdf-utils';
import { portfolioClient } from '@/shared/lib/portfolio-client';
import { scenarioShareClient } from '@/shared/lib/scenario-share-client';
import { buildSharedSingleScenarioPayload } from '@/shared/lib/single-scenario-share';
import {
  getStoredCurrentPortfolioId,
  setStoredCurrentPortfolioId,
} from '@/shared/lib/workspace/current-portfolio';
import { getWorkspaceSaveTarget } from '@/shared/lib/workspace/portfolio-selection';

import { useBondCalculator } from '../hooks/useBondCalculator';
import {
  applyGuardrailFix,
  getInputGuardrails,
  InputGuardrailIssue,
} from '../lib/input-guardrails';
import { createSavedScenario, saveScenarioRecord } from '../lib/scenario-storage';
import {
  buildSavedSingleScenarioMeta,
  buildSingleCalculatorReadingGuide,
  buildSingleReportFilename,
} from '../lib/single-calculator-container-model';

import { BondCalculatorDetailsPanel, BondCalculatorResultsPanel } from './BondCalculatorPanels';
import { BondInputsForm } from './BondInputsForm';
import { SharedScenarioNotice } from './SharedScenarioNotice';

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

  const readingGuide = useMemo(() => buildSingleCalculatorReadingGuide(t), [t]);

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
      const portfolioList = await portfolioClient.listPortfolios();
      const storedPortfolioId = getStoredCurrentPortfolioId();
      const saveTarget = getWorkspaceSaveTarget(storedPortfolioId, portfolioList);
      let portfolioId: string | undefined = saveTarget.portfolioId ?? undefined;
      let portfolioName: string | null = saveTarget.portfolioName;

      if (saveTarget.needsPortfolioCreation) {
        const createdPortfolio = await portfolioClient.createPortfolio({
          name: t('notebook.my_first_portfolio'),
          description: '',
        });
        portfolioId = createdPortfolio?.id;
        portfolioName = createdPortfolio?.name ?? t('notebook.my_first_portfolio');
      }

      if (!portfolioId) {
        throw new Error('Could not resolve a portfolio id for notebook save.');
      }
      setStoredCurrentPortfolioId(portfolioId);

      await portfolioClient.createLot({
        portfolioId,
        bondType: inputs.bondType,
        selectedSeriesId:
          selectedSeriesId && selectedSeriesId !== 'current' ? selectedSeriesId : null,
        purchaseDate: inputs.purchaseDate,
        amount: Math.floor(inputs.initialInvestment / 100),
        isRebought: inputs.isRebought,
      });
      setStatusTone('success');
      setStatusMessage(
        portfolioName
          ? t('notebook.current_lot_added_to_active', { name: portfolioName })
          : t('notebook.current_lot_added'),
      );
    } catch (error) {
      logClientError('Notebook lot save failed:', error);
      setStatusTone('error');
      setStatusMessage(t('notebook.create_error'));
    }
  };

  const handleSaveScenario = () => {
    const scenarioMeta = buildSavedSingleScenarioMeta(inputs, results);

    saveScenarioRecord(
      createSavedScenario(inputs, {
        name: scenarioMeta.name,
        description: scenarioMeta.description,
      }),
    );
  };

  const handleExportPDF = async () => {
    if (!results) {
      return;
    }

    await generateSingleBondReportPdf(results, inputs, language, buildSingleReportFilename(inputs));
  };

  const handleShareScenario = async () => {
    if (!results || !lastCommittedInputs) {
      return;
    }

    const payload = buildSharedSingleScenarioPayload(
      lastCommittedInputs,
      `Committed single-bond scenario for ${lastCommittedInputs.bondType}.`,
    );

    const shareSnapshot = await scenarioShareClient.createSingleScenario(payload);
    return shareSnapshot.shareUrl;
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
      <div className="ui-page-flow">
        {sharedScenarioTitle ? (
          <SharedScenarioNotice
            title={sharedScenarioTitle}
            badge={t('bonds.shared_scenario_badge')}
            snapshotLabel={t('bonds.shared_scenario_snapshot')}
          />
        ) : null}

        <CalculatorWorkspace
          className="gap-8 xl:gap-10"
          controlsClassName="xl:self-start"
          resultsClassName="min-w-0"
          detailsClassName="min-w-0"
          controls={
            <BondInputsForm
              inputs={inputs}
              onUpdate={updateInput}
              onBondTypeChange={setBondType}
              availableSeries={availableSeries}
              selectedSeriesId={selectedSeriesId}
              guardrails={guardrails}
              onApplyGuardrailFix={handleApplyGuardrailFix}
            />
          }
          results={
            <BondCalculatorResultsPanel
              results={results}
              inputs={inputs}
              envelope={envelope}
              isCalculating={isCalculating}
              isDirty={isDirty}
              blockingGuardrails={blockingGuardrails}
              canManageWorkspace={canManageWorkspace}
              onSaveScenario={handleSaveScenario}
              onAddToNotebook={handleAddToNotebook}
              onExportPDF={handleExportPDF}
            />
          }
          details={
            <BondCalculatorDetailsPanel
              results={results}
              inputs={inputs}
              envelope={envelope}
              isCalculating={isCalculating}
              readingGuide={readingGuide}
            />
          }
        />
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
