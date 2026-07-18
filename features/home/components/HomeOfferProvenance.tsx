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
    <div className="grid border-y border-border py-2 text-xs leading-5 text-muted-foreground md:grid-cols-[minmax(0,1fr)_auto] md:divide-x md:divide-border">
      <p className="px-1 py-2 md:px-4">
        {t('landing.offer_provenance.label')}:{' '}
        <span className="font-semibold text-foreground">{source}</span>
      </p>
      <p className="px-1 py-2 md:px-4">
        {bondOffer.attemptLabel
          ? `${t('sidebar.freshness.last_checked')}: ${bondOffer.attemptLabel}`
          : t('landing.offer_provenance.no_date')}
      </p>
      {bondOffer.isDegraded ? (
        <p className="px-1 py-2 font-semibold text-[var(--finance-warning)] md:col-span-2 md:px-4">
          {t('sidebar.freshness.offer_degraded_warning')}
        </p>
      ) : null}
    </div>
  );
}
