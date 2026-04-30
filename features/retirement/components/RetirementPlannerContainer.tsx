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
import { RetirementPlannerCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { formatCurrency } from '@/lib/utils';

function formatRate(value: number) {
  return `${value.toFixed(2)}%`;
}

export const RetirementPlannerContainer: React.FC = () => {
  const { isCalculating, post } = useCalculationRequest();
  const [inputs, setInputs] = useState({
    initialCapital: 500000,
    monthlyWithdrawal: 3000,
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    bondType: BondType.EDO,
    taxStrategy: TaxStrategy.STANDARD,
    horizonYears: 25,
  });
  const [results, setResults] =
    useState<RetirementPlannerCalculationEnvelope | null>(null);

  const handleCalculate = async () => {
    const response = await post<RetirementPlannerCalculationEnvelope>(
      '/api/calculate/retirement',
      inputs,
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

  return (
    <CalculatorPageShell
      title="Retirement Withdrawal Calculator"
      description="Test whether a fixed monthly withdrawal can be supported by one simplified bond-rate scenario."
      icon={<Wallet className="h-8 w-8" />}
      isCalculating={isCalculating}
      hasResults={!!results}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-4">
          <Card className="rounded-2xl border-2">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-widest">
                Scenario Inputs
              </CardTitle>
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
                    Horizon
                  </Label>
                  <span className="text-xs font-black text-primary">
                    {inputs.horizonYears}Y
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

              <div className="grid grid-cols-1 gap-4 border-t pt-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Bond Type
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
                      {Object.values(BondType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Tax Strategy
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
                        Standard
                      </SelectItem>
                      <SelectItem value={TaxStrategy.IKE}>IKE</SelectItem>
                      <SelectItem value={TaxStrategy.IKZE}>IKZE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
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
                      setInputs((prev) => ({ ...prev, expectedInflation: value }))
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
                      setInputs((prev) => ({ ...prev, expectedNbpRate: value }))
                    }
                  />
                </div>
              </div>

              <Button
                className="h-12 w-full rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? 'Calculating...' : 'Run Withdrawal Scenario'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                Model Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-amber-900">
              <p>
                This is a steady-rate depletion model, not a full retirement
                planner.
              </p>
              <p>
                It does not model changing withdrawals, reinvestment ladders,
                taxes outside the selected wrapper, or shifting bond series over
                time.
              </p>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-8 xl:col-span-8">
          {results ? (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <Card className={results.result.isSustainable ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'}>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">
                      Scenario Status
                    </p>
                    <p className="mt-2 text-lg font-black">
                      {results.result.isSustainable
                        ? 'Capital remains positive'
                        : 'Capital depletes early'}
                    </p>
                    {results.result.exhaustionDate ? (
                      <p className="mt-1 text-xs font-semibold text-red-700">
                        Exhaustion date: {results.result.exhaustionDate}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        No depletion inside selected horizon
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">
                      Final Balance
                    </p>
                    <p className="mt-2 text-lg font-black text-primary">
                      {formatCurrency(results.result.finalBalance)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      End-of-horizon nominal balance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">
                      Modeled Annual Rate
                    </p>
                    <p className="mt-2 text-lg font-black text-primary">
                      {formatRate(results.result.modeledAnnualRate)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Steady rate used for {results.result.modeledBondType}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">
                      Tax Paid
                    </p>
                    <p className="mt-2 text-lg font-black text-orange-600">
                      {formatCurrency(results.result.totalTaxPaid)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Within modeled horizon
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl border-2 overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
                    <LineChart className="h-5 w-5 text-primary" />
                    Capital Path
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="retirement-balance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1} />
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
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-700">
                      Total Withdrawn
                    </p>
                    <p className="text-sm font-bold">
                      {formatCurrency(results.result.totalWithdrawn)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-700">
                      Scenario Horizon
                    </p>
                    <p className="text-sm font-bold">{inputs.horizonYears} years</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-700">
                      Model Type
                    </p>
                    <p className="text-sm font-bold">Steady-rate depletion</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-[500px] flex-col items-center justify-center space-y-4 rounded-3xl border-2 border-dashed opacity-60">
              <Wallet className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">
                Build a scenario and run the withdrawal calculation.
              </p>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
};
