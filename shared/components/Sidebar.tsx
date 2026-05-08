'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart2,
  BookOpen,
  Calculator,
  FlaskConical,
  Layers,
  Menu,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useLanguage } from '@/i18n';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { FeatureStatus, FeatureStatusPill } from './FeatureStatusNotice';

interface SidebarContentProps {
  onItemClick?: () => void;
  dataFreshness?: CalculationDataFreshness;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: FeatureStatus;
};

type NavSection = {
  label: string;
  items: NavItem[];
  note?: string;
};

function getFreshnessLabel(
  freshness: CalculationDataFreshness,
  language: 'pl' | 'en',
) {
  if (freshness.status === 'fresh') {
    return language === 'pl' ? 'Dane aktualne' : 'Fresh data';
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return language === 'pl'
      ? 'Fallback / dane czesciowe'
      : 'Fallback / partial data';
  }

  return language === 'pl'
    ? 'Dane moga byc nieaktualne'
    : 'Data may be stale';
}

function getFreshnessDetail(
  freshness: CalculationDataFreshness,
  language: 'pl' | 'en',
) {
  if (freshness.status === 'fresh') {
    return language === 'pl'
      ? 'Glowne moduly odczytuja aktualne metadane synchronizacji.'
      : 'Core modules are reading current sync metadata.';
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return language === 'pl'
      ? 'Czesc danych nadal moze pochodzic z wasszych zestawow zapasowych lub waskiego pokrycia.'
      : 'Some modules may still be reading fallback datasets or narrower coverage.';
  }

  return language === 'pl'
    ? 'Sprawdz strony referencyjne ostrozniej, bo metadane swiezosci nie sa jeszcze pelne.'
    : 'Read reference pages more cautiously because freshness metadata is not fully restored yet.';
}

function getFreshnessBadgeClass(freshness: CalculationDataFreshness) {
  if (freshness.status === 'fresh') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return 'border-orange-200 bg-orange-50 text-orange-800';
  }

  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function SidebarInfoCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border bg-white p-3 text-[11px]', className)}>
      <p className="font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <div className="mt-1 space-y-2 text-slate-600">{children}</div>
    </div>
  );
}

function NavLinkItem({
  item,
  isActive,
  onItemClick,
}: {
  item: NavItem;
  isActive: boolean;
  onItemClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors',
        isActive
          ? 'border border-primary/15 bg-primary/10 font-semibold text-primary'
          : 'text-slate-600 hover:bg-white hover:text-slate-900',
      )}
    >
      <item.icon
        className={cn(
          'h-5 w-5 shrink-0',
          isActive ? 'text-primary' : 'text-slate-400',
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">{item.label}</span>
          <FeatureStatusPill status={item.status} className="shrink-0" />
        </div>
      </div>
    </Link>
  );
}

function SidebarContent({ onItemClick, dataFreshness }: SidebarContentProps) {
  const pathname = usePathname();
  const { t, language } = useLanguage();

  const navSections: NavSection[] = [
    {
      label: t('sidebar.sections.core'),
      items: [
        {
          href: '/education',
          label: t('nav.education'),
          icon: BookOpen,
          status: 'trusted',
        },
        {
          href: '/single-calculator',
          label: t('nav.single_calculator'),
          icon: Calculator,
          status: 'trusted',
        },
        {
          href: '/economic-data',
          label: t('nav.economic_data'),
          icon: BarChart2,
          status: 'reference',
        },
      ],
    },
    {
      label: t('sidebar.sections.conditional'),
      items: [
        {
          href: '/compare',
          label: t('nav.comparison'),
          icon: Scale,
          status: 'conditional',
        },
        {
          href: '/regular-investment',
          label: t('nav.regular_investment'),
          icon: TrendingUp,
          status: 'conditional',
        },
        {
          href: '/ladder',
          label: t('nav.ladder'),
          icon: Layers,
          status: 'conditional',
        },
        {
          href: '/notebook',
          label: t('nav.notebook'),
          icon: Wallet,
          status: 'conditional',
        },
      ],
    },
    {
      label: t('sidebar.sections.recovery_lab'),
      note: t('sidebar.recovery_lab_notice'),
      items: [
        {
          href: '/recovery-lab',
          label: t('sidebar.sections.recovery_lab'),
          icon: FlaskConical,
          status: 'experimental',
        },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col border-r bg-slate-50 text-slate-900">
      <div className="border-b px-6 py-7">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <div className="rounded-xl bg-primary p-2 shadow-sm">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span>{t('common.title')}</span>
        </h1>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-4">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {section.label}
            </p>
            {section.note ? (
              <div className="mx-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-5 text-amber-950">
                {section.note}
              </div>
            ) : null}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLinkItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  onItemClick={onItemClick}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-5 border-t bg-slate-100 p-6">
        <div className="space-y-2">
          <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {t('common.language')}
          </span>
          <div className="rounded-2xl border bg-white p-1.5 shadow-sm">
            <LanguageSwitcher />
          </div>
        </div>

        <SidebarInfoCard title={t('common.version')}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">
              Recovery build
            </span>
            <span className="rounded-md border bg-slate-50 px-2 py-1 font-medium text-slate-700">
              v1.0.0-beta
            </span>
          </div>
        </SidebarInfoCard>

        {dataFreshness ? (
          <SidebarInfoCard title={t('common.sync_data')}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">
                {dataFreshness.asOf
                  ? language === 'pl'
                    ? 'Ostatni odczyt'
                    : 'Latest reading'
                  : language === 'pl'
                    ? 'Status'
                    : 'Status'}
              </span>
              <span className="font-medium text-slate-900">
                {dataFreshness.asOf ??
                  (language === 'pl' ? 'Brak daty' : 'No date')}
              </span>
            </div>
            <span
              className={cn(
                'block rounded-lg border px-3 py-2 font-medium',
                getFreshnessBadgeClass(dataFreshness),
              )}
            >
              {getFreshnessLabel(dataFreshness, language)}
            </span>
            <p className="leading-5 text-slate-600">
              {getFreshnessDetail(dataFreshness, language)}
            </p>
          </SidebarInfoCard>
        ) : (
          <SidebarInfoCard title={t('common.sync_data')}>
            <p>{t('sidebar.sync_unavailable')}</p>
          </SidebarInfoCard>
        )}

        <SidebarInfoCard title={t('sidebar.recovery_scope_title')}>
          <p className="leading-5">{t('sidebar.recovery_scope_desc')}</p>
          <Link
            href="/recovery-lab"
            className="inline-flex font-semibold text-primary hover:underline"
          >
            {t('sidebar.open_recovery_lab')}
          </Link>
        </SidebarInfoCard>

        <div className="border-t border-slate-200 pt-3 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} {t('common.title')}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  dataFreshness,
}: {
  dataFreshness?: CalculationDataFreshness;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border border-primary/20 bg-background/90 shadow-md backdrop-blur"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-none p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent
              onItemClick={() => setIsOpen(false)}
              dataFreshness={dataFreshness}
            />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r bg-white lg:block">
        <SidebarContent dataFreshness={dataFreshness} />
      </aside>
    </>
  );
}
