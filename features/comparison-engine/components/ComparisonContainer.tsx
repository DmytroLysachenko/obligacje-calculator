'use client';
import React, { useMemo, useState } from 'react';
import { Scale, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    const { sharedConfig, scenarioA, scenarioB, inputsA, inputsB, resultsA, resultsB, envelopeA, envelopeB, warningsA, warningsB, isCalculating, calculate, updateSharedConfig, updateScenarioA, updateScenarioB, setBondTypeA, setBondTypeB, setScenarioACustomHorizonEnabled, setScenarioBCustomHorizonEnabled, setScenarioACustomHorizonMonths, setScenarioBCustomHorizonMonths, isDirty, isPersistenceReady, } = useComparison();
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
                {isDirty ? (<div className="ui-inline-notice flex items-start gap-3 border-l-2 border-warning text-foreground">
                    <TriangleAlert className="mt-0.5 h-5 w-5 text-warning"/>
                    <div className="flex items-start gap-3">
                      <p className="text-sm text-foreground">
                        {t('comparison.stale_results')}
                      </p>
                    </div>
                  </div>) : null}

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

                <ComparisonVerdict resultsA={resultsA} resultsB={resultsB} inputsA={inputsA} inputsB={inputsB} expectedInflation={sharedConfig.expectedInflation} taxStrategy={sharedConfig.taxStrategy} showRealValue={showRealValue} formatCurrency={formatCurrency}/>

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
                ].map((entry) => (<Card key={entry.label} className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/10 pb-3">
                          <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                            {entry.label} {t('comparison.notes_suffix')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <CalculationMetaPanel warnings={entry.warnings} assumptions={entry.envelope?.assumptions} calculationNotes={entry.envelope?.calculationNotes} dataQualityFlags={entry.envelope?.dataQualityFlags} dataFreshness={entry.envelope?.dataFreshness} compact/>
                        </CardContent>
                      </Card>))}
                  </div>
                </SecondaryInsightAccordion>
              </div>) : null}
          </div>
        </div>
      <RecalculateButton isDirty={isDirty} hasResults={!!resultsA && !!resultsB} loading={isCalculating} onClick={() => calculate()}/>
    </CalculatorPageShell>);
};



