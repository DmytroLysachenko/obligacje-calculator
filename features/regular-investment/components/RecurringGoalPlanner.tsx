'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RegularInvestmentInputs } from '@/features/bond-core/types';
import { RegularInvestmentCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { postCalculation } from '@/shared/lib/calculation-client';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';

import { solveRequiredRecurringContribution } from '../lib/regular-goal-solver';

export function RecurringGoalPlanner({
  inputs,
  onApply,
}: {
  inputs: RegularInvestmentInputs;
  onApply: (value: number) => void;
}) {
  const [target, setTarget] = useState('');
  const [result, setResult] = useState<{
    contribution: number | null;
    achieved: number;
    reachable: boolean;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const solve = async () => {
    const desired = Number(target);
    if (!(desired > 0)) return;
    setRunning(true);
    try {
      setResult(
        await solveRequiredRecurringContribution({
          target: desired,
          calculate: async (contributionAmount) =>
            (
              await postCalculation<RegularInvestmentCalculationEnvelope>(
                getCalculationEndpoint(ScenarioKind.REGULAR_INVESTMENT),
                { ...inputs, contributionAmount },
              )
            ).result.finalNominalValue,
        }),
      );
    } finally {
      setRunning(false);
    }
  };
  return (
    <section className="ui-result-panel" aria-labelledby="recurring-goal-title">
      <h2 id="recurring-goal-title" className="ui-heading-sm">
        Recurring savings goal
      </h2>
      <p className="ui-meta mt-1 text-muted-foreground">
        Find the minimum base contribution for this date and target. This is a deterministic
        scenario, not advice.
      </p>
      <div className="mt-3 flex gap-2">
        <Input
          aria-label="Target amount in PLN"
          type="number"
          min={1}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        />
        <Button type="button" disabled={running} onClick={() => void solve()}>
          {running ? 'Solving…' : 'Solve'}
        </Button>
      </div>
      {result ? (
        <p className="ui-meta mt-3" role="status">
          {result.reachable ? (
            <>
              Required base contribution: <strong>{result.contribution?.toFixed(2)} PLN</strong>;
              verified outcome: {result.achieved.toFixed(2)} PLN.{' '}
              <Button
                type="button"
                variant="link"
                onClick={() => result.contribution !== null && onApply(result.contribution)}
              >
                Use as draft
              </Button>
            </>
          ) : (
            <>
              The target is not reachable within the configured contribution bound. Highest tested
              outcome: {result.achieved.toFixed(2)} PLN.
            </>
          )}
        </p>
      ) : null}
    </section>
  );
}
