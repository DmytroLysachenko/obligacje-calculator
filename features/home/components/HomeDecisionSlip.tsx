'use client';

import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { homeDecisionRoutes } from '@/features/home/constants/decision-slip';
import { useAppI18n } from '@/i18n/client';
import { InfoTooltip } from '@/shared/components/feedback/InfoTooltip';

export function HomeDecisionSlip() {
  const { t } = useAppI18n();
  const [selectedId, setSelectedId] = useState(homeDecisionRoutes[0]?.id);
  const selectedRoute = homeDecisionRoutes.find((item) => item.id === selectedId);

  return (
    <aside data-testid="home-decision-slip" className="bg-muted/25 px-4 py-5 lg:rounded-md lg:px-5">
      <p className="ui-kicker text-muted-foreground">{t('landing.decision_slip.eyebrow')}</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
        {t('landing.decision_slip.title')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {t('landing.decision_slip.description')}
      </p>
      <ol className="mt-5 space-y-1" aria-label={t('landing.decision_slip.title')}>
        {homeDecisionRoutes.map((item, index) => (
          <li key={item.id} className="flex items-center gap-1">
            <button
              type="button"
              aria-pressed={selectedId === item.id}
              onClick={() => setSelectedId(item.id)}
              className="ui-interactive-surface group flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-3 text-left hover:bg-background aria-pressed:bg-background"
            >
              <span
                className="font-mono text-[11px] font-semibold text-muted-foreground"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {t(`landing.decision_slip.options.${item.id}.title`)}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                  {t(`landing.decision_slip.options.${item.id}.description`)}
                </span>
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
            <InfoTooltip content={t(`landing.decision_slip.options.${item.id}.detail`)} />
          </li>
        ))}
      </ol>
      {selectedRoute ? (
        <div className="mt-4 border-t border-border pt-4" aria-live="polite">
          <p className="flex items-center gap-2 text-xs font-semibold text-success">
            <Check className="size-3.5" aria-hidden="true" />
            {t(`landing.decision_slip.options.${selectedRoute.id}.title`)}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t(`landing.decision_slip.options.${selectedRoute.id}.description`)}
          </p>
          <Link
            href={selectedRoute.href}
            className="ui-focus-ring mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/85"
          >
            {t('landing.home_routes.primary_action')}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
