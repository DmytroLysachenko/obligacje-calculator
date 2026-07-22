'use client';

import { ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

import { educationDecisionRoutes } from '@/features/education/constants/education-content';
import { useAppI18n } from '@/i18n/client';

export function EducationDecisionRail() {
  const { t } = useAppI18n();

  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {educationDecisionRoutes.map((route, index) => (
        <li key={route.key} className="min-w-0">
          <Link
            href={`#offers-${route.groupKey}`}
            className="ui-interactive-surface group flex h-full gap-3 rounded-md border border-border bg-card px-4 py-4 hover:border-foreground/30 hover:bg-muted/30 xl:relative xl:block"
          >
            <span
              className="font-mono text-[11px] font-semibold text-muted-foreground"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1 xl:mt-5">
              <span className="flex items-center gap-2">
                <route.icon className="size-3.5 shrink-0 text-foreground" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">
                  {t(`education.decision.${route.key}.label`)}
                </span>
              </span>
              <span className="mt-2 block font-mono text-lg font-semibold tracking-tight text-foreground">
                {route.bondTypes.join(' / ')}
              </span>
              <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                {t(`education.decision.${route.key}.description`)}
              </span>
            </span>
            <ArrowDownRight
              className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none group-hover:translate-y-0.5 group-hover:translate-x-0.5 xl:absolute xl:top-4 xl:right-0"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ol>
  );
}
