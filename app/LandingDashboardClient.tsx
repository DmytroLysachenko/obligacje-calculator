'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart2,
  Bell,
  BookOpen,
  Calendar,
  Calculator,
  Clock3,
  FlaskConical,
  Layers,
  Scale,
  ShieldAlert,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { PortfolioSimulationCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { BondType } from '@/features/bond-core/types';
import { loadSavedScenarios } from '@/features/single-calculator/lib/scenario-storage';
import {
  DashboardNotification,
  buildDashboardNotifications,
  loadUserExperienceState,
  markNotificationsRead,
  setLastVisitNow,
  toggleFavoriteBond,
  UserExperienceState,
} from '@/shared/lib/user-experience-storage';
import { FeatureStatus, FeatureStatusPill } from '@/shared/components/FeatureStatusNotice';
import { useChartData } from '@/shared/hooks/useChartData';

type ToolItem = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: FeatureStatus;
  emphasis: 'primary' | 'secondary';
};

type UpcomingEvent = {
  bondType: string;
  date: string;
  label: string;
  amount: number;
};

function formatCurrency(language: 'pl' | 'en', amount: number) {
  return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildUpcomingEvents(
  summary: PortfolioSimulationCalculationEnvelope['result'] | undefined,
  t: (key: string) => string,
) {
  if (!summary?.items?.length) {
    return [];
  }

  const now = new Date();
  const thirtyDaysFromNow = addDays(now, 30);

  return summary.items
    .flatMap((item) =>
      item.result.timeline
        .filter((point) => point.isMaturity || point.isWithdrawal)
        .map((point) => ({
          bondType: item.bondType,
          date: point.cycleEndDate,
          label: point.isMaturity ? t('bonds.maturity') : t('bonds.interest_payment'),
          amount: point.totalValue || point.netInterest,
        })),
    )
    .filter(
      (event) =>
        isAfter(parseISO(event.date), now) &&
        isBefore(parseISO(event.date), thirtyDaysFromNow),
    )
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
}

function ToolCard({
  item,
}: {
  item: ToolItem;
}) {
  return (
    <Link href={item.href} className="block h-full">
      <Card className="h-full border transition-colors hover:border-primary/40 hover:bg-muted/20">
        <CardContent className="flex h-full gap-4 p-5">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <item.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                {item.title}
              </h3>
              <FeatureStatusPill status={item.status} className="shrink-0" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="space-y-2 p-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className={accent ? 'text-2xl font-black text-primary' : 'text-2xl font-black'}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function LandingDashboardClient() {
  const { t, language } = useLanguage();
  const { data: summaryEnvelope } =
    useChartData<PortfolioSimulationCalculationEnvelope>('/api/portfolio/summary');
  const [experience, setExperience] = React.useState<UserExperienceState | null>(null);
  const [savedScenarioNames, setSavedScenarioNames] = React.useState<string[]>([]);

  const summary = summaryEnvelope?.result;
  const hasPortfolio = !!summary && summary.items.length > 0;

  const upcomingEvents = React.useMemo<UpcomingEvent[]>(
    () => buildUpcomingEvents(summary, t),
    [summary, t],
  );

  React.useEffect(() => {
    const nextExperience = loadUserExperienceState();
    setExperience(nextExperience);
    setSavedScenarioNames(
      loadSavedScenarios()
        .slice(0, 3)
        .map((scenario) => scenario.name),
    );
    setLastVisitNow();
  }, []);

  const notifications = React.useMemo<DashboardNotification[]>(() => {
    if (!experience) {
      return [];
    }

    return buildDashboardNotifications(upcomingEvents, experience);
  }, [experience, upcomingEvents]);

  const favoriteBonds = experience?.dashboardPreferences.favoriteBonds ?? [];
  const recentVisitLabel = experience?.lastVisitAt
    ? new Date(experience.lastVisitAt).toLocaleString()
    : t('landing.since_last_visit.first_recorded');

  const handleDismissNotifications = () => {
    if (notifications.length === 0 || !experience) {
      return;
    }

    const next = markNotificationsRead(
      notifications.map((notification) => notification.id),
    );
    setExperience(next);
  };

  const handleToggleFavorite = (bondType: BondType) => {
    const next = toggleFavoriteBond(bondType);
    setExperience(next);
  };

  const tools: ToolItem[] = [
    {
      href: '/single-calculator',
      title: t('nav.single_calculator'),
      description: t('landing.cards.single_calculator'),
      icon: Calculator,
      status: 'trusted',
      emphasis: 'primary',
    },
    {
      href: '/education',
      title: t('nav.education'),
      description: t('landing.cards.education'),
      icon: BookOpen,
      status: 'trusted',
      emphasis: 'primary',
    },
    {
      href: '/economic-data',
      title: t('nav.economic_data'),
      description: t('landing.cards.economic_data'),
      icon: BarChart2,
      status: 'reference',
      emphasis: 'primary',
    },
    {
      href: '/compare',
      title: t('nav.comparison'),
      description: t('landing.cards.comparison'),
      icon: Scale,
      status: 'conditional',
      emphasis: 'secondary',
    },
    {
      href: '/regular-investment',
      title: t('nav.regular_investment'),
      description: t('landing.cards.regular_investment'),
      icon: TrendingUp,
      status: 'conditional',
      emphasis: 'secondary',
    },
    {
      href: '/ladder',
      title: t('nav.ladder'),
      description: t('landing.cards.ladder'),
      icon: Layers,
      status: 'conditional',
      emphasis: 'secondary',
    },
    {
      href: '/notebook',
      title: t('nav.notebook'),
      description: t('landing.recovery_home.notebook_card'),
      icon: Wallet,
      status: 'conditional',
      emphasis: 'secondary',
    },
  ];

  const coreTools = tools.filter((item) => item.emphasis === 'primary');
  const secondaryTools = tools.filter((item) => item.emphasis === 'secondary');
  const favoriteBondCandidates = (
    favoriteBonds.length > 0
      ? favoriteBonds
      : [BondType.EDO, BondType.COI, BondType.TOS]
  ).slice(0, 4);

  return (
    <div className="space-y-8 pb-20">
      <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
        <div className="max-w-4xl space-y-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            {t('landing.recovery_home.eyebrow')}
          </p>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {t('landing.recovery_home.title')}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
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
                <BookOpen className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-black uppercase">
              {t('landing.recovery_home.status_trusted')}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-black uppercase">
              {t('landing.recovery_home.status_explicit')}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-black uppercase">
              {t('landing.recovery_home.status_reference')}
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_360px]">
        <div className="space-y-6">
          <Card className="border-2 border-primary/15 bg-primary/5">
            <CardHeader className="space-y-2 border-b bg-white/60">
              <CardTitle className="text-lg font-black tracking-tight text-slate-950">
                {t('landing.recovery_home.core_route_title')}
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {t('landing.recovery_home.core_route_desc')}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-3">
              {coreTools.map((item) => (
                <ToolCard key={item.href} item={item} />
              ))}
            </CardContent>
          </Card>

          {hasPortfolio ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-black tracking-tight">
                  {t('landing.portfolio_overview')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label={t('bonds.total_invested')}
                    value={formatCurrency(language, summary.summary.totalInvested)}
                  />
                  <MetricCard
                    label={t('bonds.total_net_value')}
                    value={formatCurrency(language, summary.summary.totalNetValue)}
                    accent
                  />
                  <MetricCard
                    label={t('common.net_profit')}
                    value={`+${formatCurrency(language, summary.summary.totalProfit)}`}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
                      {t('landing.upcoming_events')}
                    </h3>
                    <Link
                      href="/notebook"
                      className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                    >
                      {t('landing.manage_portfolio')}
                    </Link>
                  </div>

                  {upcomingEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                      {t('landing.no_events_30d')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.slice(0, 4).map((event) => (
                        <div
                          key={`${event.bondType}-${event.date}-${event.label}`}
                          className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-primary/10 p-2 text-primary">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {event.bondType} · {event.label}
                              </p>
                              <p className="text-sm text-muted-foreground">{event.date}</p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="w-fit bg-emerald-50 font-black text-emerald-700"
                          >
                            +{formatCurrency(language, event.amount)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-black tracking-tight">
                  {t('landing.recovery_home.portfolio_empty_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t('landing.recovery_home.portfolio_empty_desc')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline" className="gap-2">
                    <Link href="/notebook">
                      <Wallet className="h-4 w-4" />
                      {t('nav.notebook')}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="gap-2">
                    <Link href="/single-calculator">
                      <Calculator className="h-4 w-4" />
                      {t('landing.recovery_home.resume_saved')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-black tracking-tight">
                {t('landing.recovery_home.secondary_tools_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              {secondaryTools.map((item) => (
                <ToolCard key={item.href} item={item} />
              ))}
            </CardContent>
          </Card>

          <Link href="/recovery-lab" className="block">
            <Card className="border border-amber-200 bg-amber-50/70 transition-colors hover:border-amber-300">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-950">
                    <ShieldAlert className="h-4 w-4" />
                    <p className="font-black tracking-tight">
                      {t('landing.recovery_lab.title')}
                    </p>
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-amber-950/90">
                    {t('landing.recovery_lab.description')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <FeatureStatusPill status="experimental" />
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FlaskConical className="h-4 w-4 text-amber-700" />
                    {t('landing.recovery_lab.cta')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Clock3 className="h-4 w-4 text-primary" />
                {t('landing.since_last_visit.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <p className="text-sm text-muted-foreground">{recentVisitLabel}</p>
              <div className="rounded-2xl border bg-primary/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                  {t('landing.since_last_visit.suggested_action')}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {upcomingEvents.length > 0
                    ? t('landing.since_last_visit.suggested_action_events')
                    : t('landing.since_last_visit.suggested_action_no_events')}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  {t('landing.since_last_visit.recent_scenarios')}
                </p>
                {savedScenarioNames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('landing.since_last_visit.no_scenarios')}
                  </p>
                ) : (
                  savedScenarioNames.map((name) => (
                    <div key={name} className="rounded-xl border px-3 py-2 text-sm font-semibold">
                      {name}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Bell className="h-4 w-4 text-primary" />
                {t('landing.notifications.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('landing.notifications.empty')}
                </p>
              ) : (
                notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black uppercase">
                        {notification.severity}
                      </Badge>
                    </div>
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        className="mt-3 inline-flex text-xs font-black uppercase tracking-widest text-primary hover:underline"
                      >
                        {t('landing.notifications.open')}
                      </Link>
                    ) : null}
                  </div>
                ))
              )}

              {notifications.length > 0 ? (
                <Button variant="outline" className="text-xs font-black" onClick={handleDismissNotifications}>
                  {t('landing.notifications.mark_all_read')}
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Star className="h-4 w-4 text-primary" />
                {t('landing.favorite_bonds.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {favoriteBondCandidates.map((bondType) => {
                const active = favoriteBonds.includes(bondType);

                return (
                  <button
                    key={bondType}
                    type="button"
                    onClick={() => handleToggleFavorite(bondType)}
                    className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors hover:border-primary/40"
                  >
                    <span className="font-semibold text-slate-900">{bondType}</span>
                    <Star
                      className={`h-4 w-4 ${
                        active ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
