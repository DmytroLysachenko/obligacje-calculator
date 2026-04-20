'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalculationResult, BondInputs, BondType, TaxStrategy } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { convertTimelineToCSV, downloadFile } from '@/shared/lib/csv-utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle, Download, AlertTriangle, TrendingUp, PiggyBank, Info, Sparkles, Lightbulb, FileSpreadsheet } from "lucide-react";
import { CalculationAuditTrace } from './CalculationAuditTrace';
import { MathDeepDive } from '@/shared/components/MathDeepDive';

interface BondResultsSummaryProps {
  results: CalculationResult;
  inputs: BondInputs;
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

const StrategyHints: React.FC<{ results: CalculationResult; inputs: BondInputs }> = ({ results, inputs }) => {
  const { t, language } = useLanguage();
  
  const hints: React.ReactNode[] = [];
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const horizonYears = (inputs.investmentHorizonMonths || 0) / 12;

  // 1. COI vs EDO
  if (inputs.bondType === BondType.COI && horizonYears > 4.5) {
    hints.push(
      <div key="edo_better" className="flex items-start gap-3 text-sm">
        <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <p>{t('strategy_hints.edo_better_than_coi')}</p>
      </div>
    );
  } else if (inputs.bondType === BondType.EDO && horizonYears > 0 && horizonYears < 4) {
    hints.push(
      <div key="coi_better" className="flex items-start gap-3 text-sm">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <p>{t('strategy_hints.coi_better_than_edo_short')}</p>
      </div>
    );
  }

  // 2. Tax Efficiency
  if (inputs.taxStrategy === TaxStrategy.STANDARD && results.totalTax > 500) {
    hints.push(
      <div key="tax_ike" className="flex items-start gap-3 text-sm">
        <PiggyBank className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        <p>{t('strategy_hints.tax_efficiency_ike', { amount: formatCurrency(results.totalTax) })}</p>
      </div>
    );
  }

  // 3. OTS Repeated
  if (inputs.bondType === BondType.OTS && (inputs.rollover || inputs.isRebought)) {
    hints.push(
      <div key="ots_repeated" className="flex items-start gap-3 text-sm">
        <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p>{t('strategy_hints.ots_repeated')}</p>
      </div>
    );
  }

  // 4. Diversification
  if (results.totalProfit > 0 && !inputs.bondType.includes('COI') && !inputs.bondType.includes('EDO') && !inputs.bondType.includes('ROS') && !inputs.bondType.includes('ROD')) {
    hints.push(
      <div key="diversify" className="flex items-start gap-3 text-sm">
        <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <p>{t('strategy_hints.diversification_hint')}</p>
      </div>
    );
  }

  // 5. IKE Limit Warning
  if (inputs.useTaxWrapperLimit && results.overflowInfo && results.overflowInfo.amountInStandard > 0) {
    hints.push(
      <div key="ike_limit" className="flex items-start gap-3 text-sm">
        <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
        <p>{t('strategy_hints.ike_limit_warning')}</p>
      </div>
    );
  }

  if (hints.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm border-2 overflow-hidden">
      <CardHeader className="pb-2 border-b border-primary/10 bg-primary/10 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-[10px] font-black uppercase text-primary tracking-widest">{t('strategy_hints.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {hints.map((hint, idx) => (
          <div key={idx} className={cn(idx !== hints.length - 1 && "pb-4 border-b border-primary/5")}>
            {hint}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const BondResultsSummary: React.FC<BondResultsSummaryProps> = ({ results, inputs }) => {
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

  const handleExportCSV = () => {
    const headers = {
      period: t('bonds.calculation_trace.header_year'),
      capital: t('bonds.calculation_trace.header_capital'),
      rate: t('bonds.calculation_trace.header_rate'),
      interest: t('bonds.calculation_trace.header_interest'),
      tax: t('bonds.calculation_trace.header_tax'),
      nominalValue: t('bonds.calculation_trace.header_value_after'),
      realValue: t('bonds.inflation_adjusted'),
    };
    const csv = convertTimelineToCSV(results.timeline, headers);
    downloadFile(csv, `bond_simulation_${inputs.bondType}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
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
      <StrategyHints results={results} inputs={inputs} />

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
                      <MathDeepDive 
                        results={results} 
                        trigger={
                          <button className="group">
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help group-hover:text-primary transition-colors" />
                          </button>
                        } 
                      />
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
                      <MathDeepDive 
                        results={results} 
                        trigger={
                          <button className="group">
                            <Info className="h-3.5 w-3.5 text-green-600 cursor-help group-hover:text-green-800 transition-colors" />
                          </button>
                        } 
                      />
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
                      <MathDeepDive 
                        results={results} 
                        trigger={
                          <button className="group">
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help group-hover:text-primary transition-colors" />
                          </button>
                        } 
                      />
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
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleExportCSV}
              variant="outline" 
              className="rounded-xl font-bold gap-2 text-[10px] uppercase tracking-widest border-2 py-6 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>
            <Button 
              disabled
              variant="outline" 
              className="rounded-xl font-bold gap-2 text-[10px] uppercase tracking-widest border-2 py-6"
            >
              <Download className="h-4 w-4" />
              {t('common.share') || "Share"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
