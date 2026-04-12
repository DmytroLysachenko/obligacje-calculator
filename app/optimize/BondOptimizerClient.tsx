'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, Info } from 'lucide-react';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { BondOptimizerCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { TaxStrategy } from '@/features/bond-core/types';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { toDateString } from '@/shared/lib/date-timing';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { isCalculating, post } = useCalculationRequest();

  const handleCalculate = useCallback(async () => {
    try {
      const data = await post<BondOptimizerCalculationEnvelope>('/api/calculate/optimize', inputs);
      setEnvelope(data);
    } catch (error) {
      console.error('Optimization error:', error);
    }
  }, [inputs, post]);

  const updateInput = (key: string, value: string | number | boolean) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const results = envelope?.result;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Inputs Column */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Investment Goals</CardTitle>
            <CardDescription>What are you aiming for?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initialInvestment">Amount to Invest (PLN)</Label>
              <Input
                id="initialInvestment"
                type="number"
                value={inputs.initialInvestment}
                onChange={(e) => updateInput('initialInvestment', Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentHorizonMonths">Duration (Months)</Label>
              <Input
                id="investmentHorizonMonths"
                type="number"
                value={inputs.investmentHorizonMonths}
                onChange={(e) => updateInput('investmentHorizonMonths', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                {(inputs.investmentHorizonMonths / 12).toFixed(1)} years
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={inputs.purchaseDate}
                onChange={(e) => updateInput('purchaseDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxStrategy">Tax Strategy</Label>
              <Select
                value={inputs.taxStrategy}
                onValueChange={(v) => updateInput('taxStrategy', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaxStrategy.STANDARD}>Standard (19% Belka)</SelectItem>
                  <SelectItem value={TaxStrategy.IKE}>IKE (0% Tax)</SelectItem>
                  <SelectItem value={TaxStrategy.IKZE}>IKZE (Tax Relief)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2 pt-2">
              <Label htmlFor="includeFamilyBonds" className="flex flex-col gap-1">
                <span>Include Family Bonds</span>
                <span className="font-normal text-xs text-muted-foreground">ROS/ROD (requires 800+)</span>
              </Label>
              <Switch
                id="includeFamilyBonds"
                checked={inputs.includeFamilyBonds}
                onCheckedChange={(v) => updateInput('includeFamilyBonds', v)}
              />
            </div>

            <Button 
              className="w-full mt-4" 
              onClick={handleCalculate}
              disabled={isCalculating}
            >
              {isCalculating ? 'Simulating...' : 'Find Best Bond'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Market Assumptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expectedInflation">Expected Inflation (%)</Label>
              <Input
                id="expectedInflation"
                type="number"
                step="0.1"
                value={inputs.expectedInflation}
                onChange={(e) => updateInput('expectedInflation', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedNbpRate">Expected NBP Rate (%)</Label>
              <Input
                id="expectedNbpRate"
                type="number"
                step="0.1"
                value={inputs.expectedNbpRate}
                onChange={(e) => updateInput('expectedNbpRate', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Column */}
      <div className="lg:col-span-2 space-y-6">
        {isCalculating ? (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : results ? (
          <>
            {/* The Winner */}
            <Card className="border-primary bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="default" className="mb-2 bg-primary text-primary-foreground">
                      <Award className="w-3 h-3 mr-1" /> Best Choice
                    </Badge>
                    <CardTitle className="text-2xl">{results.winner.name} ({results.winner.bondType})</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estimated Net Payout</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(results.winner.netPayoutValue)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-background/50 rounded-lg p-4 mb-4 border border-primary/10">
                  <p className="text-sm flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 text-primary" />
                    <span>{results.winner.recommendationReason}</span>
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Net Profit</p>
                    <p className="font-semibold text-green-600">+{formatCurrency(results.winner.totalProfit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Total ROI</p>
                    <p className="font-semibold">
                      {formatPercentage((results.winner.totalProfit / inputs.initialInvestment) * 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Tax Paid</p>
                    <p className="font-semibold text-orange-600">
                      {formatCurrency(results.winner.result.totalTax)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Options Ranking */}
            <Card>
              <CardHeader>
                <CardTitle>Ranked Options</CardTitle>
                <CardDescription>Comparison based on your {inputs.investmentHorizonMonths} months horizon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.rankedBonds.map((item, index) => (
                    <div 
                      key={item.bondType} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.recommendationReason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(item.netPayoutValue)}</p>
                        <p className={`text-xs font-medium ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                          {index === 0 ? 'Top' : `-${formatCurrency(results.winner.netPayoutValue - item.netPayoutValue)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Ready to optimize your investment?</p>
            <p className="text-sm">Adjust your goals and click &quot;Find Best Bond&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
