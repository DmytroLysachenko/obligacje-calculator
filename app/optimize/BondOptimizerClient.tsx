'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  ArrowRight,
  Info,
  LineChart,
  ListOrdered,
  TrendingUp,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BondOptimizerCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { TaxStrategy } from '@/features/bond-core/types';
import {
  FAMILY_BOND_TYPES,
  getBondSupportMeta,
} from '@/features/bond-core/support-matrix';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { toDateString } from '@/shared/lib/date-timing';

type OptimizerInputs = {
  initialInvestment: number;
  investmentHorizonMonths: number;
  purchaseDate: string;
  expectedInflation: number;
  expectedNbpRate: number;
  taxStrategy: TaxStrategy;
  includeFamilyBonds: boolean;
};

const DEFAULT_INPUTS: OptimizerInputs = {
  initialInvestment: 10000,
  investmentHorizonMonths: 48,
  purchaseDate: toDateString(new Date()),
  expectedInflation: 3.5,
  expectedNbpRate: 5.25,
  taxStrategy: TaxStrategy.STANDARD,
  includeFamilyBonds: false,
};

const TAX_STRATEGY_LABELS: Record<TaxStrategy, string> = {
  [TaxStrategy.STANDARD]: 'Standard account (19% tax)',
  [TaxStrategy.IKE]: 'IKE wrapper',
  [TaxStrategy.IKZE]: 'IKZE wrapper',
};

const SupportMetric = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) => (
  <Card className="rounded-2xl border shadow-none">
    <CardContent className="p-5">
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </CardContent>
  </Card>
);

export default function BondOptimizerClient() {
  const [inputs, setInputs] = useState<OptimizerInputs>(DEFAULT_INPUTS);
  const [envelope, setEnvelope] =
    useState<BondOptimizerCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const { isCalculating, post } = useCalculationRequest();

  const results = envelope?.result;
  const leadingScenario = results?.highestPayout;
  const horizonYears = useMemo(
    () => (inputs.investmentHorizonMonths / 12).toFixed(1),
    [inputs.investmentHorizonMonths],
  );

  const updateInput = (
    key: keyof OptimizerInputs,
    value: string | number | boolean,
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value as never }));
    setIsDirty(true);
  };

  const handleCalculate = async () => {
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
  };

  return (
    <CalculatorPageShell
      title="Bond Scenario Ranking"
      description="Run one committed payout-sorting scenario, inspect the ordered outcomes, and keep the result in supporting-reference territory."
      icon={<TrendingUp className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={!!results}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-4">
          <Card className="rounded-2xl border-2 shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-black uppercase tracking-widest">
                Primary Inputs
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                Set one amount, one horizon, and one purchase date. Advanced
                macro and eligibility assumptions stay secondary.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  onCommit={(value) =>
                    updateInput('initialInvestment', value)
                  }
                />
              </div>

              <div className="space-y-3">
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
                  onCommit={(value) =>
                    updateInput('investmentHorizonMonths', value)
                  }
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="purchaseDate"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Purchase date
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={inputs.purchaseDate}
                  onChange={(event) =>
                    updateInput('purchaseDate', event.target.value)
                  }
                  className="rounded-xl"
                />
              </div>

              <Accordion type="single" collapsible defaultValue="">
                <AccordionItem value="advanced" className="border-none">
                  <AccordionTrigger className="rounded-2xl border bg-slate-50 px-4 py-4 hover:no-underline">
                    <div className="space-y-1 text-left">
                      <p className="text-sm font-bold text-slate-950">
                        Advanced Assumptions
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Tax wrapper, family-bond eligibility, and macro settings.
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-5 px-1 pt-4">
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Tax strategy
                      </Label>
                      <Select
                        value={inputs.taxStrategy}
                        onValueChange={(value) =>
                          updateInput('taxStrategy', value)
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TaxStrategy.STANDARD}>
                            {TAX_STRATEGY_LABELS[TaxStrategy.STANDARD]}
                          </SelectItem>
                          <SelectItem value={TaxStrategy.IKE}>
                            {TAX_STRATEGY_LABELS[TaxStrategy.IKE]}
                          </SelectItem>
                          <SelectItem value={TaxStrategy.IKZE}>
                            {TAX_STRATEGY_LABELS[TaxStrategy.IKZE]}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label
                          htmlFor="includeFamilyBonds"
                          className="flex flex-col gap-1"
                        >
                          <span className="font-medium text-foreground">
                            Include family bonds
                          </span>
                          <span className="text-sm font-normal leading-6 text-muted-foreground">
                            ROS and ROD only make sense when the family-bond
                            condition is actually met.
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
                      <p className="text-xs leading-6 text-amber-950">
                        When enabled, this ranking adds{' '}
                        {FAMILY_BOND_TYPES.join(' and ')}. They stay marked as{' '}
                        {getBondSupportMeta(
                          FAMILY_BOND_TYPES[0],
                        ).shortLabel.toLowerCase()}{' '}
                        because eligibility is not universal.
                      </p>
                    </div>

                    <div className="space-y-3">
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
                        onCommit={(value) =>
                          updateInput('expectedInflation', value)
                        }
                      />
                    </div>

                    <div className="space-y-3">
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
                        onCommit={(value) =>
                          updateInput('expectedNbpRate', value)
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button
                className="h-11 w-full rounded-xl font-semibold"
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? 'Running scenario ranking...' : 'Calculate ranking'}
                <ArrowRight className="ml-2 h-4 w-4" />
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
                This page sorts projected payouts for one scenario. It does not
                decide what is best for a real investor and it does not account
                for suitability, liquidity needs, or broader portfolio context.
              </p>
              <p>
                Small assumption changes can reorder the list quickly, especially
                when horizons are short or rollover is required.
              </p>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-6 xl:col-span-8">
          {results && leadingScenario ? (
            <>
              {isDirty ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                  Inputs changed. The ranking below still shows the previous
                  committed scenario. Run the ranking again when you want to
                  refresh it.
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SupportMetric
                  label="Leading payout"
                  value={formatCurrency(leadingScenario.netPayoutValue)}
                  detail={`Highest modeled net payout after ${horizonYears} years.`}
                />
                <SupportMetric
                  label="Leading bond"
                  value={`${leadingScenario.bondType}`}
                  detail={leadingScenario.name}
                />
                <SupportMetric
                  label="Net profit"
                  value={`+${formatCurrency(leadingScenario.totalProfit)}`}
                  detail="Projected profit for the top-ranked scenario."
                />
                <SupportMetric
                  label="ROI"
                  value={formatPercentage(
                    (leadingScenario.totalProfit / inputs.initialInvestment) *
                      100,
                  )}
                  detail="Relative return for the top-ranked scenario."
                />
              </div>

              <Card className="rounded-2xl border shadow-none">
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <ListOrdered className="h-5 w-5 text-primary" />
                        Current leading scenario
                      </CardTitle>
                      <CardDescription className="text-sm leading-6">
                        Highest modeled net payout for this committed scenario.
                      </CardDescription>
                    </div>
                    <div className="rounded-xl border bg-muted/20 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Tax wrapper
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {TAX_STRATEGY_LABELS[inputs.taxStrategy]}
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
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Tax paid
                      </p>
                      <p className="mt-2 text-xl font-semibold text-orange-700">
                        {formatCurrency(leadingScenario.result.totalTax)}
                      </p>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Inflation input
                      </p>
                      <p className="mt-2 text-xl font-semibold text-foreground">
                        {inputs.expectedInflation.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        NBP input
                      </p>
                      <p className="mt-2 text-xl font-semibold text-foreground">
                        {inputs.expectedNbpRate.toFixed(2)}%
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
                    Ordered by projected net payout after {horizonYears} years.
                    This is scenario sorting, not a recommendation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {results.rankedBonds.map((item, index) => {
                    const gapToLead =
                      leadingScenario.netPayoutValue - item.netPayoutValue;

                    return (
                      <div
                        key={item.bondType}
                        className="rounded-2xl border p-4"
                      >
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
            <Card className="rounded-3xl border-2 border-dashed shadow-none">
              <CardContent className="flex min-h-[420px] flex-col items-center justify-center space-y-4 px-8 py-12 text-center">
                <LineChart className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-bold text-slate-950">
                    Ready to rank one scenario?
                  </p>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Set the amount, horizon, and purchase date. Then run one
                    committed ranking to compare modeled payouts across bond
                    types.
                  </p>
                </div>
                <div className="grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                    <p className="text-[10px] font-black uppercase text-slate-600">
                      Default amount
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {formatCurrency(inputs.initialInvestment)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                    <p className="text-[10px] font-black uppercase text-slate-600">
                      Default horizon
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {inputs.investmentHorizonMonths} months
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                    <p className="text-[10px] font-black uppercase text-slate-600">
                      Scope
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      Supporting scenario sorter
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </CalculatorPageShell>
  );
}
