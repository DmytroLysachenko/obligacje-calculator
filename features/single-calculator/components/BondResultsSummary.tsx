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
import { Info, HelpCircle, Download, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/shared/utils/csv-export";
import { cn } from "@/lib/utils";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";

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
        <Card className="border-orange-200 bg-orange-50/50 shadow-sm animate-pulse border-2">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
            <div className="text-xs text-orange-800 font-medium">
              <p className="font-black uppercase tracking-widest mb-1">{t('bonds.wait_capitalization')}</p>
              <p className="leading-relaxed">{t('bonds.wait_capitalization_desc', { amount: formatCurrency(nextMilestoneProfit) })}</p>
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
              <Card className="border-primary/20 shadow-sm h-full overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    {t('bonds.gross_value')}
                  </CardTitle>
                  <Popover>
                    <PopoverTrigger>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </PopoverTrigger>
                    <PopoverContent className="text-xs p-3 space-y-2">
                      <p className="font-bold">{t('bonds.gross_value')}:</p>
                      <p>{t('bonds.gross_value_desc') || "Total value before any taxes and fees are deducted."}</p>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-slate-800">{formatCurrency(results.grossValue)}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariant}>
              <Card className="border-green-200 bg-green-50/30 shadow-sm h-full overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-black uppercase text-green-700 tracking-widest">
                    {t('bonds.net_payout')}
                  </CardTitle>
                  <Popover>
                    <PopoverTrigger>
                      <HelpCircle className="h-3 w-3 text-green-600 cursor-help" />
                    </PopoverTrigger>
                    <PopoverContent className="text-xs p-3 space-y-2">
                      <p className="font-bold">{t('bonds.payout_calculation')}:</p>
                      <code className="block bg-muted p-1 rounded font-mono text-[10px]">Gross Value - Tax - Early Fee</code>
                      <p className="text-muted-foreground italic leading-relaxed">{t('bonds.actual_cash_in_hand')}</p>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-green-700">
                    {formatCurrency(results.netPayoutValue)}
                  </div>
                  {results.isEarlyWithdrawal && (
                    <Badge variant="outline" className="mt-1 text-[10px] border-orange-200 text-orange-700 bg-orange-50 font-black uppercase tracking-tighter">
                      {t('bonds.early_withdrawal')}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariant}>
              <Card className="border-primary/10 shadow-sm h-full overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    {t('common.net_profit')}
                  </CardTitle>
                  <Popover>
                    <PopoverTrigger>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </PopoverTrigger>
                    <PopoverContent className="text-xs p-3 space-y-2">
                      <p className="font-bold">{t('common.net_profit')}:</p>
                      <p>{t('bonds.net_profit_desc') || "Your total earnings after paying all taxes and potential early withdrawal fees."}</p>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-black", results.totalProfit >= 0 ? "text-primary" : "text-destructive")}>
                    {formatCurrency(results.totalProfit)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-widest">
                    {results.totalProfit >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                    ROI: {((results.totalProfit / results.initialInvestment) * 100).toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariant}>
              <Card className="border-destructive/10 bg-destructive/5 shadow-sm h-full overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-black uppercase text-destructive/70 tracking-widest">
                    {t('bonds.fees_and_tax')}
                  </CardTitle>
                  <Popover>
                    <PopoverTrigger>
                      <HelpCircle className="h-3 w-3 text-destructive/40 cursor-help" />
                    </PopoverTrigger>
                    <PopoverContent className="text-xs p-3 space-y-2">
                      <p className="font-bold">{t('bonds.fees_and_tax')}:</p>
                      <div className="space-y-1 mt-1 font-medium">
                        <div className="flex justify-between gap-4">
                          <span>{t('bonds.tax')}:</span>
                          <span className="font-bold">{formatCurrency(results.totalTax)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>{t('bonds.early_withdrawal_fee')}:</span>
                          <span className="font-bold text-orange-600">{formatCurrency(results.totalEarlyWithdrawalFee)}</span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-black text-destructive/80">
                    {formatCurrency(results.totalTax + results.totalEarlyWithdrawalFee)}
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 mt-1 tracking-tighter">
                    {t('bonds.tax_fee_breakdown', {
                      tax: formatCurrency(results.totalTax),
                      fee: formatCurrency(results.totalEarlyWithdrawalFee),
                    })}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        <Card className="lg:w-80 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="pb-0 pt-4 bg-muted/10 border-b border-dashed">
            <CardTitle className="text-[10px] font-black uppercase text-center text-muted-foreground tracking-widest pb-3">{t('bonds.composition')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-64">
            <ChartContainer height={256}>
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
                    contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', paddingBottom: '15px', fontWeight: 'black', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-primary/10 border-2">
        <CardHeader className="bg-muted/30 flex flex-row items-center justify-between space-y-0 border-b">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2 font-black uppercase tracking-tight">
              {t('bonds.calculation_breakdown')}
              <Popover>
                <PopoverTrigger>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                </PopoverTrigger>
                <PopoverContent className="w-80 text-xs space-y-3 font-medium">
                  <p className="font-black uppercase tracking-widest text-primary">{t('bonds.how_interest_works')}</p>
                  <div className="space-y-2 text-muted-foreground leading-relaxed">
                    <p>{t('bonds.interest_indexed_desc')}</p>
                    <p>{t('bonds.capitalization_desc')}</p>
                    <p>{t('bonds.belka_desc')}</p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('bonds.breakdown_desc')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 text-[10px] font-black uppercase border-2 h-9 px-4 hover:bg-primary hover:text-white transition-all">
            <Download className="h-3.5 w-3.5" />
            {t('comparison.export')}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                  <TableHead className="w-[100px] md:w-[120px] text-[10px] font-black uppercase tracking-widest">{t('common.period')}</TableHead>
                  <TableHead className="hidden md:table-cell text-[10px] font-black uppercase tracking-widest">{t('bonds.nominal_before')}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('bonds.interest_rate')}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      {t('bonds.interest_earned')}
                    </div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-[10px] font-black uppercase tracking-widest">{t('bonds.tax')}</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">{t('bonds.nominal_after')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.timeline.map((point, index) => (
                  <TableRow key={`${point.year}-${point.periodLabel}-${index}`} className={cn("hover:bg-muted/20 border-b transition-colors", point.isWithdrawal && "bg-primary/5 font-bold")}>
                    <TableCell className="font-bold py-4 text-xs md:text-sm">
                      {point.periodLabel}
                      {point.isWithdrawal && (
                        <div className="text-[9px] text-primary font-black uppercase mt-0.5">
                          {t('bonds.withdrawal')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-medium text-slate-600 text-xs">{formatCurrency(point.nominalValueBeforeInterest)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-black text-[9px] md:text-[10px] bg-slate-100 text-slate-700 border-none px-1 md:px-2">
                        {point.interestRate.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-600 font-bold text-xs md:text-sm">+{formatCurrency(point.interestEarned)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-red-500/80 font-medium text-xs">-{formatCurrency(point.taxDeducted)}</TableCell>
                    <TableCell className="text-right font-black text-slate-800 text-xs md:text-sm">
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
