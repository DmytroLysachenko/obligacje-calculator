'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Calculator,
  CheckCircle2,
  FlaskConical,
  Layers,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { loadSavedScenarios } from '@/features/single-calculator/lib/scenario-storage';
import { FeatureStatus, FeatureStatusPill } from '@/shared/components/FeatureStatusNotice';

type ToolItem = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: FeatureStatus;
};

function HomeToolCard({ item }: { item: ToolItem }) {
  return (
    <Link href={item.href} className="block h-full">
      <Card className="h-full rounded-3xl border border-slate-200 bg-white shadow-none transition-colors hover:border-slate-300 hover:bg-slate-50/60">
        <CardContent className="flex h-full flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
              <item.icon className="h-5 w-5" />
            </div>
            <FeatureStatusPill status={item.status} />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              {item.title}
            </h3>
            <p className="text-sm leading-7 text-slate-600">
              {item.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function HomeStep({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-none">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="text-sm leading-7 text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingDashboardClient() {
  const { t, language } = useLanguage();
  const [savedScenarioNames, setSavedScenarioNames] = React.useState<string[]>([]);

  React.useEffect(() => {
    setSavedScenarioNames(
      loadSavedScenarios()
        .slice(0, 3)
        .map((scenario) => scenario.name),
    );
  }, []);

  const stepCopy =
    language === 'pl'
      ? [
          {
            title: 'Poznaj zasady',
            description:
              'Zacznij od edukacji albo od razu od pojedynczego kalkulatora, jesli znasz typ obligacji i horyzont.',
          },
          {
            title: 'Uruchom jedno obliczenie',
            description:
              'Wprowadz jeden zestaw danych, policz scenariusz i sprawdz wynik bez bocznych paneli ani rozpraszaczy.',
          },
          {
            title: 'Dopiero potem rozszerz',
            description:
              'Porownanie, regularne inwestowanie, drabina i notatnik maja byc drugie w kolejnosci, nie pierwsze.',
          },
        ]
      : [
          {
            title: 'Learn the rules',
            description:
              'Start with education or go straight to the single calculator if you already know the bond type and horizon.',
          },
          {
            title: 'Run one calculation',
            description:
              'Enter one committed scenario, calculate it cleanly, and read the result without dashboard side panels.',
          },
          {
            title: 'Expand only after that',
            description:
              'Comparison, recurring investing, ladder strategy, and notebook should stay secondary, not first.',
          },
        ];

  const primaryTools: ToolItem[] = [
    {
      href: '/single-calculator',
      title: t('nav.single_calculator'),
      description: t('landing.cards.single_calculator'),
      icon: Calculator,
      status: 'trusted',
    },
    {
      href: '/education',
      title: t('nav.education'),
      description: t('landing.cards.education'),
      icon: BookOpen,
      status: 'trusted',
    },
    {
      href: '/economic-data',
      title: t('nav.economic_data'),
      description: t('landing.cards.economic_data'),
      icon: BarChart2,
      status: 'reference',
    },
  ];

  const secondaryTools: ToolItem[] = [
    {
      href: '/compare',
      title: t('nav.comparison'),
      description: t('landing.cards.comparison'),
      icon: Scale,
      status: 'conditional',
    },
    {
      href: '/regular-investment',
      title: t('nav.regular_investment'),
      description: t('landing.cards.regular_investment'),
      icon: TrendingUp,
      status: 'conditional',
    },
    {
      href: '/ladder',
      title: t('nav.ladder'),
      description: t('landing.cards.ladder'),
      icon: Layers,
      status: 'conditional',
    },
    {
      href: '/notebook',
      title: t('nav.notebook'),
      description: t('landing.recovery_home.notebook_card'),
      icon: Wallet,
      status: 'conditional',
    },
  ];

  const savedScenarioTitle =
    language === 'pl' ? 'Ostatnio zapisane scenariusze' : 'Recent saved scenarios';
  const savedScenarioEmpty =
    language === 'pl'
      ? 'Brak lokalnie zapisanych scenariuszy. Glowna strona nie powinna udawac centrum sterowania, jesli nic nie zapisales.'
      : 'No local saved scenarios yet. The home page should not pretend to be a control center when nothing is saved.';
  const startHereTitle =
    language === 'pl' ? 'Prosta sciezka glowna' : 'Simple primary path';
  const startHereDesc =
    language === 'pl'
      ? 'Ta strona ma kierowac do glownych narzedzi, nie konkurowac z nimi dodatkowymi panelami.'
      : 'This page should route you into the core tools, not compete with them through extra panels.';
  const secondaryTitle =
    language === 'pl' ? 'Narzedzia drugiego kroku' : 'Secondary tools';
  const secondaryDesc =
    language === 'pl'
      ? 'Te strony sa nadal dostepne, ale powinny byc odwiedzane dopiero po podstawowym scenariuszu.'
      : 'These pages remain available, but they should be visited only after the primary scenario flow.';

  return (
    <div className="space-y-8 pb-20">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-none md:px-8 md:py-10">
        <div className="max-w-4xl space-y-6">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
            {t('landing.recovery_home.eyebrow')}
          </p>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {t('landing.recovery_home.title')}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              {t('landing.recovery_home.description')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2 text-sm font-black">
              <Link href="/single-calculator">
                {t('landing.start_calculating')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-sm font-black">
              <Link href="/education">
                {t('landing.recovery_home.secondary_cta')}
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <FeatureStatusPill status="trusted" />
            <FeatureStatusPill status="reference" />
            <FeatureStatusPill status="conditional" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {startHereTitle}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {startHereDesc}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {stepCopy.map((step) => (
            <HomeStep
              key={step.title}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {t('landing.recovery_home.core_route_title')}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {t('landing.recovery_home.core_route_desc')}
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {primaryTools.map((item) => (
            <HomeToolCard key={item.href} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {savedScenarioTitle}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {t('landing.recovery_home.portfolio_empty_desc')}
          </p>
        </div>
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-none">
          <CardContent className="space-y-4 p-6">
            {savedScenarioNames.length === 0 ? (
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                {savedScenarioEmpty}
              </p>
            ) : (
              <div className="space-y-3">
                {savedScenarioNames.map((name) => (
                  <div
                    key={name}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/notebook">
                  <Wallet className="h-4 w-4" />
                  {t('nav.notebook')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/single-calculator">
                  <Calculator className="h-4 w-4" />
                  {t('landing.recovery_home.resume_saved')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {secondaryTitle}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {secondaryDesc}
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {secondaryTools.map((item) => (
            <HomeToolCard key={item.href} item={item} />
          ))}
        </div>
      </section>

      <section>
        <Link href="/recovery-lab" className="block">
          <Card className="rounded-3xl border border-amber-200 bg-amber-50/70 shadow-none transition-colors hover:border-amber-300">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-950">
                  <FlaskConical className="h-4 w-4" />
                  <p className="font-black tracking-tight">
                    {t('landing.recovery_lab.title')}
                  </p>
                </div>
                <p className="max-w-3xl text-sm leading-7 text-amber-950/90">
                  {t('landing.recovery_lab.description')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FeatureStatusPill status="experimental" />
                <span className="text-sm font-semibold text-slate-900">
                  {t('landing.recovery_lab.cta')}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
