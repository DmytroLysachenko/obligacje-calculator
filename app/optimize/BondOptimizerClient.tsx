'use client';

import React, { useCallback, useState } from 'react';
import { Award, Info, Scale, TrendingUp, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  const [envelope, setEnvelope] =
    useState<BondOptimizerCalculationEnvelope | null>(null);
  const { isCalculating, post } = useCalculationRequest();

  const handleCalculate = useCallback(async () => {
    try {
      const data = await post<BondOptimizerCalculationEnvelope>(
        '/api/calculate/optimize',
        inputs,
      );
      setEnvelope(data);
    } catch (error) {
      console.error('Optimization error:', error);
    }
  }, [inputs, post]);

  const updateInput = (key: string, value: string | number | boolean) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const results = envelope?.result;
  const highestPayoutScenario = results?.highestPayout;
  const horizonYears = (inputs.investmentHorizonMonths / 12).toFixed(1);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(320px,380px)_1fr]">
      <div className="space-y-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Scenario Setup</CardTitle>
            <CardDescription>
              Define the amount, horizon, tax wrapper, and purchase date for a
              neutral simulation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Amount to Invest
                </Label>
                <span className="text-sm font-black text-primary">
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

            <div className="space-y-2 border-t pt-5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Horizon
                </Label>
                <span className="text-sm font-black text-primary">
                  {inputs.investmentHorizonMonths}M / {horizonYears}Y
                </span>
              </div>
              <CommittedSliderInput
                value={inputs.investmentHorizonMonths}
                min={3}
                max={360}
                step={1}
                unit="M"
                onCommit={(value) =>
                  updateInput('investmentHorizonMonths', value)
                }
              />
            </div>

            <div className="space-y-2 border-t pt-5">
              <Label htmlFor="purchaseDate" className="text-xs font-bold uppercase text-muted-foreground">
                Purchase Date
              </Label>
              <Input
                id="purchaseDate"
                type="date"
                value={inputs.purchaseDate}
                onChange={(event) =>
                  updateInput('purchaseDate', event.target.value)
                }
              />
            </div>

            <div className="space-y-2 border-t pt-5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Tax Strategy
              </Label>
              <Select
                value={inputs.taxStrategy}
                onValueChange={(value) => updateInput('taxStrategy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaxStrategy.STANDARD}>
                    Standard (19% Belka)
                  </SelectItem>
                  <SelectItem value={TaxStrategy.IKE}>IKE (0% Tax)</SelectItem>
                  <SelectItem value={TaxStrategy.IKZE}>
                    IKZE (Retirement Tax Rules)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 border-t pt-5">
              <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                <Label
                  htmlFor="includeFamilyBonds"
                  className="flex flex-col gap-1"
                >
                  <span className="font-semibold">Include Family Bonds</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    ROS/ROD require 800+ family program eligibility.
                  </span>
                </Label>
                <Switch
                  id="includeFamilyBonds"
                  checked={inputs.includeFamilyBonds}
                  onCheckedChange={(value) =>
                    updateInput('includeFamilyBonds', value)
                  }
                />
              </div>
            </div>

            <Button
              className="mt-2 h-11 w-full font-black uppercase tracking-wide"
              onClick={handleCalculate}
              disabled={isCalculating}
            >
              {isCalculating ? 'Simulating...' : 'Run Scenario Ranking'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TriangleAlert className="h-4 w-4 text-amber-700" />
              Interpretation Guardrail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900">
            <p>
              This page ranks modeled payouts for one fixed scenario. It is not
              personal advice, suitability analysis, or a recommendation.
            </p>
            <p>
              Small assumption changes can reorder outcomes, especially for
              short horizons and rollover-heavy bonds.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Market Assumptions</CardTitle>
            <CardDescription>
              Keep inputs within plausible planning ranges to avoid distorted
              rankings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Expected Inflation
                </Label>
                <span className="text-sm font-black text-primary">
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

            <div className="space-y-2 border-t pt-5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Expected NBP Rate
                </Label>
                <span className="text-sm font-black text-primary">
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
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {isCalculating ? (
          <div className="space-y-6">
            <Skeleton className="h-[240px] w-full" />
            <Skeleton className="h-[420px] w-full" />
          </div>
        ) : results && highestPayoutScenario ? (
          <>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <Badge className="w-fit bg-primary text-primary-foreground">
                      <Award className="mr-1 h-3 w-3" />
                      Highest payout under assumptions
                    </Badge>
                    <CardTitle className="text-2xl">
                      {highestPayoutScenario.name} ({highestPayoutScenario.bondType})
                    </CardTitle>
                    <CardDescription>
                      Highest ranked outcome for your {inputs.investmentHorizonMonths}
                      -month setup.
                    </CardDescription>
                  </div>
                  <div className="rounded-xl border bg-background/80 px-4 py-3 text-right">
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Estimated Net Payout
                    </p>
                    <p className="text-2xl font-black text-primary">
                      {formatCurrency(highestPayoutScenario.netPayoutValue)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-background/60 p-4 text-sm">
                  <p className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{highestPayoutScenario.scenarioReason}</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border bg-background/70 p-4 text-center">
                    <p className="text-[11px] font-bold uppercase text-muted-foreground">
                      Net Profit
                    </p>
                    <p className="text-lg font-black text-green-600">
                      +{formatCurrency(highestPayoutScenario.totalProfit)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-background/70 p-4 text-center">
                    <p className="text-[11px] font-bold uppercase text-muted-foreground">
                      Total ROI
                    </p>
                    <p className="text-lg font-black">
                      {formatPercentage(
                        (highestPayoutScenario.totalProfit / inputs.initialInvestment) *
                          100,
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-background/70 p-4 text-center">
                    <p className="text-[11px] font-bold uppercase text-muted-foreground">
                      Tax Paid
                    </p>
                    <p className="text-lg font-black text-orange-600">
                      {formatCurrency(highestPayoutScenario.result.totalTax)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Ranked Simulated Outcomes
                </CardTitle>
                <CardDescription>
                  Ordered by projected net payout after {horizonYears} years.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.rankedBonds.map((item, index) => {
                  const gapToLead = highestPayoutScenario.netPayoutValue - item.netPayoutValue;

                  return (
                    <div
                      key={item.bondType}
                      className={`rounded-xl border p-4 ${
                        index === 0
                          ? 'border-primary/30 bg-primary/5'
                          : 'bg-card'
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-black">
                            {index + 1}
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.scenarioReason}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black">
                            {formatCurrency(item.netPayoutValue)}
                          </p>
                          <p
                            className={`text-xs font-semibold ${
                              index === 0
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {index === 0
                              ? 'Highest payout in this scenario'
                              : `-${formatCurrency(gapToLead)} vs highest`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/20 text-muted-foreground">
            <TrendingUp className="mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-semibold">Ready to rank scenarios?</p>
            <p className="text-sm">
              Set assumptions, run the simulation, then compare payout ordering.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
