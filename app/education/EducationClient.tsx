'use client';

import React from 'react';
import { useLanguage } from '@/i18n';
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
  LogOut
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/shared/components/PageTransition';

export default function EducationClient() {
  const { t } = useLanguage();
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
      <div className="space-y-16 animate-pulse">
        <header className="space-y-4">
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="h-6 bg-muted rounded w-2/3"></div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-16 pb-12">
      <header className="space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-primary">{t('nav.education')}</h2>
        <p className="text-xl text-muted-foreground max-w-3xl">
          {t('education.subtitle')}
        </p>
      </header>

      {/* Fundamental Concepts */}
      <section className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            {t('education.concepts_title')}
          </h3>
          <p className="text-muted-foreground">{t('education.concepts_subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concepts.map((concept) => (
            <Card key={concept.key} className="border-primary/5 hover:border-primary/20 transition-colors shadow-sm bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <concept.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t(`education.concepts.${concept.key}.title`)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`education.concepts.${concept.key}.desc`)}
                </p>
                <div className="p-2 bg-muted rounded text-[10px] font-mono text-primary/80 border border-primary/5">
                  {t(`education.concepts.${concept.key}.formula`)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bond Types */}
      <section className="space-y-8">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-semibold">{t('education.bond_types')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.values(definitions).map((bond) => (
            <BondEducationCard key={bond.type} bond={bond} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground italic bg-muted/50 p-4 rounded-lg border border-dashed">
          {t('education.disclaimer')}
        </p>
      </section>

      {/* FAQ */}
      <section className="space-y-8 bg-muted/30 p-8 rounded-3xl border">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-semibold">{t('education.faq')}</h3>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-primary/10">
            <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary transition-colors">
              {t('education.q_inflation')}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              <div className="flex gap-4 items-start py-2">
                <TrendingDown className="h-5 w-5 text-primary shrink-0 mt-1" />
                <p>{t('education.a_inflation')}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b-primary/10">
            <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary transition-colors">
              {t('education.q_tax')}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              <div className="flex gap-4 items-start py-2">
                <Scale className="h-5 w-5 text-primary shrink-0 mt-1" />
                <p>{t('education.a_tax')}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-b-primary/10">
            <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary transition-colors">
              {t('education.q_early_exit')}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              <div className="flex gap-4 items-start py-2">
                <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-1" />
                <p>{t('education.a_early_exit')}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4" className="border-b-primary/10">
            <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary transition-colors">
              {t('education.q_monthly_payout')}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              <div className="flex gap-4 items-start py-2">
                <Info className="h-5 w-5 text-primary shrink-0 mt-1" />
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
