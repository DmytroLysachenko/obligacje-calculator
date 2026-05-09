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

function getFreshnessText(
  freshness: CalculationDataFreshness,
  language: 'pl' | 'en',
) {
  if (freshness.status === 'fresh') {
    return language === 'pl'
      ? 'Glowne strony odczytuja aktualne metadane.'
      : 'Core pages are reading current metadata.';
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return language === 'pl'
      ? 'Czesc danych nadal moze pochodzic z zestawow zapasowych.'
      : 'Some data may still be coming from fallback coverage.';
  }

  return language === 'pl'
    ? 'Czytaj strony referencyjne ostrozniej.'
    : 'Read reference pages more cautiously.';
}

function getFreshnessClass(freshness: CalculationDataFreshness) {
  if (freshness.status === 'fresh') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return 'border-orange-200 bg-orange-50 text-orange-800';
  }

  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="mt-3 space-y-3 text-sm text-slate-600">{children}</div>
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
        'flex items-center gap-3 rounded-xl px-3 py-3 transition-colors',
        isActive
          ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
          : 'text-slate-600 hover:bg-white hover:text-slate-900',
      )}
    >
      <item.icon
        className={cn(
          'h-4 w-4 shrink-0',
          isActive ? 'text-slate-900' : 'text-slate-400',
        )}
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {item.label}
      </span>
      <FeatureStatusPill status={item.status} />
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
      <div className="border-b px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-bold tracking-tight">
              {t('common.title')}
            </p>
          </div>
        </Link>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              {section.label}
            </p>
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

      <div className="space-y-4 border-t bg-slate-100/80 p-5">
        <SidebarCard title={t('common.language')}>
          <div className="rounded-2xl border bg-white p-1.5">
            <LanguageSwitcher />
          </div>
        </SidebarCard>

        <SidebarCard title={t('common.sync_data')}>
          {dataFreshness ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">
                  {language === 'pl' ? 'Ostatni odczyt' : 'Latest reading'}
                </span>
                <span className="font-medium text-slate-900">
                  {dataFreshness.asOf ??
                    (language === 'pl' ? 'Brak daty' : 'No date')}
                </span>
              </div>
              <span
                className={cn(
                  'inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold',
                  getFreshnessClass(dataFreshness),
                )}
              >
                {getFreshnessLabel(dataFreshness, language)}
              </span>
              <p className="leading-6 text-slate-600">
                {getFreshnessText(dataFreshness, language)}
              </p>
            </>
          ) : (
            <p>{t('sidebar.sync_unavailable')}</p>
          )}
        </SidebarCard>

        <SidebarCard title={t('sidebar.recovery_scope_title')}>
          <p className="leading-6">{t('sidebar.recovery_scope_desc')}</p>
          <Link
            href="/recovery-lab"
            className="inline-flex font-semibold text-slate-900 hover:underline"
          >
            {t('sidebar.open_recovery_lab')}
          </Link>
        </SidebarCard>

        <div className="px-2 text-[11px] text-slate-500">
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
              className="border border-slate-200 bg-white shadow-sm"
            >
              <Menu className="h-5 w-5" />
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
