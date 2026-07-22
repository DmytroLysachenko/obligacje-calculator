'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import type { HomeToolDefinition } from '@/features/home/constants/dashboard';
import { useAppI18n } from '@/i18n/client';

type HomeRouteItem = Omit<HomeToolDefinition, 'titleKey' | 'descriptionKey'> & {
  title: string;
  description: string;
};

export function HomePrimaryRoute({ item }: { item: HomeRouteItem }) {
  const { t } = useAppI18n();
  return (
    <Link href={item.href} className="block ui-focus-ring">
      <article
        data-testid="home-primary-route"
        className="group rounded-md border border-foreground/20 bg-muted/25 px-4 py-7 transition-colors duration-150 hover:border-foreground/40 hover:bg-muted/40 md:flex md:items-center md:justify-between md:gap-8 md:px-6"
      >
        <div className="flex min-w-0 gap-4">
          <div
            className="border-l-2 border-foreground pl-3 pt-0.5 text-foreground"
            aria-hidden="true"
          >
            <item.icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="ui-kicker text-muted-foreground">
              {t('landing.home_routes.primary_eyebrow')}
            </p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-muted-foreground">
              {item.description}
            </p>
          </div>
        </div>
        <span className="mt-5 inline-flex shrink-0 items-center gap-2 text-[15px] font-semibold text-foreground md:mt-0">
          {t('landing.home_routes.primary_action')}
          <ArrowRight
            className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </article>
    </Link>
  );
}

export function HomeSupportingRoutes({
  items,
  optional = false,
}: {
  items: HomeRouteItem[];
  optional?: boolean;
}) {
  const { t } = useAppI18n();
  return (
    <div className="grid gap-x-8 md:grid-cols-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="block ui-focus-ring">
          <article className="group rounded-md px-3 py-5 transition-colors duration-150 hover:bg-muted/35">
            <div className="flex items-start gap-3">
              <item.icon
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                {!optional ? (
                  <span className="mt-3 inline-flex text-xs font-semibold text-foreground">
                    {t('landing.home_routes.supporting_action')}
                  </span>
                ) : null}
              </div>
              <ArrowRight
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
