'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Info,
  LineChart,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import {
  getBondSupportMeta,
  getRetirementSupportNote,
  RETIREMENT_SUPPORTED_BOND_TYPES,
  supportsRetirementBondType,
} from '@/features/bond-core/support-matrix';
import { RetirementPlannerCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { formatCurrency } from '@/lib/utils';

function formatRate(value: number) {
  return `${value.toFixed(2)}%`;
}

type RetirementInputs = {
  initialCapital: number;
  monthlyWithdrawal: number;
  expectedInflation: number;
  expectedNbpRate: number;
  bondType: BondType;
  taxStrategy: TaxStrategy;
  horizonYears: number;
};

const DEFAULT_INPUTS: RetirementInputs = {
  initialCapital: 500000,
  monthlyWithdrawal: 3000,
  expectedInflation: 3.5,
  expectedNbpRate: 5.25,
  bondType: BondType.EDO,
  taxStrategy: TaxStrategy.STANDARD,
  horizonYears: 25,
};

const MODEL_LIMITS = [
  'Uses one steady modeled annual rate rather than changing market paths over time.',
  `Supports only ${RETIREMENT_SUPPORTED_BOND_TYPES.join(', ')} in this reduced-scope surface.`,
  'Does not model changing withdrawals, rolling ladders, or broader retirement advice.',
];

const TAX_STRATEGY_LABELS: Record<TaxStrategy, string> = {
  [TaxStrategy.STANDARD]: 'Standard account (19% tax)',
  [TaxStrategy.IKE]: 'IKE wrapper',
  [TaxStrategy.IKZE]: 'IKZE wrapper',
};

const SummaryMetric = ({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'success' | 'warning';
}) => {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50/70'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50/80'
        : 'border-slate-200 bg-white';

  return (
    <Card className={toneClass}>
      <CardContent className="p-5">
        <p className="text-[10px] font-black uppercase text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
};

const SupportList = ({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) => (
  <Card className="rounded-2xl border shadow-none">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
      {items.length === 0 ? (
        <p>{emptyLabel}</p>
      ) : (
        items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            {item}
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

export const RetirementPlannerContainer: React.FC = () => {
  const { isCalculating, post } = useCalculationRequest();
  const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_INPUTS);
  const [results, setResults] =
    useState<RetirementPlannerCalculationEnvelope | null>(null);

  const handleCalculate = async () => {
    const bondType = supportsRetirementBondType(inputs.bondType)
      ? inputs.bondType
      : BondType.EDO;
    const response = await post<RetirementPlannerCalculationEnvelope>(
      '/api/calculate/retirement',
      {
        ...inputs,
        bondType,
      },
    );
    setResults(response);
  };

  const chartData = useMemo(
    () =>
      results?.result.timeline
        .filter((_, index) => index % 12 === 0)
        .map((point) => ({
          year: point.year,
          date: point.date,
          balance: point.balance,
          withdrawal: point.withdrawal,
        })) ?? [],
    [results],
  );

  const scenarioCoverage = useMemo(() => {
    if (!results) {
      return null;
    }

    const finalMonth = results.result.timeline[results.result.timeline.length - 1];
    if (!finalMonth) {
      return null;
    }

    return `${finalMonth.year}y ${finalMonth.month}m`;
  }, [results]);

  return (
    <CalculatorPageShell
      title="Retirement Withdrawal Model"
      description="Run one narrow withdrawal scenario with explicit assumptions and review the balance path before treating it as planning evidence."
      icon={<Wallet className="h-8 w-8" />}
      isCalculating={isCalculating}
      hasResults={!!results}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-4">
          <Card className="rounded-2xl border-2">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-black uppercase tracking-widest">
                Primary Inputs
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Set capital, withdrawal, horizon, and supported bond family.
                Advanced rate and wrapper assumptions stay collapsed below.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Initial Capital
                </Label>
                <Input
                  type="number"
                  value={inputs.initialCapital}
                  onChange={(event) =>
                    setInputs((prev) => ({
                      ...prev,
                      initialCapital: Number(event.target.value),
                    }))
                  }
                  className="rounded-xl font-bold"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Monthly Withdrawal
                  </Label>
                  <span className="text-xs font-black text-primary">
                    {formatCurrency(inputs.monthlyWithdrawal)}
                  </span>
                </div>
                <CommittedSliderInput
                  value={inputs.monthlyWithdrawal}
                  min={500}
                  max={20000}
                  step={100}
                  unit="PLN"
                  onCommit={(value) =>
                    setInputs((prev) => ({ ...prev, monthlyWithdrawal: value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Scenario Horizon
                  </Label>
                  <span className="text-xs font-black text-primary">
                    {inputs.horizonYears} years
                  </span>
                </div>
                <CommittedSliderInput
                  value={inputs.horizonYears}
                  min={1}
                  max={50}
                  step={1}
                  unit="Y"
                  onCommit={(value) =>
                    setInputs((prev) => ({ ...prev, horizonYears: value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Bond Family
                </Label>
                <Select
                  value={inputs.bondType}
                  onValueChange={(value) =>
                    setInputs((prev) => ({
                      ...prev,
                      bondType: value as BondType,
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETIREMENT_SUPPORTED_BOND_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex flex-col">
                          <span>{type}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {getBondSupportMeta(type).shortLabel}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-muted-foreground">
                  {getRetirementSupportNote(inputs.bondType)}
                </p>
              </div>

              <Accordion type="single" collapsible defaultValue="">
                <AccordionItem value="advanced" className="border-none">
                  <AccordionTrigger className="rounded-2xl border bg-slate-50 px-4 py-4 hover:no-underline">
                    <div className="space-y-1 text-left">
                      <p className="text-sm font-bold text-slate-950">
                        Advanced Assumptions
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Inflation, modeled NBP rate, and tax wrapper.
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-5 px-1 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">
                          Expected Inflation
                        </Label>
                        <span className="text-xs font-black text-primary">
                          {formatRate(inputs.expectedInflation)}
                        </span>
                      </div>
                      <CommittedSliderInput
                        value={inputs.expectedInflation}
                        min={-2}
                        max={15}
                        step={0.1}
                        unit="%"
                        onCommit={(value) =>
                          setInputs((prev) => ({
                            ...prev,
                            expectedInflation: value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">
                          Expected NBP Rate
                        </Label>
                        <span className="text-xs font-black text-primary">
                          {formatRate(inputs.expectedNbpRate)}
                        </span>
                      </div>
                      <CommittedSliderInput
                        value={inputs.expectedNbpRate}
                        min={0}
                        max={15}
                        step={0.05}
                        unit="%"
                        onCommit={(value) =>
                          setInputs((prev) => ({
                            ...prev,
                            expectedNbpRate: value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Tax Wrapper
                      </Label>
                      <Select
                        value={inputs.taxStrategy}
                        onValueChange={(value) =>
                          setInputs((prev) => ({
                            ...prev,
                            taxStrategy: value as TaxStrategy,
                          }))
                        }
                      >
                        <SelectTrigger className="rounded-xl font-bold">
                          <SelectValue />
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button
                className="h-12 w-full rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? 'Calculating...' : 'Calculate withdrawal path'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                Model Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-amber-950">
              {MODEL_LIMITS.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-8 xl:col-span-8">
          {results ? (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <SummaryMetric
                  label="Scenario Status"
                  value={
                    results.result.isSustainable
                      ? 'Balance remains positive'
                      : 'Balance depletes early'
                  }
                  detail={
                    results.result.exhaustionDate
                      ? `Projected exhaustion date: ${results.result.exhaustionDate}`
                      : 'No projected depletion inside the selected horizon.'
                  }
                  tone={results.result.isSustainable ? 'success' : 'warning'}
                />
                <SummaryMetric
                  label="Final Balance"
                  value={formatCurrency(results.result.finalBalance)}
                  detail="Nominal end-of-horizon balance under this one modeled path."
                />
                <SummaryMetric
                  label="Total Withdrawn"
                  value={formatCurrency(results.result.totalWithdrawn)}
                  detail="Cumulative withdrawals inside the selected horizon."
                />
                <SummaryMetric
                  label="Modeled Annual Rate"
                  value={formatRate(results.result.modeledAnnualRate)}
                  detail={`Steady rate used for ${results.result.modeledBondType}.`}
                />
              </div>

              <Card className="rounded-2xl border-2 shadow-none">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
                    <LineChart className="h-5 w-5 text-primary" />
                    Balance Path
                  </CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">
                    This chart shows the committed scenario only. It is sampled
                    yearly to keep the path readable.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase text-slate-600">
                        Coverage
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {scenarioCoverage ?? `${inputs.horizonYears} years`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase text-slate-600">
                        Tax Wrapper
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {TAX_STRATEGY_LABELS[inputs.taxStrategy]}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase text-slate-600">
                        Tax Paid
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {formatCurrency(results.result.totalTaxPaid)}
                      </p>
                    </div>
                  </div>

                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="retirement-balance"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--muted-foreground))"
                          strokeOpacity={0.1}
                        />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 'bold' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 'bold' }}
                          tickFormatter={(value) =>
                            `${(value / 1000).toFixed(0)}k`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          }}
                          formatter={(value, key) => [
                            formatCurrency(Number(value || 0)),
                            key === 'balance' ? 'Balance' : 'Withdrawal',
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#retirement-balance)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <SupportList
                  title="Scenario Assumptions"
                  items={results.assumptions}
                  emptyLabel="No extra assumptions were reported beyond the visible inputs."
                />
                <SupportList
                  title="Warnings and Notes"
                  items={[
                    ...results.warnings,
                    ...results.calculationNotes,
                    ...results.dataQualityFlags,
                  ]}
                  emptyLabel="No extra warnings were returned for this scenario."
                />
              </div>
            </>
          ) : (
            <Card className="rounded-3xl border-2 border-dashed shadow-none">
              <CardContent className="flex min-h-[420px] flex-col items-center justify-center space-y-4 px-8 py-12 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-bold text-slate-950">
                    Ready to test one withdrawal path?
                  </p>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                    Set the starting capital, withdrawal amount, horizon, and
                    supported bond family. Then run one committed calculation
                    before reading the balance path.
                  </p>
                </div>
                <div className="grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                    <p className="text-[10px] font-black uppercase text-slate-600">
                      Default capital
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {formatCurrency(inputs.initialCapital)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                    <p className="text-[10px] font-black uppercase text-slate-600">
                      Default withdrawal
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {formatCurrency(inputs.monthlyWithdrawal)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                    <p className="text-[10px] font-black uppercase text-slate-600">
                      Model type
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      Steady-rate depletion
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900">
                <Info className="h-4 w-4 text-primary" />
                Supported Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Uses supported bond families only and narrows unsupported choices
                back to EDO during calculation.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Withdrawal amounts stay fixed through the run and do not react to
                changing inflation or spending needs.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Treat this as a supporting scenario model, not a retirement advice
                engine or a complete spending plan.
              </div>
            </CardContent>
          </Card>

          {results?.result.exhaustionDate ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p>
                This run projects depletion on {results.result.exhaustionDate}.
                Re-run with a lower withdrawal, longer horizon check, or different
                supported bond family before drawing conclusions.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </CalculatorPageShell>
  );
};
