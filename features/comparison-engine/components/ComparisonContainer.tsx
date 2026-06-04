'use client';
import React, { useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import { useAppI18n } from '@/i18n/client';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { cn } from '@/lib/utils';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { Skeleton } from '@/components/ui/skeleton';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { Notice } from '@/shared/components/feedback/Notice';
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
    const { sharedConfig, scenarioA, scenarioB, inputsA, inputsB, resultsA, resultsB, envelopeA, envelopeB, warningsA, warningsB, isCalculating, calculate, updateSharedConfig, updateScenarioA, updateScenarioB, setBondTypeA, setBondTypeB, setScenarioACustomHorizonEnabled, setScenarioBCustomHorizonEnabled, setScenarioACustomHorizonMonths, setScenarioBCustomHorizonMonths, isDirty, isPersistenceReady, definitions, } = useComparison();
    const { t, locale: language } = useAppI18n();
    const [showRealValue, setShowRealValue] = useState(false);
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
    const chartData = useMemo(
      () =>
        resultsA && resultsB
          ? buildComparisonChartData({
              purchaseDate: sharedConfig.purchaseDate,
              withdrawalDateA: inputsA.withdrawalDate,
              withdrawalDateB: inputsB.withdrawalDate,
              resultsA,
              resultsB,
              showRealValue,
              language,
              t,
            })
          : [],
      [inputsA.withdrawalDate, inputsB.withdrawalDate, language, resultsA, resultsB, sharedConfig.purchaseDate, showRealValue, t],
    );
    const hasMixedTimelineCadence = useMemo(
      () => usesMixedTimelineCadence(inputsA, inputsB),
      [inputsA, inputsB],
    );
    const assumptionsBondType = useMemo(
      () => getComparisonAssumptionsBondType(scenarioA.bondType, scenarioB.bondType),
      [scenarioA.bondType, scenarioB.bondType],
    );
    const maturityMode = sharedConfig.maturityMode ?? 'reinvest_until_horizon';
    const durationMismatch = definitions[scenarioA.bondType].duration !== definitions[scenarioB.bondType].duration;
    const durationMismatchText = durationMismatch
      ? t('comparison.duration_mismatch.description', {
          bondA: scenarioA.bondType,
          durationA: formatBondDuration(definitions[scenarioA.bondType].duration, language),
          bondB: scenarioB.bondType,
          durationB: formatBondDuration(definitions[scenarioB.bondType].duration, language),
        })
      : null;
    return (<CalculatorPageShell title={t('nav.comparison')} description={t('comparison.desc_independent')} icon={<Scale className="h-8 w-8"/>} isCalculating={isCalculating} isDirty={isDirty} hasResults={isPersistenceReady && !!resultsA} onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[390px_minmax(0,1fr)]">
            <ComparisonSharedBaseCard
              sharedConfig={sharedConfig}
              assumptionsBondType={assumptionsBondType}
              showRealValue={showRealValue}
              onShowRealValueChange={setShowRealValue}
              onUpdateSharedConfig={updateSharedConfig as (key: keyof typeof sharedConfig | string, value: unknown) => void}
            />

          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ScenarioOverrideCard title={t('comparison.scenario_a')} colorClass="scenario-a" bondType={scenarioA.bondType} onBondTypeChange={setBondTypeA} isRebought={scenarioA.isRebought} onReboughtChange={(value) => updateScenarioA('isRebought', value)} taxStrategy={scenarioA.taxStrategy} onTaxStrategyChange={(value) => updateScenarioA('taxStrategy', value)} customHorizonEnabled={scenarioA.investmentHorizonMonths !== undefined} onCustomHorizonEnabledChange={setScenarioACustomHorizonEnabled} customHorizonMonths={scenarioA.investmentHorizonMonths} onCustomHorizonMonthsChange={setScenarioACustomHorizonMonths}/>
              <ScenarioOverrideCard title={t('comparison.scenario_b')} colorClass="scenario-b" bondType={scenarioB.bondType} onBondTypeChange={setBondTypeB} isRebought={scenarioB.isRebought} onReboughtChange={(value) => updateScenarioB('isRebought', value)} taxStrategy={scenarioB.taxStrategy} onTaxStrategyChange={(value) => updateScenarioB('taxStrategy', value)} customHorizonEnabled={scenarioB.investmentHorizonMonths !== undefined} onCustomHorizonEnabledChange={setScenarioBCustomHorizonEnabled} customHorizonMonths={scenarioB.investmentHorizonMonths} onCustomHorizonMonthsChange={setScenarioBCustomHorizonMonths}/>
            </div>

            <section className="space-y-3 border-y border-border py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h2 className="ui-card-title">{t('comparison.fairness.title')}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t(`comparison.maturity_mode.${maturityMode}.description`)}
                  </p>
                </div>
                <div className="ui-metadata text-muted-foreground">
                  {t('comparison.fairness.mode_label')}: {t(`comparison.maturity_mode.${maturityMode}.label`)}
                </div>
              </div>
              {durationMismatchText ? (
                <Notice tone="warning" title={t('comparison.duration_mismatch.title')}>
                  {durationMismatchText}
                </Notice>
              ) : null}
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

            {resultsA && resultsB ? (<div className={cn('space-y-8', isCalculating && 'opacity-60')}>
                {isDirty ? (
                  <Notice tone="warning" compact>
                    {t('comparison.stale_results')}
                  </Notice>
                ) : null}

                {hasMounted ? (
                  <ComparisonResultsPanel
                    chartData={chartData}
                    showRealValue={showRealValue}
                    usesMixedTimelineCadence={hasMixedTimelineCadence}
                    resultsA={resultsA}
                    resultsB={resultsB}
                    inputsA={inputsA}
                    inputsB={inputsB}
                    formatCurrency={formatCurrency}
                    language={language}
                  />
                ) : null}

                <ComparisonVerdict resultsA={resultsA} resultsB={resultsB} inputsA={inputsA} inputsB={inputsB} expectedInflation={sharedConfig.expectedInflation} taxStrategy={sharedConfig.taxStrategy} maturityMode={maturityMode} showRealValue={showRealValue} formatCurrency={formatCurrency}/>

                <ComparisonTable resultsA={resultsA} resultsB={resultsB} bondTypeA={inputsA.bondType} bondTypeB={inputsB.bondType} showRealValue={showRealValue} formatCurrency={formatCurrency}/>

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
        </div>
      <RecalculateButton isDirty={isDirty} hasResults={!!resultsA && !!resultsB} loading={isCalculating} onClick={() => calculate()}/>
    </CalculatorPageShell>);
};



