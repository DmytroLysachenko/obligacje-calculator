'use client';

import type { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import {
  getBondOfferFreshnessState,
  getBondOfferSourceTranslationKey,
} from '@/shared/lib/data-freshness-display';

export function HomeOfferProvenance({
  dataFreshness,
}: {
  dataFreshness?: CalculationDataFreshness;
}) {
  const { t } = useAppI18n();
  const bondOffer = getBondOfferFreshnessState(dataFreshness);
  const source = t(
    `sidebar.freshness.offer_sources.${getBondOfferSourceTranslationKey(bondOffer.source)}`,
  );
  return (
    <div className="space-y-2 border-y border-border py-3 text-xs leading-5 text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p>
          {t('landing.offer_provenance.label')}:{' '}
          <span className="font-semibold text-foreground">{source}</span>
        </p>
        <p>
          {bondOffer.attemptLabel
            ? `${t('sidebar.freshness.last_checked')}: ${bondOffer.attemptLabel}`
            : t('landing.offer_provenance.no_date')}
        </p>
      </div>
      {bondOffer.isDegraded ? (
        <p className="border-l-2 border-warning pl-3 font-semibold text-[var(--finance-warning)]">
          {t('sidebar.freshness.offer_degraded_warning')}
        </p>
      ) : null}
    </div>
  );
}
