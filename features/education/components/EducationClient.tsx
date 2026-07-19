'use client';

import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  HelpCircle,
  Info,
  Scale,
  Target,
  TrendingDown,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { BondEducationCard } from '@/features/education/components/BondEducationCard';
import { educationConcepts, starterGuides } from '@/features/education/constants/education-content';
import { useAppI18n } from '@/i18n/client';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';

export default function EducationClient() {
  const { t } = useAppI18n();
  const { definitions, isLoading } = useBondDefinitions();

  if (isLoading || !definitions) {
    return (
      <div className="ui-page-flow" aria-busy="true" aria-live="polite">
        <span className="sr-only">{t('common.loading')}</span>
        <div className="ui-section-intro">
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-5 w-full max-w-2xl rounded-md" />
          <Skeleton className="h-5 w-full max-w-xl rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="space-y-3 border-t border-border pt-5">
              <Skeleton className="h-5 w-2/3 rounded-md" />
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-5/6 rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="ui-page-flow">
        <header className="ui-page-header ui-section-intro">
          <p className="ui-eyebrow">{t('nav.education')}</p>
          <h1 className="ui-page-title">{t('nav.education')}</h1>
          <p className="ui-body max-w-3xl text-muted-foreground">{t('education.subtitle')}</p>
        </header>

        <SectionBlock
          icon={<Zap className="h-5 w-5" />}
          title={t('education.concepts_title')}
          description={t('education.concepts_subtitle')}
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {educationConcepts.map((concept) => (
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
                  <p className="ui-body">{t(`education.concepts.${concept.key}.desc`)}</p>
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
                  <p className="ui-card-title">{t(`education.starter.${guide.key}.label`)}</p>
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

        <SectionBlock icon={<HelpCircle className="h-5 w-5" />} title={t('education.faq')}>
          <Accordion type="single" collapsible className="w-full border-t border-border">
            <AccordionItem value="item-1" className="border-b-border">
              <AccordionTrigger className="ui-focus-ring py-5 text-left text-base font-semibold transition-colors hover:text-foreground">
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
              <AccordionTrigger className="ui-focus-ring py-5 text-left text-base font-semibold transition-colors hover:text-foreground">
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
              <AccordionTrigger className="ui-focus-ring py-5 text-left text-base font-semibold transition-colors hover:text-foreground">
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
              <AccordionTrigger className="ui-focus-ring py-5 text-left text-base font-semibold transition-colors hover:text-foreground">
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
