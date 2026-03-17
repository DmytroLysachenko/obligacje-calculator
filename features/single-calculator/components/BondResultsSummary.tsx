'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalculationResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info, HelpCircle } from "lucide-react";

interface BondResultsSummaryProps {
  results: CalculationResult;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

const containerVariant = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300 } }
};

import { Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/shared/utils/csv-export";
import { cn } from "@/lib/utils";

export const BondResultsSummary: React.FC<BondResultsSummaryProps> = ({ results }) => {
  const { t, language } = useLanguage();

  // Analyzer Logic: Check if withdrawal is just before maturity/capitalization
  const isNearMaturity = results.isEarlyWithdrawal && 
    results.timeline.some(p => p.isMaturity && p.year > 0);
  
  const lastPoint = results.timeline[results.timeline.length - 1];
  const nextMilestoneProfit = lastPoint.interestEarned * 0.5; // Rough estimate of lost potential

  const handleExport = () => {
    const csvData = results.timeline.map(p => ({
      Period: p.periodLabel,
      'Interest Rate': `${p.interestRate}%`,
      'Nominal Before': p.nominalValueBeforeInterest.toFixed(2),
      'Interest Earned': p.interestEarned.toFixed(2),
      'Tax Deducted': p.taxDeducted.toFixed(2),
      'Nominal After': p.nominalValueAfterInterest.toFixed(2),
      'Real Value': p.realValue.toFixed(2),
    }));
    exportToCSV(csvData, `bond_simulation_${new Date().toISOString().split('T')[0]}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const initialCapital = results.grossValue - results.totalProfit - results.totalTax - results.totalEarlyWithdrawalFee;
  
  const chartData = [
    { name: t('bonds.initial_investment'), value: Math.max(0, initialCapital) },
    { name: t('common.net_profit'), value: Math.max(0, results.totalProfit) },
    { name: t('bonds.tax'), value: Math.max(0, results.totalTax) },
    { name: t('bonds.early_withdrawal_fee'), value: Math.max(0, results.totalEarlyWithdrawalFee) },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 w-full">
      {isNearMaturity && (
        <Card className="border-orange-200 bg-orange-50/50 shadow-sm animate-pulse">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
            <div className="text-xs text-orange-800">
              <p className="font-bold">Wait! Capitalization Opportunity</p>
              <p>You are withdrawing just before a major interest payout or capitalization. Waiting a few more days could significantly increase your net profit by up to <span className="font-bold">{formatCurrency(nextMilestoneProfit)}</span>.</p>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full"
            variants={containerVariant}
            initial="hidden"
            animate="show"
            key={results.finalNominalValue} // re-trigger animation on result change
          >
            <motion.div variants={itemVariant}>
              <Card className="border-primary/20 shadow-sm h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('bonds.gross_value')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(results.grossValue)}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariant}>
              <Card className="border-green-200 bg-green-50/30 shadow-sm h-full">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold uppercase text-green-700">
                    {t('bonds.net_payout')}
                  </CardTitle>
                  <Popover>
                    <PopoverTrigger>
                      <HelpCircle className="h-3 w-3 text-green-600 cursor-help" />
                    </PopoverTrigger>
                    <PopoverContent className="text-xs p-3 space-y-2">
                      <p className="font-bold">Payout Calculation:</p>
                      <code className="block bg-muted p-1 rounded">Gross Value - Tax - Early Fee</code>
                      <p className="text-muted-foreground italic">The actual cash you get in hand.</p>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(results.netPayoutValue)}
                  </div>
                  {results.isEarlyWithdrawal && (
                    <Badge variant="outline" className="mt-1 text-[10px] border-orange-200 text-orange-700 bg-orange-50">
                      {t('bonds.early_withdrawal')}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariant}>
              <Card className="border-primary/10 shadow-sm h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('common.net_profit')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", results.totalProfit >= 0 ? "text-primary" : "text-destructive")}>
                    {formatCurrency(results.totalProfit)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariant}>
              <Card className="border-destructive/10 shadow-sm h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase text-destructive/70">
                    {t('bonds.fees_and_tax')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-destructive/80">
                    {formatCurrency(results.totalTax + results.totalEarlyWithdrawalFee)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Tax: {formatCurrency(results.totalTax)} | Fee: {formatCurrency(results.totalEarlyWithdrawalFee)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        <Card className="lg:w-80 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="pb-0 pt-4">
            <CardTitle className="text-xs font-bold uppercase text-center text-muted-foreground">Composition</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: ValueType | undefined) => formatCurrency(Number(value || 0))}
                  contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-primary/10">
        <CardHeader className="bg-muted/30 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {t('bonds.calculation_breakdown')}
              <Popover>
                <PopoverTrigger>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm space-y-3">
                  <p className="font-semibold">How we calculate interest:</p>
                  <div className="space-y-2 text-xs">
                    <p><span className="font-medium">Inflation-Indexed:</span> Rate = Inflation + Margin. Applied to Nominal Value.</p>
                    <p><span className="font-medium">Capitalization:</span> Earned interest is added to the principal for the next period.</p>
                    <p><span className="font-medium">Belka Tax:</span> 19% is deducted from interest earned in each period (or at withdrawal for capitalized bonds).</p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
            <CardDescription>{t('bonds.breakdown_desc')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 text-xs">
            <Download className="h-3 w-3" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">{t('common.period')}</TableHead>
                  <TableHead>{t('bonds.nominal_before')}</TableHead>
                  <TableHead>{t('bonds.interest_rate')}</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      {t('bonds.interest_earned')}
                      <Popover>
                        <PopoverTrigger><HelpCircle className="h-3 w-3" /></PopoverTrigger>
                        <PopoverContent className="text-xs">Interest = Nominal × Rate × (Days in Period / Days in Year)</PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                  <TableHead>{t('bonds.tax')}</TableHead>
                  <TableHead className="text-right">{t('bonds.nominal_after')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.timeline.map((point, index) => (
                  <TableRow key={`${point.year}-${point.periodLabel}-${index}`} className={cn(point.isWithdrawal && "bg-primary/5 font-semibold")}>
                    <TableCell>
                      {point.periodLabel}
                      {point.isWithdrawal && (
                        <div className="text-[10px] text-primary font-bold">
                          {t('bonds.withdrawal')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(point.nominalValueBeforeInterest)}</TableCell>
                    <TableCell>{point.interestRate.toFixed(2)}%</TableCell>
                    <TableCell className="text-green-600">+{formatCurrency(point.interestEarned)}</TableCell>
                    <TableCell className="text-red-500">-{formatCurrency(point.taxDeducted)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(point.nominalValueAfterInterest)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
