'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart2, BookOpen, Calculator, CheckCircle2, Layers, Scale, Sparkles, TrendingUp, Wallet, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { loadSavedScenarios } from '@/features/single-calculator/lib/scenario-storage';
import { FeatureStatus } from '@/shared/components/FeatureStatusNotice';
import { pickLanguageValue } from '@/i18n/locale-utils';

type ToolItem = {
    href: string;
    title: string;
    description: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    status: FeatureStatus;
    tone: string;
};
type HomeStepItem = {
    id: string;
    title: string;
    description: string;
};
function HomeToolCard({ item, language, }: {
    item: ToolItem;
    language: 'pl' | 'en';
}) {
    const routeLabel = item.status === 'trusted'
        ? pickLanguageValue(language, {
            pl: 'Glowna trasa',
            en: 'Primary route'
        }) : item.status === 'reference'
        ? pickLanguageValue(language, {
            pl: 'Kontekst referencyjny',
            en: 'Reference context'
        }) : pickLanguageValue(language, {
        pl: 'Kolejny krok',
        en: 'Next step'
    });
    return (<Link href={item.href} className="block h-full">
      <Card className="surface-panel group h-full overflow-hidden rounded-[2rem] border-white/80 bg-white/82 transition-all hover:-translate-y-0.5 hover:border-white hover:shadow-[0_24px_70px_-36px_rgba(15,23,42,0.34)] focus-within:ring-2 focus-within:ring-primary/25 focus-within:ring-offset-2">
        <CardContent className="relative flex h-full flex-col gap-5 p-6">
          <div className={item.tone}/>
          <div className="relative flex items-start gap-4">
            <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm">
              <item.icon className="h-5 w-5"/>
            </div>
          </div>
          <div className="relative space-y-3">
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              {item.title}
            </h3>
            <p className="text-sm leading-7 text-slate-600 md:text-[15px]">
              {item.description}
            </p>
          </div>
          <div className="relative mt-auto inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span>{routeLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5"/>
          </div>
        </CardContent>
      </Card>
    </Link>);
}
function HomeStep({ title, description, }: {
    title: string;
    description: string;
}) {
    return (<div className="surface-panel rounded-[1.75rem] border-white/85 bg-white/74 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700"/>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>
          <p className="text-sm leading-7 text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>);
}
function HeroTrustStrip({ language, }: {
    language: 'pl' | 'en';
}) {
    const items = pickLanguageValue(language, {
        pl: [
            'Jedno glowne obliczenie naraz',
            'Czytelny kontekst inflacji i NBP',
            'Strategie dopiero po wyniku bazowym',
        ],
        en: [
            'One primary calculation at a time',
            'Readable inflation and NBP context',
            'Strategies only after the baseline result',
        ]
    });
    return (<div className="flex flex-wrap gap-2">
      {items.map((item) => (<span key={item} className="rounded-full border border-white/80 bg-white/68 px-3 py-1.5 text-[11px] font-semibold tracking-[0.04em] text-slate-700 backdrop-blur">
          {item}
        </span>))}
    </div>);
}
function RecentWorkCard({ language, savedScenarioNames, emptyCopy, notebookLabel, calculatorLabel, }: {
    language: 'pl' | 'en';
    savedScenarioNames: string[];
    emptyCopy: string;
    notebookLabel: string;
    calculatorLabel: string;
}) {
    return (<Card className="surface-panel h-full overflow-hidden rounded-[1.9rem] border-white/80 bg-white/78">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-500">
            {pickLanguageValue(language, {
        pl: 'Ostatnia praca',
        en: 'Recent work'
    })}
          </p>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {pickLanguageValue(language, {
        pl: 'Wroc do jednego scenariusza.',
        en: 'Return to one saved scenario.'
    })}
          </h2>
          <p className="text-[15px] leading-7 text-slate-600">
            {savedScenarioNames.length > 0
            ? pickLanguageValue(language, {
                pl: 'Zapisane scenariusze powinny byc szybkim punktem wznowienia, a nie osobnym dashboardem.',
                en: 'Saved scenarios should act as a quick resume point, not a separate dashboard.'
            }) : emptyCopy}
          </p>
        </div>

        {savedScenarioNames.length > 0 ? (<div className="space-y-2">
            {savedScenarioNames.map((name, index) => (<div key={`${name}-${index}`} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900">
                {name}
              </div>))}
          </div>) : null}

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="gap-2 rounded-2xl border-slate-200 bg-white/80 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2">
            <Link href="/notebook">
              <Wallet className="h-4 w-4"/>
              {notebookLabel}
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-2xl border-slate-200 bg-white/80 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2">
            <Link href="/single-calculator">
              <Calculator className="h-4 w-4"/>
              {calculatorLabel}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>);
}
function SectionHeading({ title, description, }: {
    title: string;
    description: string;
}) {
    return (<div className="space-y-2">
      <h2 className="text-2xl font-black tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-7 text-slate-600">
        {description}
      </p>
    </div>);
}
export function LandingDashboardClient() {
    const { t, language } = useLanguage();
    const [savedScenarioNames, setSavedScenarioNames] = React.useState<string[]>([]);
    React.useEffect(() => {
        setSavedScenarioNames(loadSavedScenarios()
            .slice(0, 3)
            .map((scenario) => scenario.name));
    }, []);
    const stepCopy: HomeStepItem[] = pickLanguageValue(language, {
        pl: [
            {
                id: 'learn-rules',
                title: 'Poznaj zasady',
                description: 'Zacznij od edukacji albo od razu od pojedynczego kalkulatora, jesli znasz typ obligacji i horyzont.',
            },
            {
                id: 'run-one',
                title: 'Uruchom jedno obliczenie',
                description: 'Wprowadz jeden zestaw danych, policz scenariusz i sprawdz wynik bez bocznych paneli ani rozpraszaczy.',
            },
            {
                id: 'expand-later',
                title: 'Rozszerz dopiero potem',
                description: 'Porownanie, regularne inwestowanie, drabina i notatnik maja byc drugim krokiem, nie pierwszym widokiem.',
            },
        ],
        en: [
            {
                id: 'learn-rules',
                title: 'Learn the rules',
                description: 'Start with education or go straight to the single calculator if you already know the bond type and horizon.',
            },
            {
                id: 'run-one',
                title: 'Run one calculation',
                description: 'Enter one committed scenario, calculate it cleanly, and read the result without dashboard side panels.',
            },
            {
                id: 'expand-later',
                title: 'Expand only after that',
                description: 'Comparison, recurring investing, ladder strategy, and notebook should stay secondary, not first.',
            },
        ]
    });
    const primaryTools: ToolItem[] = [
        {
            href: '/single-calculator',
            title: t('nav.single_calculator'),
            description: t('landing.cards.single_calculator'),
            icon: Calculator,
            status: 'trusted',
            tone: 'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_65%)]',
        },
        {
            href: '/education',
            title: t('nav.education'),
            description: t('landing.cards.education'),
            icon: BookOpen,
            status: 'trusted',
            tone: 'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_65%)]',
        },
        {
            href: '/economic-data',
            title: t('nav.economic_data'),
            description: t('landing.cards.economic_data'),
            icon: BarChart2,
            status: 'reference',
            tone: 'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(100,116,139,0.14),transparent_65%)]',
        },
    ];
    const secondaryTools: ToolItem[] = [
        {
            href: '/compare',
            title: t('nav.comparison'),
            description: t('landing.cards.comparison'),
            icon: Scale,
            status: 'conditional',
            tone: 'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_65%)]',
        },
        {
            href: '/regular-investment',
            title: t('nav.regular_investment'),
            description: t('landing.cards.regular_investment'),
            icon: TrendingUp,
            status: 'conditional',
            tone: 'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_65%)]',
        },
        {
            href: '/ladder',
            title: t('nav.ladder'),
            description: t('landing.cards.ladder'),
            icon: Layers,
            status: 'conditional',
            tone: 'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_65%)]',
        },
        {
            href: '/notebook',
            title: t('nav.notebook'),
            description: t('landing.recovery_home.notebook_card'),
            icon: Wallet,
            status: 'conditional',
            tone: 'absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_65%)]',
        },
    ];
    const savedScenarioEmpty = pickLanguageValue(language, {
        pl: 'Brak lokalnie zapisanych scenariuszy. Strona startowa nie musi udawac centrum sterowania, gdy nie ma jeszcze zapisanej pracy.',
        en: 'No local saved scenarios yet. The home page should not pretend to be a control center when nothing is saved.'
    });
    const startHereTitle = pickLanguageValue(language, {
        pl: 'Prosta sciezka glowna',
        en: 'Simple primary path'
    });
    const startHereDesc = pickLanguageValue(language, {
        pl: 'Ta strona ma prowadzic do glownych narzedzi i zachowac prosty, spokojny pierwszy krok.',
        en: 'This page should route you into the main tools while keeping the first step calm and obvious.'
    });
    const secondaryTitle = pickLanguageValue(language, {
        pl: 'Narzedzia drugiego kroku',
        en: 'Secondary tools'
    });
    const secondaryDesc = pickLanguageValue(language, {
        pl: 'Te strony sa nadal dostepne, ale powinny byc odwiedzane dopiero po podstawowym scenariuszu.',
        en: 'These pages remain available, but they should be visited only after the primary scenario flow.'
    });
    return (<div className="space-y-8 pb-20 md:space-y-10">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="surface-shell relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#f8fafc_0%,#eff6ff_22%,#eef2ff_52%,#ffffff_100%)] px-5 py-7 md:rounded-[2.5rem] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.2),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.18),transparent_34%)]"/>
          <div className="absolute inset-x-8 top-6 h-px bg-[linear-gradient(90deg,transparent,rgba(14,165,233,0.24),transparent)]"/>
          <div className="absolute -right-10 top-8 h-56 w-56 rounded-full bg-sky-200/35 blur-3xl"/>
          <div className="absolute bottom-2 left-12 h-40 w-40 rounded-full bg-indigo-200/30 blur-3xl"/>
          <div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-100/20 blur-3xl"/>

          <div className="relative max-w-5xl space-y-6 md:space-y-7">
            <p className="surface-chip text-xs font-semibold text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-sky-700"/>
              {t('landing.recovery_home.eyebrow')}
            </p>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-[2.2rem] font-black leading-[0.98] tracking-tight text-slate-950 md:text-6xl">
                {t('landing.recovery_home.title')}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-700 md:text-base md:leading-8">
                {t('landing.recovery_home.description')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 rounded-2xl text-sm font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2">
                <Link href="/single-calculator">
                  {t('landing.start_calculating')}
                  <ArrowRight className="h-4 w-4"/>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 rounded-2xl border-white/90 bg-white/72 text-sm font-semibold backdrop-blur hover:bg-white focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2">
                <Link href="/education">
                  {t('landing.recovery_home.secondary_cta')}
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              <HeroTrustStrip language={language}/>
              <p className="text-[13px] leading-6 text-slate-600">
                {pickLanguageValue(language, {
            pl: 'Najpierw jedno czyste obliczenie, dopiero potem porownania, notatnik i scenariusze poboczne.',
            en: 'Start with one clean calculation before moving into comparisons, notebook work, or side scenarios.'
        })}
              </p>
            </div>
          </div>
        </div>

        <RecentWorkCard language={language} savedScenarioNames={savedScenarioNames} emptyCopy={savedScenarioEmpty} notebookLabel={t('nav.notebook')} calculatorLabel={t('landing.recovery_home.resume_saved')}/>
      </section>

      <section className="space-y-4">
        <SectionHeading title={startHereTitle} description={startHereDesc}/>
        <div className="grid gap-4 lg:grid-cols-3">
          {stepCopy.map((step) => (<HomeStep key={step.id} title={step.title} description={step.description}/>))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title={t('landing.recovery_home.core_route_title')} description={t('landing.recovery_home.core_route_desc')}/>
        <div className="grid gap-4 xl:grid-cols-3">
          {primaryTools.map((item) => (<HomeToolCard key={item.href} item={item} language={language}/>))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title={secondaryTitle} description={secondaryDesc}/>
        <div className="grid gap-4 xl:grid-cols-2">
          {secondaryTools.map((item) => (<HomeToolCard key={item.href} item={item} language={language}/>))}
        </div>
      </section>
    </div>);
}
