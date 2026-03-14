'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { 
  Wallet, 
  TrendingUp, 
  ShieldCheck,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/shared/utils/csv-export";

interface RegularInvestmentResultsSummaryProps {
  results: RegularInvestmentResult;
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

export const RegularInvestmentResultsSummary: React.FC<RegularInvestmentResultsSummaryProps> = ({ results }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pl' ? pl : enGB;

  const handleExport = () => {
    const csvData = results.lots.map((l, i) => ({
      Lot: i + 1,
      'Purchase Date': l.purchaseDate.split('T')[0],
      'Maturity Date': l.maturityDate.split('T')[0],
      Status: l.isMatured ? 'Matured' : 'Active',
      Invested: l.investedAmount.toFixed(2),
      'Accumulated Interest': l.accumulatedInterest.toFixed(2),
      Tax: l.tax.toFixed(2),
      'Redemption Fee': l.earlyWithdrawalFee.toFixed(2),
      'Net Value': l.netValue.toFixed(2),
    }));
    exportToCSV(csvData, `regular_investment_${new Date().toISOString().split('T')[0]}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const chartData = [
    { name: t('bonds.total_invested'), value: Math.max(0, results.totalInvested) },
    { name: t('common.net_profit'), value: Math.max(0, results.totalProfit) },
    { name: t('bonds.tax'), value: Math.max(0, results.totalTax) },
    { name: t('bonds.early_withdrawal_fee'), value: Math.max(0, results.totalEarlyWithdrawalFees) },
  ].filter(d => d.value > 0);

  const cards = [
    {
      title: t('bonds.total_invested'),
      value: formatCurrency(results.totalInvested),
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: t('bonds.final_nominal_value'),
      value: formatCurrency(results.finalNominalValue),
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      title: t('bonds.total_net_profit'),
      value: formatCurrency(results.totalProfit),
      icon: ArrowUpRight,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      title: t('bonds.real_value_inflation'),
      value: formatCurrency(results.finalRealValue),
      icon: ShieldCheck,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    }
  ];

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full"
            variants={containerVariant}
            initial="hidden"
            animate="show"
            key={results.totalInvested}
          >
            {cards.map((card, index) => (
              <motion.div key={index} variants={itemVariant}>
                <Card className="overflow-hidden border-primary/10 shadow-sm h-full">
                  <CardContent className="p-6 flex flex-col h-full justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${card.bg}`}>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        {card.title}
                      </span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight">
                      {card.value}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <Card className="lg:w-80 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="pb-0 pt-4">
            <CardTitle className="text-xs font-bold uppercase text-center text-muted-foreground">Portfolio Composition</CardTitle>
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">{t('bonds.investment_lots')}</CardTitle>
            <CardDescription>{t('bonds.lots_desc')}</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 text-xs">
              <Download className="h-3 w-3" />
              Export CSV
            </Button>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">{t('bonds.total_fees_and_tax')}</div>
              <div className="text-sm font-bold text-destructive">
                {formatCurrency(results.totalTax + results.totalEarlyWithdrawalFees)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>{t('bonds.purchase_date')}</TableHead>
                  <TableHead>{t('bonds.maturity_date')}</TableHead>
                  <TableHead>{t('bonds.status')}</TableHead>
                  <TableHead className="text-right">{t('bonds.invested')}</TableHead>
                  <TableHead className="text-right">{t('bonds.interest')}</TableHead>
                  <TableHead className="text-right">{t('bonds.tax_and_fees')}</TableHead>
                  <TableHead className="text-right">{t('bonds.net_value')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.lots.map((lot, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs">
                      {format(parseISO(lot.purchaseDate), 'MMM yyyy', { locale: dateLocale })}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(parseISO(lot.maturityDate), 'MMM yyyy', { locale: dateLocale })}
                    </TableCell>
                    <TableCell>
                      {lot.isMatured ? (
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                          {t('bonds.matured')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                          {t('bonds.active')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs">{formatCurrency(lot.investedAmount)}</TableCell>
                    <TableCell className="text-right text-xs text-green-600">+{formatCurrency(lot.accumulatedInterest)}</TableCell>
                    <TableCell className="text-right text-xs text-red-500">-{formatCurrency(lot.tax + lot.earlyWithdrawalFee)}</TableCell>
                    <TableCell className="text-right text-sm font-bold">{formatCurrency(lot.netValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 flex gap-3">
        <Info className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('bonds.regular_calc_info')}
        </p>
      </div>
    </div>
  );
};
