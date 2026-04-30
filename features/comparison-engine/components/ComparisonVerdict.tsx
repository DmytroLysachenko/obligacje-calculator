'use client';

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingDown, Zap, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n";
import { CalculationResult, TaxStrategy, BondInputs } from "@/features/bond-core/types";

interface ComparisonVerdictProps {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  inputsA: BondInputs;
  inputsB: BondInputs;
  expectedInflation: number;
  taxStrategy?: TaxStrategy;
  formatCurrency: (val: number) => string;
}

export const ComparisonVerdict: React.FC<ComparisonVerdictProps> = ({
  resultsA,
  resultsB,
  inputsA,
  inputsB,
  expectedInflation,
  taxStrategy,
  formatCurrency,
}) => {
  const { t, language } = useLanguage();
  const comparisonSnapshotLabel = language === 'pl' ? 'Snapshot porownania' : 'Comparison snapshot';
  const higherText = language === 'pl' ? 'ma wyzszy wynik netto' : 'shows the higher net outcome';
  const overText = language === 'pl' ? 'dla horyzontu' : 'for a';
  const betterBondType = resultsA.netPayoutValue > resultsB.netPayoutValue ? inputsA.bondType : inputsB.bondType;
  const betterScenarioLabel = resultsA.netPayoutValue > resultsB.netPayoutValue ? t('comparison.scenario_a') : t('comparison.scenario_b');
  const gap = Math.abs(resultsA.netPayoutValue - resultsB.netPayoutValue);
  const horizonYears = Math.max(resultsA.timeline.length / 12, resultsB.timeline.length / 12).toFixed(1);

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl bg-primary/5">
      <CardHeader className="bg-primary/10 border-b pb-4">
        <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2 text-primary">
          <Award className="h-5 w-5" />
          {t('comparison.verdict')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-primary/10">
                <span className={resultsA.netPayoutValue > resultsB.netPayoutValue ? "text-2xl font-black text-blue-600" : "text-2xl font-black text-emerald-600"}>
                  {betterBondType}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{comparisonSnapshotLabel}</p>
                <p className="text-xl font-black tracking-tight">
                  {betterScenarioLabel} {higherText}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                {`${betterBondType} ${higherText} by ${formatCurrency(gap)} ${overText} ${horizonYears}-year setup.`}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {resultsA.netPayoutValue > resultsB.netPayoutValue ? (
                  <>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold uppercase text-[9px] py-1">
                      <TrendingDown className="h-3 w-3 mr-1" /> {(resultsA.timeline.length / 12) < 4 ? t('comparison.verdict_short_term') : t('comparison.verdict_long_term')}
                    </Badge>
                    {expectedInflation > 5 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-bold uppercase text-[9px] py-1">
                        <Zap className="h-3 w-3 mr-1" /> {language === 'pl' ? 'Wysoka wrazliwosc na inflacje' : 'High inflation sensitivity'}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold uppercase text-[9px] py-1">
                      <TrendingDown className="h-3 w-3 mr-1" /> {(resultsB.timeline.length / 12) < 4 ? t('comparison.verdict_short_term') : t('comparison.verdict_long_term')}
                    </Badge>
                    {expectedInflation > 5 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-bold uppercase text-[9px] py-1">
                        <Zap className="h-3 w-3 mr-1" /> {language === 'pl' ? 'Wysoka wrazliwosc na inflacje' : 'High inflation sensitivity'}
                      </Badge>
                    )}
                  </>
                )}
                {taxStrategy !== TaxStrategy.STANDARD && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-bold uppercase text-[9px] py-1">
                    <ShieldCheck className="h-3 w-3 mr-1" /> {language === 'pl' ? 'Rozne zasady podatkowe' : 'Different tax wrapper rules'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-48 flex flex-col gap-2">
            <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm text-center">
              <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Difference</p>
              <p className="text-2xl font-black text-primary">
                {Math.abs(((resultsA.netPayoutValue / Math.max(1, resultsB.netPayoutValue)) - 1) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
