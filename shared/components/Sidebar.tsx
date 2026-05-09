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
import { useLanguage } from '@/i18n';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { FeatureStatus } from './FeatureStatusNotice';

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
      ? 'Czesc danych nadal moze byc zastępcza.'
      : 'Some data may still be fallback coverage.';
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

function SidebarUtilityRow({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  const Icon = icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/88 px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-1.5 text-slate-700">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          {value ? (
            <p className="mt-0.5 text-xs font-medium text-slate-900">{value}</p>
          ) : null}
          {children ? <div className="mt-1.5">{children}</div> : null}
        </div>
      </div>
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
        'group block rounded-2xl border px-3 py-3 transition-colors',
        isActive
          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'rounded-xl p-2',
            isActive ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-700',
          )}
        >
          <item.icon className="h-4 w-4" />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <p className="pr-2 text-sm font-black leading-5 tracking-tight whitespace-normal">
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
  ];

  return (
    <div className="flex h-full flex-col border-r bg-slate-50 text-slate-900">
      <div className="border-b border-slate-200 px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 p-2.5 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight">{t('common.title')}</p>
            <p className="text-xs leading-6 text-slate-500">
              {language === 'pl'
                ? 'Najpierw glowny kalkulator, potem reszta.'
                : 'Use the core calculator first.'}
            </p>
          </div>
        </Link>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-7 overflow-y-auto px-4 py-5">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-3">
            <p className="px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
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

      <div className="space-y-2 border-t border-slate-200 bg-slate-100/55 p-3">
        <SidebarUtilityRow
          icon={Wallet}
          label={t('common.language')}
        >
          <LanguageSwitcher />
        </SidebarUtilityRow>

        <SidebarUtilityRow
          icon={TrendingUp}
          label={t('common.sync_data')}
          value={
            dataFreshness
              ? dataFreshness.asOf ?? (language === 'pl' ? 'Brak daty' : 'No date')
              : language === 'pl'
                ? 'Brak metadanych'
                : 'No metadata'
          }
        >
          {dataFreshness ? (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]',
                  getFreshnessClass(dataFreshness),
                )}
              >
                {getFreshnessLabel(dataFreshness, language)}
              </span>
              <span className="text-[11px] leading-5 text-slate-600">
                {getFreshnessText(dataFreshness, language)}
              </span>
            </div>
          ) : (
            <span className="text-[11px] leading-5 text-slate-600">
              {t('sidebar.sync_unavailable')}
            </span>
          )}
        </SidebarUtilityRow>

        <div className="px-2 pt-1 text-[11px] text-slate-500">
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
          <SheetContent side="left" className="w-80 border-none p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent
              onItemClick={() => setIsOpen(false)}
              dataFreshness={dataFreshness}
            />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-80 border-r bg-white lg:block">
        <SidebarContent dataFreshness={dataFreshness} />
      </aside>
    </>
  );
}
