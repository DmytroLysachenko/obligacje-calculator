'use client';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  heroTrustStripKeys,
  type HomeToolDefinition,
  primaryHomeTools,
  secondaryHomeTools,
} from '@/features/home/constants/dashboard';
import { useAppI18n } from '@/i18n/client';
import { SectionHeading, ToolCard } from '@/shared/components/page/ToolCard';

import { HomeDecisionSlip } from './HomeDecisionSlip';
type ToolItem = {
  href: string;
  title: string;
  description: string;
  icon: HomeToolDefinition['icon'];
  status: HomeToolDefinition['status'];
};
function HomeToolCard({ item }: { item: ToolItem }) {
  const { t } = useAppI18n();
  const routeLabel =
    item.status === 'trusted'
      ? t('landing.route_labels.primary')
      : item.status === 'reference'
        ? t('landing.route_labels.reference')
        : t('landing.route_labels.next');
  const emphasis =
    item.status === 'trusted' ? 'primary' : item.status === 'reference' ? 'reference' : 'secondary';
  return (
    <ToolCard
      href={item.href}
      title={item.title}
      description={item.description}
      icon={<item.icon className="h-5 w-5" />}
      label={routeLabel}
      emphasis={emphasis}
    />
  );
}
function HeroTrustStrip() {
  const { t } = useAppI18n();
  return (
    <div className="grid border-y border-border py-2 md:grid-cols-3 md:divide-x md:divide-border">
      {heroTrustStripKeys.map((itemKey) => (
        <span
          key={itemKey}
          className="px-1 py-2 text-xs font-semibold leading-5 text-muted-foreground md:px-4"
        >
          {t(`landing.hero_trust_strip.${itemKey}`)}
        </span>
      ))}
    </div>
  );
}
export function LandingDashboardClient() {
  const { t } = useAppI18n();
  const primaryTools: ToolItem[] = primaryHomeTools.map((item) => ({
    ...item,
    title: t(item.titleKey),
    description: t(item.descriptionKey),
  }));
  const secondaryTools: ToolItem[] = secondaryHomeTools.map((item) => ({
    ...item,
    title: t(item.titleKey),
    description: t(item.descriptionKey),
  }));
  const secondaryTitle = t('landing.secondary_tools.title');
  const secondaryDesc = t('landing.secondary_tools.description');
  return (
    <div className="ui-page-flow">
      <section className="border-b border-border pb-8 md:pb-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-5xl space-y-6 md:space-y-7">
            <p className="inline-flex items-center gap-2 border-l-2 border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t('landing.recovery_home.eyebrow')}
            </p>

            <div className="space-y-4">
              <h1 className="ui-page-title max-w-4xl">{t('landing.recovery_home.title')}</h1>
              <p className="ui-body max-w-3xl text-muted-foreground md:text-base md:leading-8">
                {t('landing.recovery_home.description')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-lg text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
              >
                <Link href="/single-calculator">
                  {t('landing.recovery_home.primary_cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 rounded-lg text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
              >
                <Link href="/education">{t('landing.recovery_home.secondary_cta')}</Link>
              </Button>
            </div>

            <div className="max-w-4xl space-y-3">
              <HeroTrustStrip />
              <p className="ui-metadata leading-6 text-muted-foreground">
                {t('landing.hero_trust_note')}
              </p>
            </div>
          </div>

          <div className="hidden lg:block">
            <HomeDecisionSlip />
          </div>
        </div>
      </section>

      <section className="lg:hidden">
        <HomeDecisionSlip />
      </section>

      <section className="space-y-4">
        <SectionHeading
          title={t('landing.recovery_home.core_route_title')}
          description={t('landing.recovery_home.core_route_desc')}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {primaryTools.map((item) => (
            <HomeToolCard key={item.href} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title={secondaryTitle} description={secondaryDesc} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
          {secondaryTools.map((item) => (
            <HomeToolCard key={item.href} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
