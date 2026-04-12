'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalculationResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/shared/utils/csv-export';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle, Download, AlertTriangle, TrendingUp, PiggyBank, Info } from "lucide-react";
import { CalculationAuditTrace } from './CalculationAuditTrace';

interface BondResultsSummaryProps {
  results: CalculationResult;
}

const containerVariant = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariant = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export const BondResultsSummary: React.FC<BondResultsSummaryProps> = ({ results }) => {
  const { t, language } = useLanguage();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const hasTaxSavings = results.taxSavings && results.taxSavings > 0;
  const comparisonData = hasTaxSavings ? [
    {
      name: t('bonds.wrapper_profit'),
      profit: results.totalProfit,
      fill: '#10b981'
    },
    {
      name: t('bonds.standard_profit'),
      profit: results.totalProfit - (results.taxSavings || 0),
      fill: '#64748b'
    }
  ] : [];

  // Analyzer Logic: Check if withdrawal is just before maturity/capitalization
  const isNearMaturity = results.isEarlyWithdrawal && 
    results.timeline.some(p => p.isMaturity && p.year > 0);
  
  const lastPoint = results.timeline[results.timeline.length - 1];
  const nextMilestoneProfit = lastPoint?.interestEarned * 0.5 || 0; 

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

  const initialCapital = results.grossValue - results.totalProfit - results.totalTax - results.totalEarlyWithdrawalFee;
  
  const chartData = [
    { name: t('bonds.initial_investment'), value: Math.max(0, initialCapital) },
    { name: t('common.net_profit'), value: Math.max(0, results.totalProfit) },
    { name: t('bonds.tax'), value: Math.max(0, results.totalTax) },
    { name: t('bonds.early_withdrawal_fee'), value: Math.max(0, results.totalEarlyWithdrawalFee) },
  ].filter(d => d.value > 0);

  const COLORS = ['#e2e8f0', '#3b82f6', '#f43f5e', '#f59e0b'];

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

      {hasTaxSavings && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-green-200 bg-green-50/30 shadow-sm border-2 overflow-hidden">
            <CardHeader className="pb-2 border-b border-green-100 bg-green-100/20">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-green-600" />
                <CardTitle className="text-[10px] font-black uppercase text-green-700 tracking-widest">{t('bonds.standard_comparison')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-full h-32 md:w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical" margin={{ left: -20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        formatter={(val: ValueType | undefined) => formatCurrency(Number(val || 0))} 
                        cursor={{ fill: 'transparent' }} 
                      />
                      <Bar dataKey="profit" radius={[0, 4, 4, 0]} barSize={20}>
                        {comparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-bold text-green-800">
                    {t('bonds.savings_notice', { amount: formatCurrency(results.taxSavings || 0) })}
                  </p>
                  <p className="text-[10px] text-green-700/70 italic leading-tight">
                    {t('bonds.belka_desc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-600 bg-green-600 shadow-lg flex flex-col items-center justify-center text-white p-6">
            <TrendingUp className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('bonds.tax_saved')}</p>
            <p className="text-3xl font-black">{formatCurrency(results.taxSavings || 0)}</p>
          </Card>
        </div>
      )}

      {results.overflowInfo && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm border-2">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="text-xs text-blue-800 font-medium">
              <p className="font-black uppercase tracking-widest mb-1">{t('bonds.use_tax_limit')}</p>
              <p className="leading-relaxed">
                {formatCurrency(results.overflowInfo.amountInWrapper)} in wrapper + 
                {formatCurrency(results.overflowInfo.amountInStandard)} overflow in standard account.
                Tax paid on overflow: {formatCurrency(results.overflowInfo.standardTaxDeducted)}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full"
                variants={containerVariant}
                initial="hidden"
                animate="show"
                key={results.finalNominalValue}
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
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariant}>
                  <Card className="border-blue-100 bg-blue-50/20 shadow-sm h-full overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-[10px] font-black uppercase text-blue-700 tracking-widest">
                        {t('bonds.real_cagr')}
                      </CardTitle>
                      <Popover>
                        <PopoverTrigger>
                          <HelpCircle className="h-3 w-3 text-blue-600 cursor-help" />
                        </PopoverTrigger>
                        <PopoverContent className="text-xs p-3 space-y-2">
                          <p className="font-bold">{t('bonds.real_cagr')}:</p>
                          <p>{t('bonds.real_cagr_desc')}</p>
                        </PopoverContent>
                      </Popover>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-black text-blue-800">
                        {results.realAnnualizedReturn.toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>

            <div className="hidden lg:block w-[200px]">
              <Card className="border-none shadow-none bg-transparent h-full flex flex-col justify-center">
                <CardContent className="p-0 h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(val: ValueType | undefined) => formatCurrency(Number(val || 0))}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {results.timeline.length > 0 && (
            <CalculationAuditTrace 
              point={results.timeline[0]} 
              initialInvestment={results.initialInvestment} 
            />
          )}
          
          <Button 
            onClick={handleExport}
            variant="outline" 
            className="w-full rounded-xl font-bold gap-2 text-xs uppercase tracking-widest border-2 py-6"
          >
            <Download className="h-4 w-4" />
            {t('common.share') || "Export Results"}
          </Button>
        </div>
      </div>
    </div>
  );
};
