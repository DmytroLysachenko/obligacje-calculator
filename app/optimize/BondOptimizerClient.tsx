'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  Info,
  LineChart,
  ListOrdered,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { BondOptimizerCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { TaxStrategy } from '@/features/bond-core/types';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { toDateString } from '@/shared/lib/date-timing';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';

export default function BondOptimizerClient() {
  const [inputs, setInputs] = useState({
    initialInvestment: 10000,
    investmentHorizonMonths: 48,
    purchaseDate: toDateString(new Date()),
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    taxStrategy: TaxStrategy.STANDARD,
    includeFamilyBonds: false,
  });
  const [envelope, setEnvelope] = useState<BondOptimizerCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const { isCalculating, post } = useCalculationRequest();

  const handleCalculate = useCallback(async () => {
    try {
      const data = await post<BondOptimizerCalculationEnvelope>(
        '/api/calculate/optimize',
        inputs,
      );
      setEnvelope(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Scenario ranking error:', error);
    }
  }, [inputs, post]);

  const updateInput = (key: string, value: string | number | boolean) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const results = envelope?.result;
  const leadingScenario = results?.highestPayout;
  const horizonYears = useMemo(
    () => (inputs.investmentHorizonMonths / 12).toFixed(1),
    [inputs.investmentHorizonMonths],
  );

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
      <aside className="space-y-6 xl:col-span-4 xl:sticky xl:top-28 xl:h-fit">
        <Card className="rounded-2xl border shadow-none">
          <CardHeader className="border-b pb-4">
            <CardTitle>Scenario inputs</CardTitle>
            <CardDescription>
              Set one scenario, run the ranking once, then inspect how modeled payouts differ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Amount to invest
                </Label>
                <span className="text-lg font-semibold text-foreground">
                  {formatCurrency(inputs.initialInvestment)}
                </span>
              </div>
              <CommittedSliderInput
                value={inputs.initialInvestment}
                min={100}
                max={250000}
                step={100}
                unit="PLN"
                onCommit={(value) => updateInput('initialInvestment', value)}
              />
            </div>

            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Horizon
                </Label>
                <span className="text-lg font-semibold text-foreground">
                  {inputs.investmentHorizonMonths}M / {horizonYears}Y
                </span>
              </div>
              <CommittedSliderInput
                value={inputs.investmentHorizonMonths}
                min={3}
                max={360}
                step={1}
                unit="M"
                onCommit={(value) => updateInput('investmentHorizonMonths', value)}
              />
            </div>

            <div className="space-y-3 border-t pt-6">
              <Label htmlFor="purchaseDate" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Purchase date
              </Label>
              <Input
                id="purchaseDate"
                type="date"
                value={inputs.purchaseDate}
                onChange={(event) => updateInput('purchaseDate', event.target.value)}
              />
            </div>

            <div className="space-y-3 border-t pt-6">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tax strategy
              </Label>
              <Select
                value={inputs.taxStrategy}
                onValueChange={(value) => updateInput('taxStrategy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaxStrategy.STANDARD}>Standard (19% Belka)</SelectItem>
                  <SelectItem value={TaxStrategy.IKE}>IKE (0% tax)</SelectItem>
                  <SelectItem value={TaxStrategy.IKZE}>IKZE (retirement tax rules)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                <Label htmlFor="includeFamilyBonds" className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">Include family bonds</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ROS and ROD only make sense when the family-bond condition is actually met.
                  </span>
                </Label>
                <Switch
                  id="includeFamilyBonds"
                  checked={inputs.includeFamilyBonds}
                  onCheckedChange={(value) => updateInput('includeFamilyBonds', value)}
                />
              </div>
            </div>

            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Expected inflation
                </Label>
                <span className="text-lg font-semibold text-foreground">
                  {inputs.expectedInflation.toFixed(1)}%
                </span>
              </div>
              <CommittedSliderInput
                value={inputs.expectedInflation}
                min={-2}
                max={15}
                step={0.1}
                unit="%"
                onCommit={(value) => updateInput('expectedInflation', value)}
              />
            </div>

            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Expected NBP rate
                </Label>
                <span className="text-lg font-semibold text-foreground">
                  {inputs.expectedNbpRate.toFixed(2)}%
                </span>
              </div>
              <CommittedSliderInput
                value={inputs.expectedNbpRate}
                min={0}
                max={15}
                step={0.05}
                unit="%"
                onCommit={(value) => updateInput('expectedNbpRate', value)}
              />
            </div>

            <Button
              className="h-11 w-full font-semibold"
              onClick={handleCalculate}
              disabled={isCalculating}
            >
              {isCalculating ? 'Running scenario ranking...' : 'Run ranking'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-amber-200 bg-amber-50 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Interpretation guardrail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-amber-950">
            <p>
              This page sorts projected payouts for one scenario. It does not decide what is best for
              a real investor and it does not account for suitability, liquidity needs, or broader portfolio context.
            </p>
            <p>
              Small assumption changes can reorder the list quickly, especially when horizons are short
              or rollover is required.
            </p>
          </CardContent>
        </Card>
      </aside>

      <section className="space-y-6 xl:col-span-8">
        {isCalculating ? (
          <div className="space-y-6">
            <Skeleton className="h-[220px] w-full rounded-2xl" />
            <Skeleton className="h-[460px] w-full rounded-2xl" />
          </div>
        ) : results && leadingScenario ? (
          <>
            {isDirty && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                Inputs changed. The ranking below still shows the previous committed scenario.
                Run ranking again when you want to refresh it.
              </div>
            )}

            <Card className="rounded-2xl border shadow-none">
              <CardHeader className="border-b pb-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <ListOrdered className="h-5 w-5 text-primary" />
                      Current leading scenario
                    </CardTitle>
                    <CardDescription className="text-sm leading-6">
                      Highest modeled net payout for this {inputs.investmentHorizonMonths}-month scenario.
                    </CardDescription>
                  </div>
                  <div className="rounded-xl border bg-muted/20 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Estimated net payout
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {formatCurrency(leadingScenario.netPayoutValue)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {leadingScenario.name} ({leadingScenario.bondType})
                  </p>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{leadingScenario.scenarioReason}</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Net profit</p>
                    <p className="mt-2 text-xl font-semibold text-emerald-700">
                      +{formatCurrency(leadingScenario.totalProfit)}
                    </p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">ROI</p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatPercentage(
                        (leadingScenario.totalProfit / inputs.initialInvestment) * 100,
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Tax paid</p>
                    <p className="mt-2 text-xl font-semibold text-orange-700">
                      {formatCurrency(leadingScenario.result.totalTax)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border shadow-none">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ArrowDownUp className="h-5 w-5 text-primary" />
                  Ranked outcomes
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  Ordered by projected net payout after {horizonYears} years. This is scenario sorting, not a recommendation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {results.rankedBonds.map((item, index) => {
                  const gapToLead = leadingScenario.netPayoutValue - item.netPayoutValue;

                  return (
                    <div key={item.bondType} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted/20 text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">
                              {item.name} ({item.bondType})
                            </p>
                            <p className="text-sm leading-6 text-muted-foreground">
                              {item.scenarioReason}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {formatCurrency(item.netPayoutValue)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {index === 0
                              ? 'Leading payout in this scenario'
                              : `-${formatCurrency(gapToLead)} versus the leading payout`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <CalculationMetaPanel
              warnings={envelope?.warnings}
              assumptions={envelope?.assumptions}
              calculationNotes={envelope?.calculationNotes}
              dataQualityFlags={envelope?.dataQualityFlags}
              dataFreshness={envelope?.dataFreshness}
            />
          </>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center text-muted-foreground">
            <LineChart className="mb-4 h-12 w-12 opacity-25" />
            <p className="text-lg font-semibold text-foreground">Rank one scenario at a time</p>
            <p className="mt-2 max-w-2xl text-sm leading-6">
              Set the amount, horizon, and macro assumptions. Then run the ranking to compare projected payouts across bond types.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
