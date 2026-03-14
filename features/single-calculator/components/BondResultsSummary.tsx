'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalculationResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { Badge } from '@/components/ui/badge';

interface BondResultsSummaryProps {
  results: CalculationResult;
}

export const BondResultsSummary: React.FC<BondResultsSummaryProps> = ({ results }) => {
  const { t, language } = useLanguage();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              {t('bonds.gross_value')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(results.grossValue)}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-green-700">
              {t('bonds.net_payout')}
            </CardTitle>
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

        <Card className="border-primary/10 shadow-sm">
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

        <Card className="border-destructive/10 shadow-sm">
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
      </div>

      <Card className="overflow-hidden border-primary/10">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">{t('bonds.calculation_breakdown')}</CardTitle>
          <CardDescription>{t('bonds.breakdown_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">{t('common.period')}</TableHead>
                  <TableHead>{t('bonds.nominal_before')}</TableHead>
                  <TableHead>{t('bonds.interest_rate')}</TableHead>
                  <TableHead>{t('bonds.interest_earned')}</TableHead>
                  <TableHead>{t('bonds.tax')}</TableHead>
                  <TableHead className="text-right">{t('bonds.nominal_after')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.timeline.map((point) => (
                  <TableRow key={point.year} className={cn(point.isWithdrawal && "bg-primary/5 font-semibold")}>
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

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
