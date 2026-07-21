'use client';

import { Badge } from '@/components/ui/badge';
import { BondTimelineRowsProps } from '@/features/single-calculator/types/timeline';
import { useAppI18n } from '@/i18n/client';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';

import { MobileValue } from './BondTimelineValues';

type BondTimelineMobileRowsProps = Pick<
  BondTimelineRowsProps,
  'displayedTimeline' | 'filteredTimelineLength' | 'formatCurrency'
> & {
  resultsId: string;
};

export function BondTimelineMobileRows({
  resultsId,
  displayedTimeline,
  filteredTimelineLength,
  formatCurrency,
}: BondTimelineMobileRowsProps) {
  const { t } = useAppI18n();

  return (
    <ResponsiveTableSheet
      title={t('bonds.schedule.mobile_sheet_title')}
      description={t('bonds.schedule.mobile_sheet_description')}
      triggerLabel={t('bonds.schedule.mobile_sheet_trigger')}
      triggerCount={`${filteredTimelineLength} ${t('bonds.schedule.mobile_sheet_count_suffix')}`}
      resultsId={resultsId}
    >
      <div className="ui-divider-group">
        {displayedTimeline.map((row) => (
          <article
            key={`mobile-${row.key}`}
            className="py-5 first:pt-0 last:pb-0"
            aria-label={`${row.periodLabel}: ${formatCurrency(row.totalWealth)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{row.periodLabel}</p>
                  {row.projectionLabel ? (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {row.projectionLabel}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{row.cadenceLabel}</p>
              </div>
              <p className="financial-number shrink-0 text-right text-sm font-semibold text-foreground">
                {formatCurrency(row.totalWealth)}
              </p>
            </div>

            {row.eventLabels.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1">
                {row.eventLabels.map((label, index) => (
                  <Badge
                    key={`mobile-${row.key}-${index}`}
                    variant="secondary"
                    className="h-5 px-2 text-[11px] font-semibold"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
              <MobileValue
                label={t('bonds.schedule.rate_and_basis')}
                value={row.interestRateLabel}
              />
              <MobileValue
                label={t('bonds.early_exit_payout')}
                value={formatCurrency(row.earlyExitValue)}
              />
              <MobileValue label={row.cashFlowLabel} value={formatCurrency(row.paidOutCash)} />
              <MobileValue label={t('common.net_profit')} value={formatCurrency(row.netProfit)} />
              <MobileValue label={t('bonds.real_value')} value={formatCurrency(row.realValue)} />
              <MobileValue label={t('bonds.schedule.rate_source')} value={row.rateSourceLabel} />
            </div>

            {row.referenceLabel ? (
              <p className="mt-3 border-l-2 border-border px-3 text-xs leading-5 text-muted-foreground">
                {row.referenceLabel}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </ResponsiveTableSheet>
  );
}
