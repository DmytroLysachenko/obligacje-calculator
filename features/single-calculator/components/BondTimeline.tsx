'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalculationResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { Badge } from '@/components/ui/badge';

interface BondTimelineProps {
  results: CalculationResult;
}

export const BondTimeline: React.FC<BondTimelineProps> = ({ results }) => {
  const { t, language } = useLanguage();
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const formatCurrency = (value: number) => {
    if (!hasMounted) return '---';
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    if (!hasMounted) return '---%';
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="w-full overflow-x-auto border rounded-lg bg-card shadow-sm">
      <Table>
        <TableHeader>
            <TableRow className="bg-muted/50">
            <TableHead className="w-[120px]">{t('common.period')}</TableHead>
            <TableHead>{t('bonds.cycle')}</TableHead>
            <TableHead>{t('common.interest_rate')}</TableHead>
            <TableHead>{t('bonds.rate_source')}</TableHead>
            <TableHead>{t('common.nominal_value')}</TableHead>
            <TableHead>{t('common.net_profit')}</TableHead>
            <TableHead>{t('common.real_value')}</TableHead>
            <TableHead className="text-right">{t('bonds.early_exit_payout')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.timeline.map((point) => (
            <TableRow key={point.year} className={point.isWithdrawal ? "bg-primary/5 font-semibold" : ""}>
              <TableCell>
                <div className="flex flex-col">
                  <span>{point.periodLabel}</span>
                  {point.isWithdrawal && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 w-fit border-primary text-primary">
                      {t('bonds.withdrawal')}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{point.cycleIndex}</TableCell>
              <TableCell>{formatPercent(point.interestRate)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{point.rateSource}</span>
                  {typeof point.rateReferenceValue === 'number' && (
                    <span className="text-[10px] text-muted-foreground">
                      ref {formatPercent(point.rateReferenceValue)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatCurrency(point.nominalValueAfterInterest)}</TableCell>
              <TableCell className={point.netProfit >= 0 ? "text-green-600" : "text-destructive"}>
                {formatCurrency(point.netProfit)}
              </TableCell>
              <TableCell className="text-blue-600">
                {formatCurrency(point.realValue)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(point.earlyWithdrawalValue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
