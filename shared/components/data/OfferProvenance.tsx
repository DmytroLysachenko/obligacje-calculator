'use client';

import type { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import {
  getBondOfferFreshnessState,
  getCalculationReferenceMeta,
} from '@/shared/lib/data-freshness-display';
import { buildReferenceProvenanceViewModel } from '@/shared/lib/data-reference';

export function OfferProvenance({ dataFreshness }: { dataFreshness?: CalculationDataFreshness }) {
  const { t, locale } = useAppI18n();
  const bondOffer = getBondOfferFreshnessState(dataFreshness);
  const provenance = buildReferenceProvenanceViewModel(
    getCalculationReferenceMeta(dataFreshness),
    locale,
  );

  return (
    <div className="space-y-2 border-y border-border py-3 text-xs leading-5 text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p>
          {t('landing.offer_provenance.label')}:{' '}
          <span className="font-semibold text-foreground">{provenance.source}</span>
        </p>
        <p>
          {bondOffer.attemptLabel
            ? `${t('sidebar.freshness.last_checked')}: ${bondOffer.attemptLabel}`
            : t('landing.offer_provenance.no_date')}
        </p>
      </div>
      {bondOffer.isDegraded || provenance.usesFallback ? (
        <p className="border-l-2 border-warning pl-3 font-semibold text-[var(--finance-warning)]">
          {t('sidebar.freshness.offer_degraded_warning')}
        </p>
      ) : null}
    </div>
  );
}
