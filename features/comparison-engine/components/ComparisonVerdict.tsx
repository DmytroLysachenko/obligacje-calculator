'use client';
import React from 'react';
import { Scale, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
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
    const { t, language } = useLanguage();
    const comparisonSnapshotLabel = t("generated.features.comparison_engine.components.comparison_verdict.item_1", undefined, language);
    const higherText = showRealValue
        ? t('comparison.verdict.higher_real_value', undefined, language)
        : t('comparison.verdict.higher_net_payout', undefined, language);
    const overText = t("generated.features.comparison_engine.components.comparison_verdict.item_2", undefined, language);
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
    return (<Card className="overflow-hidden border border-slate-200 bg-white shadow-none">
      <CardHeader className="border-b bg-slate-50/60 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
          <Scale className="h-5 w-5 text-primary"/>
          {t('comparison.summary') ?? 'Simulation Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <span className={resultAValue > resultBValue
            ? 'text-2xl font-black text-blue-700'
            : 'text-2xl font-black text-emerald-700'}>
                  {betterBondType}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {comparisonSnapshotLabel}
                </p>
                <p className="text-xl font-black tracking-tight text-slate-900">
                  {betterScenarioLabel} {higherText}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                {`${betterBondType} ${higherText} by ${formatCurrency(gap)} ${overText} ${horizonYears}-year setup.`}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('comparison.verdict.caution_text', undefined, language)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {resultAValue > resultBValue ? (<Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700">
                  <Scale className="h-3 w-3 mr-1"/>
                  {(resultsA.timeline.length / 12) < 4
                ? t('comparison.verdict_short_term')
                : t('comparison.verdict_long_term')}
                </Badge>) : (<Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700">
                  <Scale className="h-3 w-3 mr-1"/>
                  {(resultsB.timeline.length / 12) < 4
                ? t('comparison.verdict_short_term')
                : t('comparison.verdict_long_term')}
                </Badge>)}

              {expectedInflation > 5 ? (<Badge variant="outline" className="border-orange-200 bg-orange-50 text-xs font-semibold text-orange-700">
                  <Zap className="h-3 w-3 mr-1"/>
                  {t("generated.features.comparison_engine.components.comparison_verdict.item_3", undefined, language)}
                </Badge>) : null}

              {taxStrategy !== TaxStrategy.STANDARD ? (<Badge variant="outline" className="border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700">
                  <ShieldCheck className="h-3 w-3 mr-1"/>
                  {t("generated.features.comparison_engine.components.comparison_verdict.item_4", undefined, language)}
                </Badge>) : null}
            </div>
          </div>

          <div className="w-full md:w-48 flex flex-col gap-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-center">
              <p className="mb-1 text-sm font-semibold text-muted-foreground">
                {t("generated.features.comparison_engine.components.comparison_verdict.item_5", undefined, language)}
              </p>
              <p className="text-2xl font-black text-primary">
                {Math.abs((resultAValue / Math.max(1, resultBValue) -
            1) *
            100).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);
};

