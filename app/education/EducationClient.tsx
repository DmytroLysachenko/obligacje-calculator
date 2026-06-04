'use client';

import React from 'react';
import Link from 'next/link';
import { useAppI18n } from '@/i18n/client';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { BondEducationCard } from '@/features/education/components/BondEducationCard';
import {
  ArrowRight,
  Clock,
  Info,
  HelpCircle,
  AlertTriangle,
  TrendingDown,
  Scale,
  Briefcase,
  Zap,
  Target,
  Layers,
  Percent,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/shared/components/page/PageTransition';

export default function EducationClient() {
  const { t } = useAppI18n();
  const { definitions, isLoading } = useBondDefinitions();

  const concepts = [
    { key: 'inflation', icon: TrendingDown },
    { key: 'margin', icon: Target },
    { key: 'capitalization', icon: Layers },
    { key: 'belka_tax', icon: Percent },
    { key: 'early_redemption', icon: LogOut },
  ];
  const starterGuides = [
    {
      key: 'short_term',
      icon: Clock,
      bonds: 'OTS / ROR',
    },
    {
      key: 'inflation',
      icon: ShieldCheck,
      bonds: 'COI / EDO',
    },
    {
      key: 'family',
      icon: Users,
      bonds: 'ROS / ROD',
    },
    {
      key: 'long_term',
      icon: Target,
      bonds: 'EDO / ROD',
    },
  ];

  if (isLoading || !definitions) {
    return (
      <div className="space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-5 w-full max-w-2xl rounded-md" />
          <Skeleton className="h-5 w-full max-w-xl rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-64 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-10 pb-12">
        <header className="space-y-4">
          <h2 className="ui-page-title">
            {t('nav.education')}
          </h2>
          <p className="ui-body max-w-3xl">
            {t('education.subtitle')}
          </p>
        </header>

        <section className="space-y-6 border-t border-border py-8">
          <div className="space-y-2">
            <h3 className="ui-section-title flex items-center gap-2">
              <Zap className="h-5 w-5 text-foreground" />
              {t('education.concepts_title')}
            </h3>
            <p className="ui-body">
              {t('education.concepts_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept) => (
              <article
                key={concept.key}
                className="bg-card p-4 transition-colors hover:bg-muted/25"
              >
                <div className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2 text-foreground">
                      <concept.icon className="h-5 w-5" />
                    </div>
                    <h4 className="ui-card-title">
                      {t(`education.concepts.${concept.key}.title`)}
                    </h4>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="ui-body">
                    {t(`education.concepts.${concept.key}.desc`)}
                  </p>
                  <div className="border-t border-border pt-3 font-mono text-[11px] leading-5 text-muted-foreground">
                    {t(`education.concepts.${concept.key}.formula`)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5 border-t border-border py-8">
          <div className="ui-section-row">
            <div className="space-y-2">
              <h3 className="ui-section-title flex items-center gap-2">
                <Target className="h-5 w-5 text-foreground" />
                {t('education.starter_title')}
              </h3>
              <p className="ui-body max-w-3xl text-muted-foreground">
                {t('education.starter_subtitle')}
              </p>
            </div>
            <Link
              href="/single-calculator"
              className="inline-flex h-10 items-center gap-2 border-b border-foreground text-sm font-semibold text-foreground"
            >
              {t('education.starter_cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {starterGuides.map((guide) => (
              <article key={guide.key} className="border-t border-border py-4">
                <div className="flex items-center gap-2">
                  <guide.icon className="h-4 w-4 text-foreground" />
                  <p className="ui-card-title">
                    {t(`education.starter.${guide.key}.label`)}
                  </p>
                </div>
                <p className="mt-2 text-[32px] font-semibold leading-none text-foreground">
                  {guide.bonds}
                </p>
                <p className="ui-body mt-3 text-muted-foreground">
                  {t(`education.starter.${guide.key}.description`)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6 border-t border-border py-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-foreground" />
              <h3 className="ui-section-title">
                {t('education.bond_types')}
              </h3>
            </div>
            <p className="ui-body max-w-3xl text-muted-foreground">
              {t('education.bond_types_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.values(definitions).map((bond) => (
              <BondEducationCard key={bond.type} bond={bond} />
            ))}
          </div>
          <div className="border-t border-dashed border-border pt-4">
            <p className="max-w-4xl text-xs italic leading-relaxed text-muted-foreground">
              {t('education.disclaimer')}
            </p>
          </div>
        </section>

        <section className="space-y-6 border-t border-border py-8">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-foreground" />
            <h3 className="ui-section-title">{t('education.faq')}</h3>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-border">
              <AccordionTrigger className="text-left text-base font-semibold transition-colors hover:text-foreground">
                {t('education.q_inflation')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-4 py-2">
                  <TrendingDown className="mt-1 h-5 w-5 shrink-0 text-foreground" />
                  <p>{t('education.a_inflation')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b-border">
              <AccordionTrigger className="text-left text-base font-semibold transition-colors hover:text-foreground">
                {t('education.q_tax')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-4 py-2">
                  <Scale className="mt-1 h-5 w-5 shrink-0 text-foreground" />
                  <p>{t('education.a_tax')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b-border">
              <AccordionTrigger className="text-left text-base font-semibold transition-colors hover:text-foreground">
                {t('education.q_early_exit')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-4 py-2">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-warning" />
                  <p>{t('education.a_early_exit')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b-border">
              <AccordionTrigger className="text-left text-base font-semibold transition-colors hover:text-foreground">
                {t('education.q_monthly_payout')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-4 py-2">
                  <Info className="mt-1 h-5 w-5 shrink-0 text-foreground" />
                  <p>{t('education.a_monthly_payout')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </PageTransition>
  );
}




