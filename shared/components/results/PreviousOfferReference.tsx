'use client';

import { RefreshCw } from 'lucide-react';

import { useAppI18n } from '@/i18n/client';

interface PreviousOfferReferenceProps {
  isPreviousOfferReference: boolean;
  onRecalculate?: () => void;
}

export function PreviousOfferReference({
  isPreviousOfferReference,
  onRecalculate,
}: PreviousOfferReferenceProps) {
  const { t } = useAppI18n();

  if (!isPreviousOfferReference) return null;

  return (
    <aside className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-warning bg-warning/5 px-4 py-3 text-sm text-foreground">
      <div className="flex min-w-0 items-start gap-2">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
        <p>{t('bonds.previous_offer_reference')}</p>
      </div>
      {onRecalculate ? (
        <button type="button" className="ui-focus-ring min-h-11 shrink-0 rounded-md border border-border px-3 text-xs font-semibold" onClick={onRecalculate}>
          {t('bonds.recalculate_current_offer')}
        </button>
      ) : null}
    </aside>
  );
}
