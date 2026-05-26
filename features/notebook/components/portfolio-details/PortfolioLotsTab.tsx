'use client';

import React from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { UserInvestmentLot } from '@/db/schema';
import { BondType } from '@/features/bond-core/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';

type PortfolioMaturityItem = UserInvestmentLot & {
  maturityDate: Date;
  value: number;
};

type PortfolioLotsTabProps = {
  isLoading: boolean;
  lots: UserInvestmentLot[];
  definitions: Record<BondType, BondDefinition>;
  language: 'en' | 'pl';
  formatCurrency: (value: number) => string;
  maturityWindowDays: 30 | 90 | 180;
  onWindowChange: (value: 30 | 90 | 180) => void;
  filteredMaturities: PortfolioMaturityItem[];
  upcomingCashflow: number;
  maturityWindowLabel: string;
  t: (key: string, values?: Record<string, string>) => string;
};

export function PortfolioLotsTab({
  isLoading,
  lots,
  definitions,
  language,
  formatCurrency,
  maturityWindowDays,
  onWindowChange,
  filteredMaturities,
  upcomingCashflow,
  maturityWindowLabel,
  t,
}: PortfolioLotsTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <Card className="rounded-2xl border shadow-none">
        <CardHeader>
          <CardTitle>{t('notebook.stored_lots_title')}</CardTitle>
          <CardDescription>{t('notebook.stored_lots_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('notebook.updating')}
            </div>
          ) : lots.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">{t('notebook.no_lots')}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                <p>{t('notebook.stored_lots_hint')}</p>
                <p className="text-sm font-semibold text-slate-500">
                  {t('notebook.lots_count', { count: String(lots.length) })}
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-12 text-sm font-semibold text-slate-600">{t('notebook.column_type')}</TableHead>
                      <TableHead className="h-12 text-sm font-semibold text-slate-600">{t('notebook.column_duration')}</TableHead>
                      <TableHead className="h-12 text-right text-sm font-semibold text-slate-600">{t('notebook.column_amount')}</TableHead>
                      <TableHead className="h-12 text-sm font-semibold text-slate-600">{t('notebook.column_purchase_date')}</TableHead>
                      <TableHead className="h-12 text-right text-sm font-semibold text-slate-600">{t('notebook.column_nominal_value')}</TableHead>
                      <TableHead className="h-12 text-right text-sm font-semibold text-slate-600">{t('notebook.column_action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lots.map((lot) => (
                      <TableRow key={lot.id} className="odd:bg-slate-50/30 hover:bg-slate-50/80">
                        <TableCell className="py-4 font-medium">{lot.bondType}</TableCell>
                        <TableCell className="py-4 text-slate-600">
                          {formatBondDuration(
                            definitions[lot.bondType as BondType]?.duration ?? 1,
                            language,
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-right">{lot.amount}</TableCell>
                        <TableCell className="py-4">
                          {format(new Date(lot.purchaseDate), 'dd.MM.yyyy')}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          {formatCurrency(Number(lot.amount) * 100)}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <Button variant="outline" size="icon" asChild>
                            <a href={`/single-calculator?bondType=${lot.bondType}&purchaseDate=${lot.purchaseDate}`}>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-2xl border shadow-none">
          <CardHeader>
            <CardTitle>{t('notebook.liquidity_window_title')}</CardTitle>
            <CardDescription>{t('notebook.liquidity_window_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[30, 90, 180].map((days) => (
                <Button
                  key={days}
                  variant={maturityWindowDays === days ? 'default' : 'outline'}
                  className="h-9"
                  onClick={() => onWindowChange(days as 30 | 90 | 180)}
                >
                  {days}d
                </Button>
              ))}
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-muted-foreground">
                {t('notebook.cash_in_window')}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCurrency(upcomingCashflow)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{maturityWindowLabel}</p>
            </div>

            {filteredMaturities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('notebook.no_maturities_in_window')}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredMaturities.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.bondType}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {format(item.maturityDate, 'dd.MM.yyyy')}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                          {formatBondDuration(
                            definitions[item.bondType as BondType]?.duration ?? 1,
                            language,
                          )}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-none">
          <CardHeader>
            <CardTitle>{t('notebook.usage_note_title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {t('notebook.usage_note_desc')}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
