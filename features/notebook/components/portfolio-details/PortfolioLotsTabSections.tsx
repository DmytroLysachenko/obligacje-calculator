'use client';

import { ExternalLink, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollHint,
} from '@/components/ui/table';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';
import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';
import { formatIsoDate } from '@/shared/lib/financial-formatters';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
import { UserInvestmentLot } from '@/shared/types/portfolio';

export type PortfolioMaturityItem = UserInvestmentLot & {
  maturityDate: Date;
  value: number;
};

type MaturityWindowDays = 30 | 90 | 180;

interface PortfolioLotsTableSectionProps {
  isLoading: boolean;
  lots: UserInvestmentLot[];
  definitions: Record<BondType, BondDefinition>;
  language: 'en' | 'pl';
  formatCurrency: (value: number) => string;
  t: (key: string, values?: Record<string, string>) => string;
}

interface PortfolioLiquidityPanelProps {
  definitions: Record<BondType, BondDefinition>;
  language: 'en' | 'pl';
  formatCurrency: (value: number) => string;
  maturityWindowDays: MaturityWindowDays;
  onWindowChange: (value: MaturityWindowDays) => void;
  filteredMaturities: PortfolioMaturityItem[];
  upcomingCashflow: number;
  maturityWindowLabel: string;
  t: (key: string, values?: Record<string, string>) => string;
}

const maturityWindowOptions = [30, 90, 180] as const;

export function PortfolioLotsTableSection({
  isLoading,
  lots,
  definitions,
  language,
  formatCurrency,
  t,
}: PortfolioLotsTableSectionProps) {
  return (
    <section className="space-y-5 border-t border-border py-5">
      <div className="space-y-2">
        <h2 className="ui-section-title">{t('notebook.stored_lots_title')}</h2>
        <p className="ui-body text-muted-foreground">{t('notebook.stored_lots_desc')}</p>
      </div>
      <div>
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('notebook.updating')}
          </div>
        ) : lots.length === 0 ? (
          <div className="border-t border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t('notebook.no_lots')}</p>
          </div>
        ) : (
          <div className="border-y border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-border py-3 text-sm text-muted-foreground">
              <p>{t('notebook.stored_lots_hint')}</p>
              <p className="text-sm font-semibold text-muted-foreground">
                {t('notebook.lots_count', { count: String(lots.length) })}
              </p>
            </div>
            <div className="grid gap-px border-b border-border bg-border lg:hidden">
              {lots.map((lot) => (
                <article key={`mobile-${lot.id}`} className="space-y-4 bg-background p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{lot.bondType}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatBondDuration(
                          definitions[lot.bondType as BondType]?.duration ?? 1,
                          language,
                        )}
                      </p>
                    </div>
                    <Button variant="outline" size="icon" className="min-h-11 min-w-11" asChild>
                      <a
                        href={`/single-calculator?bondType=${lot.bondType}&purchaseDate=${lot.purchaseDate}`}
                        aria-label={t('notebook.open_lot_calculator', {
                          bondType: lot.bondType,
                        })}
                      >
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t('notebook.column_amount')}</dt>
                      <dd className="financial-number mt-1 font-semibold text-foreground">
                        {lot.bondQuantity}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        {t('notebook.column_nominal_value')}
                      </dt>
                      <dd className="financial-number mt-1 font-semibold text-foreground">
                        {formatCurrency(Number(lot.bondQuantity) * 100)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">
                        {t('notebook.column_purchase_date')}
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {formatIsoDate(lot.purchaseDate, language)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <TableScrollHint>{t('notebook.stored_lots_hint')}</TableScrollHint>
              <Table
                className="w-full table-fixed text-sm tabular-nums"
                aria-label={t('notebook.stored_lots_hint')}
              >
                <TableCaption>{t('notebook.stored_lots_hint')}</TableCaption>
                <TableHeader>
                  <TableRow className="h-12 hover:bg-transparent">
                    <TableHead
                      scope="col"
                      className="sticky top-0 z-10 h-12 w-[14%] bg-background text-sm font-semibold text-muted-foreground"
                    >
                      {t('notebook.column_type')}
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="sticky top-0 z-10 h-12 w-[22%] bg-background text-sm font-semibold text-muted-foreground"
                    >
                      {t('notebook.column_duration')}
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="sticky top-0 z-10 h-12 w-[14%] bg-background text-right text-sm font-semibold text-muted-foreground"
                    >
                      {t('notebook.column_amount')}
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="sticky top-0 z-10 h-12 w-[18%] bg-background text-sm font-semibold text-muted-foreground"
                    >
                      {t('notebook.column_purchase_date')}
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="sticky top-0 z-10 h-12 w-[20%] bg-background text-right text-sm font-semibold text-muted-foreground"
                    >
                      {t('notebook.column_nominal_value')}
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="sticky top-0 z-10 h-12 w-[12%] bg-background text-right text-sm font-semibold text-muted-foreground"
                    >
                      {t('notebook.column_action')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow
                      key={lot.id}
                      className="h-14 border-b border-border transition-colors hover:bg-muted/25"
                    >
                      <TableCell className="py-4 font-medium">{lot.bondType}</TableCell>
                      <TableCell className="py-4 text-muted-foreground">
                        {formatBondDuration(
                          definitions[lot.bondType as BondType]?.duration ?? 1,
                          language,
                        )}
                      </TableCell>
                      <TableCell className="financial-number py-4 text-right">
                        {lot.bondQuantity}
                      </TableCell>
                      <TableCell className="py-4">
                        {formatIsoDate(lot.purchaseDate, language)}
                      </TableCell>
                      <TableCell className="financial-number py-4 text-right font-semibold">
                        {formatCurrency(Number(lot.bondQuantity) * 100)}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Button variant="outline" size="icon" className="min-h-11 min-w-11" asChild>
                          <a
                            href={`/single-calculator?bondType=${lot.bondType}&purchaseDate=${lot.purchaseDate}`}
                            aria-label={t('notebook.open_lot_calculator', {
                              bondType: lot.bondType,
                            })}
                          >
                            <ExternalLink aria-hidden="true" className="h-4 w-4" />
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
      </div>
    </section>
  );
}

export function PortfolioLiquidityPanel({
  definitions,
  language,
  formatCurrency,
  maturityWindowDays,
  onWindowChange,
  filteredMaturities,
  upcomingCashflow,
  maturityWindowLabel,
  t,
}: PortfolioLiquidityPanelProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-4 border-t border-border py-5">
        <div className="space-y-2">
          <h2 className="ui-section-title">{t('notebook.liquidity_window_title')}</h2>
          <p className="ui-body text-muted-foreground">{t('notebook.liquidity_window_desc')}</p>
        </div>
        <SegmentedControl
          value={String(maturityWindowDays)}
          options={maturityWindowOptions.map((days) => ({
            value: String(days),
            label: `${days}d`,
          }))}
          onValueChange={(days) => onWindowChange(Number(days) as MaturityWindowDays)}
          className="grid-cols-3"
        />

        <div className="border-y border-border py-4">
          <p className="text-sm font-semibold text-muted-foreground">
            {t('notebook.cash_in_window')}
          </p>
          <p className="financial-number mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(upcomingCashflow)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{maturityWindowLabel}</p>
        </div>

        {filteredMaturities.length === 0 ? (
          <FormInlineNotice description={t('notebook.no_maturities_in_window')} />
        ) : (
          <div className="space-y-3">
            {filteredMaturities.slice(0, 6).map((item) => (
              <div key={item.id} className="border-t border-border py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{item.bondType}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatIsoDate(item.maturityDate.toISOString().slice(0, 10), language)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {formatBondDuration(
                        definitions[item.bondType as BondType]?.duration ?? 1,
                        language,
                      )}
                    </p>
                  </div>
                  <p className="financial-number font-semibold text-foreground">
                    {formatCurrency(item.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2 border-t border-border py-5">
        <h2 className="ui-card-title">{t('notebook.usage_note_title')}</h2>
        <div className="text-sm leading-6 text-muted-foreground">
          {t('notebook.usage_note_desc')}
        </div>
      </section>
    </div>
  );
}
