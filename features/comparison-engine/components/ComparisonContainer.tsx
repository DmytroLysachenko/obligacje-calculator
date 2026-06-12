'use client';
import React, { useMemo, useState } from 'react';
import { Loader2, RotateCcw, Scale } from 'lucide-react';
import { ChartStep } from '@/features/bond-core/types';
import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { cn } from '@/lib/utils';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { Skeleton } from '@/components/ui/skeleton';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { Notice } from '@/shared/components/feedback/Notice';
import { getBondColor } from '@/shared/lib/charts/get-bond-color';
import { useComparison } from '../hooks/useComparison';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonVerdict } from './ComparisonVerdict';
import { ComparisonResultsPanel } from './ComparisonResultsPanel';
import { ComparisonSharedBaseCard } from './ComparisonSharedBaseCard';
import { ScenarioOverrideCard } from './ScenarioOverrideCard';
import {
  buildComparisonChartData,
  getComparisonAssumptionsBondType,
  usesMixedTimelineCadence,
} from '../lib/comparison-display';
export const ComparisonContainer: React.FC = () => {
    const { sharedConfig, scenarioA, scenarioB, inputsA, inputsB, committedInputsA, committedInputsB, resultsA, resultsB, envelopeA, envelopeB, warningsA, warningsB, isCalculating, calculate, updateSharedConfig, updateScenarioA, updateScenarioB, setBondTypeA, setBondTypeB, setScenarioACustomHorizonEnabled, setScenarioBCustomHorizonEnabled, setScenarioACustomHorizonMonths, setScenarioBCustomHorizonMonths, isDirty, isPersistenceReady, definitions, } = useComparison();
    const { t, locale: language } = useAppI18n();
    const [chartStep, setChartStep] = useState<ChartStep>('yearly');
    const hasMounted = useHasMounted();
    const currencyFormatter = useCurrencyFormatter(language, {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    });
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && (isDirty || !resultsA)) {
            calculate();
        }
    };
    const formatCurrency = React.useMemo(() => (value: number) => {
        if (!hasMounted)
            return '---';
        return currencyFormatter.format(value);
    }, [currencyFormatter, hasMounted]);
    const resultInputsA = committedInputsA ?? inputsA;
    const resultInputsB = committedInputsB ?? inputsB;
    const chartData = useMemo(
      () =>
        resultsA && resultsB
          ? buildComparisonChartData({
              purchaseDate: resultInputsA.purchaseDate,
              withdrawalDateA: resultInputsA.withdrawalDate,
              withdrawalDateB: resultInputsB.withdrawalDate,
              resultsA,
              resultsB,
              language,
              t,
              chartStep,
            })
          : [],
      [chartStep, language, resultInputsA.purchaseDate, resultInputsA.withdrawalDate, resultInputsB.withdrawalDate, resultsA, resultsB, t],
    );
    const hasMixedTimelineCadence = useMemo(
      () => usesMixedTimelineCadence(resultInputsA, resultInputsB),
      [resultInputsA, resultInputsB],
    );
    const assumptionsBondType = useMemo(
      () => getComparisonAssumptionsBondType(scenarioA.bondType, scenarioB.bondType),
      [scenarioA.bondType, scenarioB.bondType],
    );
    const durationMismatch = definitions[scenarioA.bondType].duration !== definitions[scenarioB.bondType].duration;
    const durationMismatchText = durationMismatch ? t('comparison.auto_rollover_notice') : null;
    const scenarioAColor = getBondColor(scenarioA.bondType);
    const scenarioBColor = getBondColor(scenarioB.bondType);
    return (<CalculatorPageShell title={t('nav.comparison')} description={t('comparison.desc_independent')} icon={<Scale className="h-8 w-8"/>} isCalculating={isCalculating} isDirty={isDirty} hasResults={isPersistenceReady && !!resultsA} onKeyDown={handleKeyDown}>
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-8 2xl:grid-cols-[420px_minmax(0,1fr)] 2xl:items-start 2xl:gap-10">
            <ComparisonSharedBaseCard
              sharedConfig={sharedConfig}
              assumptionsBondType={assumptionsBondType}
              onUpdateSharedConfig={updateSharedConfig as (key: keyof typeof sharedConfig | string, value: unknown) => void}
            />

          <div className="min-w-0 space-y-8">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ScenarioOverrideCard title={t('comparison.scenario_a')} colorClass="scenario-a" bondType={scenarioA.bondType} onBondTypeChange={setBondTypeA} taxStrategy={scenarioA.taxStrategy} onTaxStrategyChange={(value) => updateScenarioA('taxStrategy', value)} customHorizonEnabled={scenarioA.investmentHorizonMonths !== undefined} onCustomHorizonEnabledChange={setScenarioACustomHorizonEnabled} customHorizonMonths={scenarioA.investmentHorizonMonths} onCustomHorizonMonthsChange={setScenarioACustomHorizonMonths}/>
              <ScenarioOverrideCard title={t('comparison.scenario_b')} colorClass="scenario-b" bondType={scenarioB.bondType} onBondTypeChange={setBondTypeB} taxStrategy={scenarioB.taxStrategy} onTaxStrategyChange={(value) => updateScenarioB('taxStrategy', value)} customHorizonEnabled={scenarioB.investmentHorizonMonths !== undefined} onCustomHorizonEnabledChange={setScenarioBCustomHorizonEnabled} customHorizonMonths={scenarioB.investmentHorizonMonths} onCustomHorizonMonthsChange={setScenarioBCustomHorizonMonths}/>
            </div>

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
                onClick={() => calculate()}
                disabled={isCalculating}
              >
                {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {resultsA && resultsB ? t('common.recalculate') : t('common.calculate')}
              </Button>
            </section>

            {!resultsA && !isCalculating ? (<ScenarioReadyPanel badge={t('comparison.ready_to_compare')} title={t('comparison.ready_title')} description={t('comparison.ready_desc')} steps={[
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
                ]} footerText={t('comparison.ready_footer')}/>) : null}

            {isCalculating && !resultsA ? (<div className="space-y-6">
                <Skeleton className="h-[300px] w-full rounded-lg md:h-[360px]"/>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Skeleton className="h-[180px] rounded-lg md:h-[220px]"/>
                  <Skeleton className="h-[180px] rounded-lg md:h-[220px]"/>
                </div>
              </div>) : null}

          </div>
        </div>

        {resultsA && resultsB ? (<div className={cn('space-y-8', isCalculating && 'opacity-60')}>
                {isDirty ? (
                  <Notice tone="warning" compact>
                    {t('comparison.stale_results')}
                  </Notice>
                ) : null}

                {hasMounted ? (
                  <ComparisonResultsPanel
                    chartData={chartData}
                    usesMixedTimelineCadence={hasMixedTimelineCadence}
                    resultsA={resultsA}
                    resultsB={resultsB}
                    inputsA={resultInputsA}
                    inputsB={resultInputsB}
                    formatCurrency={formatCurrency}
                    language={language}
                    chartStep={chartStep}
                    onChartStepChange={setChartStep}
                    scenarioAColor={scenarioAColor}
                    scenarioBColor={scenarioBColor}
                  />
                ) : null}

                <ComparisonVerdict resultsA={resultsA} resultsB={resultsB} inputsA={resultInputsA} inputsB={resultInputsB} expectedInflation={resultInputsA.expectedInflation} taxStrategy={resultInputsA.taxStrategy} formatCurrency={formatCurrency}/>

                <ComparisonTable resultsA={resultsA} resultsB={resultsB} bondTypeA={resultInputsA.bondType} bondTypeB={resultInputsB.bondType} formatCurrency={formatCurrency}/>

                <SecondaryInsightAccordion title={t('comparison.assumptions_meta')} description={t('comparison.assumptions_meta_desc')} badge={t('comparison.helper_secondary')}>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {[
                    {
                        label: t('comparison.scenario_a'),
                        envelope: envelopeA,
                        warnings: warningsA,
                    },
                    {
                        label: t('comparison.scenario_b'),
                        envelope: envelopeB,
                        warnings: warningsB,
                    },
                ].map((entry) => (<section key={entry.label} className="space-y-4 border-t border-border py-4">
                          <h3 className="ui-card-title">
                            {entry.label} {t('comparison.notes_suffix')}
                          </h3>
                          <CalculationMetaPanel warnings={entry.warnings} assumptions={entry.envelope?.assumptions} calculationNotes={entry.envelope?.calculationNotes} dataQualityFlags={entry.envelope?.dataQualityFlags} dataFreshness={entry.envelope?.dataFreshness} compact/>
                      </section>))}
                  </div>
                </SecondaryInsightAccordion>
              </div>) : null}
      </div>
      <RecalculateButton isDirty={isDirty} hasResults={!!resultsA && !!resultsB} loading={isCalculating} onClick={() => calculate()}/>
    </CalculatorPageShell>);
};



