'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { homeDecisionRoutes } from '@/features/home/constants/decision-slip';
import { useAppI18n } from '@/i18n/client';

export function HomeDecisionSlip() {
  const { t } = useAppI18n();

  return (
    <aside className="border-y border-border py-4 lg:border-l lg:border-y-0 lg:pl-6 lg:py-0">
      <p className="ui-kicker text-muted-foreground">{t('landing.decision_slip.eyebrow')}</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
        {t('landing.decision_slip.title')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {t('landing.decision_slip.description')}
      </p>
      <ol className="mt-5 divide-y divide-border border-y border-border">
        {homeDecisionRoutes.map((item, index) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="ui-interactive-surface group flex items-center gap-3 py-3 text-left"
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
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
