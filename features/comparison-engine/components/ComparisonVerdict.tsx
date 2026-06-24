'use client';
import React from 'react';
import { Scale, ShieldCheck, Zap } from 'lucide-react';
import { useAppI18n } from '@/i18n/client';
import { BondInputs, CalculationResult, TaxStrategy } from '@/features/bond-core/types';
interface ComparisonVerdictProps {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  inputsA: BondInputs;
  inputsB: BondInputs;
  expectedInflation: number;
  taxStrategy?: TaxStrategy;
  formatCurrency: (val: number) => string;
}
function getVerdictDrivers({
  winner,
  loser,
  expectedInflation,
  t,
}: {
  winner: BondInputs;
  loser: BondInputs;
  expectedInflation: number;
  t: ReturnType<typeof useAppI18n>['t'];
}) {
  const drivers = [
    t('comparison.verdict.driver_mode', {
      mode: t('comparison.auto_rollover_mode_label'),
    }),
  ];
  if (winner.duration !== loser.duration) {
    drivers.push(
      t('comparison.verdict.driver_duration', {
        winner: winner.bondType,
        loser: loser.bondType,
      }),
    );
  }
  if (winner.isCapitalized !== loser.isCapitalized) {
    drivers.push(
      t('comparison.verdict.driver_capitalization', {
        winner: winner.bondType,
      }),
    );
  }
  if (expectedInflation > 5 && winner.expectedInflation > 0) {
    drivers.push(t('comparison.verdict.driver_inflation'));
  }
  return drivers.slice(0, 3);
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
  const { t } = useAppI18n();
  const comparisonSnapshotLabel = t('comparison.verdict_snapshot_label');
  const higherText = t('comparison.verdict.higher_net_payout');
  const overText = t('comparison.verdict_over_text');
  const resultAValue = resultsA.netPayoutValue;
  const resultBValue = resultsB.netPayoutValue;
  const betterBondType = resultAValue > resultBValue ? inputsA.bondType : inputsB.bondType;
  const betterScenarioLabel =
    resultAValue > resultBValue ? t('comparison.scenario_a') : t('comparison.scenario_b');
  const winnerInputs = resultAValue > resultBValue ? inputsA : inputsB;
  const loserInputs = resultAValue > resultBValue ? inputsB : inputsA;
  const verdictDrivers = getVerdictDrivers({
    winner: winnerInputs,
    loser: loserInputs,
    expectedInflation,
    t,
  });
  const gap = Math.abs(resultAValue - resultBValue);
  const horizonYears = Math.max(
    resultsA.timeline.length / 12,
    resultsB.timeline.length / 12,
  ).toFixed(1);
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-foreground" />
        <h2 className="ui-section-title">{t('comparison.summary') ?? 'Simulation Summary'}</h2>
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="px-4 py-3">
              <span className="ui-large-metric">{betterBondType}</span>
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
              {t('comparison.verdict.mode_context', {
                mode: t('comparison.auto_rollover_mode_label'),
              })}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('comparison.verdict.caution_text')}
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <p className="ui-metadata font-semibold text-muted-foreground">
              {t('comparison.verdict.drivers_title')}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {verdictDrivers.map((driver) => (
                <li key={driver} className="border-l-2 border-border pl-3">
                  {driver}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4">
            {resultAValue > resultBValue ? (
              <span className="inline-flex items-center gap-2 border-l-2 border-border pl-3 text-xs font-semibold text-muted-foreground">
                <Scale className="h-3 w-3" />
                {resultsA.timeline.length / 12 < 4
                  ? t('comparison.verdict_short_term')
                  : t('comparison.verdict_long_term')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 border-l-2 border-border pl-3 text-xs font-semibold text-muted-foreground">
                <Scale className="h-3 w-3" />
                {resultsB.timeline.length / 12 < 4
                  ? t('comparison.verdict_short_term')
                  : t('comparison.verdict_long_term')}
              </span>
            )}

            {expectedInflation > 5 ? (
              <span className="inline-flex items-center gap-2 border-l-2 border-warning pl-3 text-xs font-semibold text-warning">
                <Zap className="h-3 w-3" />
                {t('comparison.verdict_high_inflation_badge')}
              </span>
            ) : null}

            {taxStrategy !== TaxStrategy.STANDARD ? (
              <span className="inline-flex items-center gap-2 border-l-2 border-border pl-3 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                {t('comparison.verdict_tax_wrapper_badge')}
              </span>
            ) : null}
          </div>
        </div>

        <div className="w-full md:w-48 flex flex-col gap-2">
          <div className="border-l-2 border-border px-4 py-4 text-center">
            <p className="mb-1 text-sm font-semibold text-muted-foreground">
              {t('comparison.verdict_gap_label')}
            </p>
            <p className="ui-large-metric">
              {Math.abs((resultAValue / Math.max(1, resultBValue) - 1) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
