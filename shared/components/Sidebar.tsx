'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart2,
  BookOpen,
  Calculator,
  ChevronRight,
  Layers,
  Menu,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SidebarContentProps {
  onItemClick?: () => void;
  dataFreshness?: CalculationDataFreshness;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
    return language === 'pl' ? 'Aktualne' : 'Fresh';
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return language === 'pl' ? 'Czesciowe' : 'Partial';
  }

  return language === 'pl' ? 'Ostroznie' : 'Caution';
}

function getFreshnessText(
  freshness: CalculationDataFreshness,
  language: 'pl' | 'en',
) {
  if (freshness.status === 'fresh') {
    return language === 'pl'
      ? 'Glowne strony korzystaja z aktualnych metadanych.'
      : 'Core pages are reading current metadata.';
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return language === 'pl'
      ? 'Czesc danych nadal moze byc zastepcza.'
      : 'Some data may still be fallback coverage.';
  }

  return language === 'pl'
    ? 'Czytaj strony pomocnicze ostrozniej.'
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

function SidebarUtilityPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="surface-panel rounded-2xl px-3 py-2.5">{children}</div>;
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
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        'group block rounded-[1.35rem] border px-3.5 py-3.5 transition-all',
        isActive
          ? 'border-slate-900 bg-slate-900 text-white shadow-sm shadow-slate-900/10'
          : 'border-slate-200/80 bg-white/90 text-slate-900 hover:border-slate-300 hover:bg-white',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'rounded-xl p-2',
            isActive ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-700',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <p className="min-w-0 text-[15px] font-semibold leading-5 tracking-tight">
            {item.label}
          </p>
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 transition-transform',
              isActive
                ? 'text-white/70'
                : 'text-slate-400 group-hover:translate-x-0.5',
            )}
          />
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
        },
        {
          href: '/single-calculator',
          label: t('nav.single_calculator'),
          icon: Calculator,
        },
        {
          href: '/economic-data',
          label: t('nav.economic_data'),
          icon: BarChart2,
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
        },
        {
          href: '/regular-investment',
          label: t('nav.regular_investment'),
          icon: TrendingUp,
        },
        {
          href: '/ladder',
          label: t('nav.ladder'),
          icon: Layers,
        },
        {
          href: '/notebook',
          label: t('nav.notebook'),
          icon: Wallet,
        },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(241,245,249,0.96)_100%)] text-slate-900">
      <div className="border-b border-slate-200/80 px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 p-2.5 text-white shadow-sm shadow-slate-900/10">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-[2rem] font-bold tracking-tight">{t('common.title')}</p>
            <p className="max-w-[15rem] text-[13px] leading-6 text-slate-500">
              {language === 'pl'
                ? 'Najpierw glowny kalkulator. Reszta pozniej.'
                : 'Use the core calculator first.'}
            </p>
          </div>
        </Link>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-2.5">
            <p className="px-2 text-[11px] font-semibold tracking-[0.12em] text-slate-500">
              {section.label}
            </p>
            <div className="space-y-2">
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

      <div className="space-y-2 border-t border-slate-200/80 bg-white/55 p-3">
        <SidebarUtilityPanel>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500">
                {t('common.language')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">PL / EN</p>
            </div>
            <LanguageSwitcher />
          </div>
        </SidebarUtilityPanel>

        <SidebarUtilityPanel>
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500">
                  {t('common.sync_data')}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-900">
                  {dataFreshness
                    ? dataFreshness.asOf ?? (language === 'pl' ? 'Brak daty' : 'No date')
                    : language === 'pl'
                      ? 'Brak metadanych'
                      : 'No metadata'}
                </p>
              </div>
              {dataFreshness ? (
                <span
                  className={cn(
                    'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em]',
                    getFreshnessClass(dataFreshness),
                  )}
                >
                  {getFreshnessLabel(dataFreshness, language)}
                </span>
              ) : null}
            </div>

            <p className="text-[12px] leading-5 text-slate-600">
              {dataFreshness
                ? getFreshnessText(dataFreshness, language)
                : t('sidebar.sync_unavailable')}
            </p>
          </div>
        </SidebarUtilityPanel>

        <div className="px-1 pt-1 text-xs text-slate-500">
          {'\u00A9'} {new Date().getFullYear()} {t('common.title')}
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
      <div className="fixed left-3 top-3 z-50 lg:hidden">
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
          <SheetContent side="left" className="w-[min(22rem,100vw)] border-none p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent
              onItemClick={() => setIsOpen(false)}
              dataFreshness={dataFreshness}
            />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[22rem] border-r bg-white lg:block">
        <SidebarContent dataFreshness={dataFreshness} />
      </aside>
    </>
  );
}
