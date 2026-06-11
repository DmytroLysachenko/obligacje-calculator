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
import { SectionBlock } from '@/shared/components/page/SectionBlock';

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
      <div className="space-y-14 pb-12 md:space-y-16">
        <header className="space-y-4">
          <h2 className="ui-page-title">
            {t('nav.education')}
          </h2>
          <p className="ui-body max-w-3xl">
            {t('education.subtitle')}
          </p>
        </header>

        <SectionBlock
          icon={<Zap className="h-5 w-5" />}
          title={t('education.concepts_title')}
          description={t('education.concepts_subtitle')}
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept) => (
              <article
                key={concept.key}
                className="border-t border-border py-5 transition-colors hover:border-foreground/30"
              >
                <div className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="border-l-2 border-border pl-3 text-foreground">
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
        </SectionBlock>

        <SectionBlock
          icon={<Target className="h-5 w-5" />}
          title={t('education.starter_title')}
          description={t('education.starter_subtitle')}
          action={
            <Link
              href="/single-calculator"
              className="inline-flex h-10 items-center gap-2 border-b border-foreground text-sm font-semibold text-foreground"
            >
              {t('education.starter_cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
            {starterGuides.map((guide) => (
              <article key={guide.key} className="border-t border-border py-5">
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
        </SectionBlock>

        <SectionBlock
          icon={<Briefcase className="h-5 w-5" />}
          title={t('education.bond_types')}
          description={t('education.bond_types_subtitle')}
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
            {Object.values(definitions).map((bond) => (
              <BondEducationCard key={bond.type} bond={bond} />
            ))}
          </div>
          <div className="border-t border-dashed border-border pt-4">
            <p className="max-w-4xl text-xs italic leading-relaxed text-muted-foreground">
              {t('education.disclaimer')}
            </p>
          </div>
        </SectionBlock>

        <SectionBlock
          icon={<HelpCircle className="h-5 w-5" />}
          title={t('education.faq')}
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-border">
              <AccordionTrigger className="text-left text-base font-semibold transition-colors hover:text-foreground">
                {t('education.q_inflation')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-3 py-2">
                  <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                  <p>{t('education.a_inflation')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b-border">
              <AccordionTrigger className="text-left text-base font-semibold transition-colors hover:text-foreground">
                {t('education.q_tax')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-3 py-2">
                  <Scale className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                  <p>{t('education.a_tax')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b-border">
              <AccordionTrigger className="text-left text-base font-semibold transition-colors hover:text-foreground">
                {t('education.q_early_exit')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-3 py-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  <p>{t('education.a_early_exit')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b-border">
              <AccordionTrigger className="text-left text-base font-semibold transition-colors hover:text-foreground">
                {t('education.q_monthly_payout')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-3 py-2">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                  <p>{t('education.a_monthly_payout')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SectionBlock>
      </div>
    </PageTransition>
  );
}




