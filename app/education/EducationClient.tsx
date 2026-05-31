'use client';

import React from 'react';
import { useAppI18n } from '@/i18n/client';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { BondEducationCard } from '@/features/education/components/BondEducationCard';
import {
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
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
      <div className="space-y-8 pb-12">
        <header className="space-y-4">
          <h2 className="ui-page-title">
            {t('nav.education')}
          </h2>
          <p className="ui-body max-w-3xl">
            {t('education.subtitle')}
          </p>
        </header>

        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="ui-section-title flex items-center gap-2">
              <Zap className="h-5 w-5 text-foreground" />
              {t('education.concepts_title')}
            </h3>
            <p className="ui-body">
              {t('education.concepts_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept) => (
              <Card
                key={concept.key}
                className="border-border bg-card shadow-none transition-colors hover:border-foreground/20"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2 text-foreground">
                      <concept.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="ui-card-title">
                      {t(`education.concepts.${concept.key}.title`)}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="ui-body">
                    {t(`education.concepts.${concept.key}.desc`)}
                  </p>
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-[10px] text-muted-foreground">
                    {t(`education.concepts.${concept.key}.formula`)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-foreground" />
            <h3 className="ui-section-title">
              {t('education.bond_types')}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Object.values(definitions).map((bond) => (
              <BondEducationCard key={bond.type} bond={bond} />
            ))}
          </div>
          <p className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-xs italic text-muted-foreground">
            {t('education.disclaimer')}
          </p>
        </section>

        <section className="space-y-6 rounded-lg border border-border bg-card p-6">
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




