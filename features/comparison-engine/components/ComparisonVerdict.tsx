'use client';
import React from 'react';
import { Scale, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppI18n } from '@/i18n/client';
import { BondInputs, CalculationResult, TaxStrategy, } from '@/features/bond-core/types';
interface ComparisonVerdictProps {
    resultsA: CalculationResult;
    resultsB: CalculationResult;
    inputsA: BondInputs;
    inputsB: BondInputs;
    expectedInflation: number;
    taxStrategy?: TaxStrategy;
    showRealValue: boolean;
    formatCurrency: (val: number) => string;
}
export const ComparisonVerdict: React.FC<ComparisonVerdictProps> = ({ resultsA, resultsB, inputsA, inputsB, expectedInflation, taxStrategy, showRealValue, formatCurrency, }) => {
    const { t } = useAppI18n();
    const comparisonSnapshotLabel = t('comparison.verdict_snapshot_label');
    const higherText = showRealValue
        ? t('comparison.verdict.higher_real_value')
        : t('comparison.verdict.higher_net_payout');
    const overText = t('comparison.verdict_over_text');
    const resultAValue = showRealValue ? resultsA.finalRealValue : resultsA.netPayoutValue;
    const resultBValue = showRealValue ? resultsB.finalRealValue : resultsB.netPayoutValue;
    const betterBondType = resultAValue > resultBValue
        ? inputsA.bondType
        : inputsB.bondType;
    const betterScenarioLabel = resultAValue > resultBValue
        ? t('comparison.scenario_a')
        : t('comparison.scenario_b');
    const gap = Math.abs(resultAValue - resultBValue);
    const horizonYears = Math.max(resultsA.timeline.length / 12, resultsB.timeline.length / 12).toFixed(1);
    return (<section className="space-y-6">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-foreground"/>
        <h2 className="ui-section-title">
          {t('comparison.summary') ?? 'Simulation Summary'}
        </h2>
      </div>
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-4 py-3">
                <span className="ui-large-metric">
                  {betterBondType}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {comparisonSnapshotLabel}
                </p>
                <p className="ui-section-title">
                  {betterScenarioLabel} {higherText}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium leading-6 text-foreground">
                {`${betterBondType} ${higherText} by ${formatCurrency(gap)} ${overText} ${horizonYears}-year setup.`}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('comparison.verdict.caution_text')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {resultAValue > resultBValue ? (<Badge variant="outline" className="border-border bg-muted/35 text-xs font-semibold text-muted-foreground">
                  <Scale className="h-3 w-3 mr-1"/>
                  {(resultsA.timeline.length / 12) < 4
                ? t('comparison.verdict_short_term')
                : t('comparison.verdict_long_term')}
                </Badge>) : (<Badge variant="outline" className="border-border bg-muted/35 text-xs font-semibold text-muted-foreground">
                  <Scale className="h-3 w-3 mr-1"/>
                  {(resultsB.timeline.length / 12) < 4
                ? t('comparison.verdict_short_term')
                : t('comparison.verdict_long_term')}
                </Badge>)}

              {expectedInflation > 5 ? (<Badge variant="outline" className="border-warning/30 bg-warning/10 text-xs font-semibold text-warning">
                  <Zap className="h-3 w-3 mr-1"/>
                  {t('comparison.verdict_high_inflation_badge')}
                </Badge>) : null}

              {taxStrategy !== TaxStrategy.STANDARD ? (<Badge variant="outline" className="border-border bg-muted/35 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 mr-1"/>
                  {t('comparison.verdict_tax_wrapper_badge')}
                </Badge>) : null}
            </div>
          </div>

          <div className="w-full md:w-48 flex flex-col gap-2">
            <div className="bg-muted/35 px-4 py-4 text-center">
              <p className="mb-1 text-sm font-semibold text-muted-foreground">
                {t('comparison.verdict_gap_label')}
              </p>
              <p className="ui-large-metric">
                {Math.abs((resultAValue / Math.max(1, resultBValue) -
            1) *
            100).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </div>
    </section>);
};





