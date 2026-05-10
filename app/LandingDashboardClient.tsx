'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Calculator,
  CheckCircle2,
  Layers,
  Scale,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { loadSavedScenarios } from '@/features/single-calculator/lib/scenario-storage';
import { FeatureStatus } from '@/shared/components/FeatureStatusNotice';

type ToolItem = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: FeatureStatus;
  tone: string;
};

function HomeToolCard({ item }: { item: ToolItem }) {
  return (
    <Link href={item.href} className="block h-full">
      <Card className="group h-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white hover:shadow-[0_24px_70px_-36px_rgba(15,23,42,0.5)]">
        <CardContent className="relative flex h-full flex-col gap-5 p-6">
          <div
            className={item.tone}
          />
          <div className="relative flex items-start gap-4">
            <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm">
              <item.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="relative space-y-3">
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
    <div className="rounded-[1.75rem] border border-white/70 bg-white/72 p-5 shadow-[0_16px_44px_-34px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
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

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-7 text-slate-600">
        {description}
      </p>
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
            title: 'Rozszerz dopiero potem',
            description:
              'Porownanie, regularne inwestowanie, drabina i notatnik maja byc drugim krokiem, nie pierwszym widokiem.',
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
      tone:
        'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_65%)]',
    },
    {
      href: '/education',
      title: t('nav.education'),
      description: t('landing.cards.education'),
      icon: BookOpen,
      status: 'trusted',
      tone:
        'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_65%)]',
    },
    {
      href: '/economic-data',
      title: t('nav.economic_data'),
      description: t('landing.cards.economic_data'),
      icon: BarChart2,
      status: 'reference',
      tone:
        'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(100,116,139,0.14),transparent_65%)]',
    },
  ];

  const secondaryTools: ToolItem[] = [
    {
      href: '/compare',
      title: t('nav.comparison'),
      description: t('landing.cards.comparison'),
      icon: Scale,
      status: 'conditional',
      tone:
        'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_65%)]',
    },
    {
      href: '/regular-investment',
      title: t('nav.regular_investment'),
      description: t('landing.cards.regular_investment'),
      icon: TrendingUp,
      status: 'conditional',
      tone:
        'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_65%)]',
    },
    {
      href: '/ladder',
      title: t('nav.ladder'),
      description: t('landing.cards.ladder'),
      icon: Layers,
      status: 'conditional',
      tone:
        'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_65%)]',
    },
    {
      href: '/notebook',
      title: t('nav.notebook'),
      description: t('landing.recovery_home.notebook_card'),
      icon: Wallet,
      status: 'conditional',
      tone:
        'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_65%)]',
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
      ? 'Ta strona ma kierowac do glownych narzedzi i zachowac prosty, spokojny pierwszy krok.'
      : 'This page should route you into the main tools while keeping the first step calm and obvious.';
  const secondaryTitle =
    language === 'pl' ? 'Narzedzia drugiego kroku' : 'Secondary tools';
  const secondaryDesc =
    language === 'pl'
      ? 'Te strony sa nadal dostepne, ale powinny byc odwiedzane dopiero po podstawowym scenariuszu.'
      : 'These pages remain available, but they should be visited only after the primary scenario flow.';

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(135deg,#f8fafc_0%,#f0f9ff_34%,#eef2ff_62%,#ffffff_100%)] px-5 py-7 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)] md:rounded-[2.5rem] md:px-8 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_30%)]" />
        <div className="absolute -right-12 top-10 h-48 w-48 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-36 w-36 rounded-full bg-indigo-200/25 blur-3xl" />

        <div className="relative max-w-5xl space-y-5 md:space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-600 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-sky-700" />
            {t('landing.recovery_home.eyebrow')}
          </p>

          <div className="space-y-4">
            <h1 className="max-w-4xl text-[2.2rem] font-black tracking-tight text-slate-950 md:text-6xl">
              {t('landing.recovery_home.title')}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-700 md:text-base md:leading-8">
              {t('landing.recovery_home.description')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2 rounded-2xl text-sm font-black shadow-sm">
              <Link href="/single-calculator">
                {t('landing.start_calculating')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 rounded-2xl border-white/90 bg-white/70 text-sm font-black backdrop-blur hover:bg-white"
            >
              <Link href="/education">
                {t('landing.recovery_home.secondary_cta')}
              </Link>
            </Button>
          </div>

        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title={startHereTitle} description={startHereDesc} />
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
        <SectionHeading
          title={t('landing.recovery_home.core_route_title')}
          description={t('landing.recovery_home.core_route_desc')}
        />
        <div className="grid gap-4 xl:grid-cols-3">
          {primaryTools.map((item) => (
            <HomeToolCard key={item.href} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title={savedScenarioTitle}
          description={t('landing.recovery_home.portfolio_empty_desc')}
        />
        <Card className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.92))] shadow-[0_22px_60px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
          <CardContent className="space-y-4 p-6">
            {savedScenarioNames.length === 0 ? (
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                {savedScenarioEmpty}
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {savedScenarioNames.map((name) => (
                  <div
                    key={name}
                    className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.4)] backdrop-blur"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="gap-2 rounded-2xl border-slate-200 bg-white/80">
                <Link href="/notebook">
                  <Wallet className="h-4 w-4" />
                  {t('nav.notebook')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 rounded-2xl border-slate-200 bg-white/80">
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
        <SectionHeading title={secondaryTitle} description={secondaryDesc} />
        <div className="grid gap-4 xl:grid-cols-2">
          {secondaryTools.map((item) => (
            <HomeToolCard key={item.href} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
