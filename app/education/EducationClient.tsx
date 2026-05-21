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
import { PageTransition } from '@/shared/components/PageTransition';

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
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-5 w-full max-w-2xl rounded-xl" />
          <Skeleton className="h-5 w-full max-w-xl rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-64 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-12 pb-12">
        <header className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-primary">
            {t('nav.education')}
          </h2>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            {t('education.subtitle')}
          </p>
        </header>

        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-2xl font-semibold">
              <Zap className="h-6 w-6 text-primary" />
              {t('education.concepts_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('education.concepts_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept) => (
              <Card
                key={concept.key}
                className="border-primary/5 bg-card shadow-none transition-colors hover:border-primary/20"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <concept.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      {t(`education.concepts.${concept.key}.title`)}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`education.concepts.${concept.key}.desc`)}
                  </p>
                  <div className="rounded border border-primary/5 bg-muted px-3 py-2 font-mono text-[10px] text-primary/80">
                    {t(`education.concepts.${concept.key}.formula`)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-semibold">
              {t('education.bond_types')}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Object.values(definitions).map((bond) => (
              <BondEducationCard key={bond.type} bond={bond} />
            ))}
          </div>
          <p className="rounded-lg border border-dashed bg-muted/50 p-4 text-xs italic text-muted-foreground">
            {t('education.disclaimer')}
          </p>
        </section>

        <section className="space-y-6 rounded-3xl border bg-muted/30 p-8">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-semibold">{t('education.faq')}</h3>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-primary/10">
              <AccordionTrigger className="text-left text-lg font-semibold transition-colors hover:text-primary">
                {t('education.q_inflation')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-4 py-2">
                  <TrendingDown className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <p>{t('education.a_inflation')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b-primary/10">
              <AccordionTrigger className="text-left text-lg font-semibold transition-colors hover:text-primary">
                {t('education.q_tax')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-4 py-2">
                  <Scale className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <p>{t('education.a_tax')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b-primary/10">
              <AccordionTrigger className="text-left text-lg font-semibold transition-colors hover:text-primary">
                {t('education.q_early_exit')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-4 py-2">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-orange-500" />
                  <p>{t('education.a_early_exit')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b-primary/10">
              <AccordionTrigger className="text-left text-lg font-semibold transition-colors hover:text-primary">
                {t('education.q_monthly_payout')}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                <div className="flex items-start gap-4 py-2">
                  <Info className="mt-1 h-5 w-5 shrink-0 text-primary" />
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




