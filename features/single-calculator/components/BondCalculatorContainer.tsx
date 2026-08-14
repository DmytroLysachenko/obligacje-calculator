'use client';

import { Target } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useAppI18n } from '@/i18n/client';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { CalculatorWorkspace } from '@/shared/components/page/CalculatorWorkspace';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';

import { useBondCalculator } from '../hooks/useBondCalculator';
import {
  applyGuardrailFix,
  getInputGuardrails,
  InputGuardrailIssue,
} from '../lib/input-guardrails';
import { createSingleCalculatorActions } from '../lib/single-calculator-actions';
import { buildSingleCalculatorReadingGuide } from '../lib/single-calculator-container-model';
import { parseBondType } from '../lib/single-calculator-state';

import { BondCalculatorDetailsPanel, BondCalculatorResultsPanel } from './BondCalculatorPanels';
import { BondInputsForm } from './BondInputsForm';
import { ScenarioDraftStatus } from './ScenarioDraftStatus';
import { SharedScenarioNotice } from './SharedScenarioNotice';

interface BondCalculatorContainerProps {
  initialInputs?: import('@/features/bond-core/types').BondInputs;
  sharedScenarioTitle?: string;
}

const SINGLE_CALCULATOR_FORM_ID = 'single-calculator-inputs';

export const BondCalculatorContainer: React.FC<BondCalculatorContainerProps> = ({
  initialInputs,
  sharedScenarioTitle,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bondFromUrl = parseBondType(searchParams.get('bond'));
  const shouldSyncBondToUrl = useRef(Boolean(bondFromUrl));
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
  } = useBondCalculator(initialInputs, bondFromUrl);
  const { t, locale: language } = useAppI18n();
  const { canManageWorkspace } = usePortfolioAccess();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error'>('success');
  const guardrailSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      initialInputs ||
      !isPersistenceReady ||
      !shouldSyncBondToUrl.current ||
      typeof window === 'undefined' ||
      searchParams.get('bond') === inputs.bondType
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('bond', inputs.bondType);
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  }, [initialInputs, inputs.bondType, isPersistenceReady, pathname, searchParams]);

  const handleBondTypeChange = (type: import('@/features/bond-core/types').BondType) => {
    shouldSyncBondToUrl.current = true;
    setBondType(type);
  };
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

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blockingGuardrails.length > 0) {
      guardrailSummaryRef.current?.focus();
      return;
    }
    if (!isCalculating) {
      calculate();
    }
  };

  const actions = useMemo(
    () =>
      createSingleCalculatorActions({
        inputs,
        results,
        lastCommittedInputs,
        selectedSeriesId,
        language,
        canManageWorkspace,
        t,
        setStatus: (tone, message) => {
          setStatusTone(tone);
          setStatusMessage(message);
        },
      }),
    [canManageWorkspace, inputs, language, lastCommittedInputs, results, selectedSeriesId, t],
  );

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
      onShare={actions.shareScenario}
      showImplicitShare={false}
    >
      <div className="ui-page-flow">
        {sharedScenarioTitle ? (
          <SharedScenarioNotice
            title={sharedScenarioTitle}
            badge={t('bonds.shared_scenario_badge')}
            snapshotLabel={t('bonds.shared_scenario_snapshot')}
          />
        ) : null}

        <ScenarioDraftStatus inputs={inputs} isDirty={isDirty} onRestore={replaceInputs} />

        <CalculatorWorkspace
          className="gap-8 xl:gap-10"
          controlsClassName="xl:self-start"
          resultsClassName="min-w-0"
          detailsClassName="min-w-0"
          hasResults={isPersistenceReady && !!results}
          isDirty={isDirty}
          scenarioSummary={[
            { label: t('bonds.bond.type'), value: inputs.bondType },
            {
              label: t('bonds.bond_quantity'),
              value: `${Math.floor(inputs.initialInvestment / 100)} ${t('bonds.units')}`,
            },
            {
              label: t('bonds.investment_horizon'),
              value: `${inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12)} ${t('common.month_compact')}`,
            },
          ]}
          controls={
            <BondInputsForm
              formId={SINGLE_CALCULATOR_FORM_ID}
              onSubmit={handleFormSubmit}
              inputs={inputs}
              onUpdate={updateInput}
              onBondTypeChange={handleBondTypeChange}
              availableSeries={availableSeries}
              selectedSeriesId={selectedSeriesId}
              guardrails={guardrails}
              guardrailSummaryRef={guardrailSummaryRef}
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
              onSaveScenario={actions.saveScenario}
              onAddToNotebook={actions.addToNotebook}
              onExportPDF={actions.exportPdf}
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
        formId={SINGLE_CALCULATOR_FORM_ID}
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
