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
import { useAppI18n } from '@/i18n/client';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SidebarUtilityGroup, SidebarUtilityPanel } from './SidebarUtilityGroup';
import { SidebarWorkspaceUtility } from './SidebarWorkspaceUtility';

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
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (freshness.status === 'fresh') {
    return t('sidebar.freshness.fresh');
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return t('sidebar.freshness.partial');
  }

  return t('sidebar.freshness.caution');
}

function getFreshnessText(
  freshness: CalculationDataFreshness,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (freshness.status === 'fresh') {
    return t('sidebar.freshness.text_fresh');
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return t('sidebar.freshness.text_partial');
  }

  return t('sidebar.freshness.text_caution');
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

function SidebarBrand() {
  const { t } = useAppI18n();

  return (
    <div className="border-b border-slate-200/80 px-4 py-3">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="rounded-xl bg-slate-900 p-1.5 text-white shadow-sm shadow-slate-900/10">
          <TrendingUp className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[1rem] font-bold tracking-tight">{t('common.title')}</p>
          <p className="max-w-[13rem] text-[10px] leading-5 text-slate-500">
            {t('sidebar.brand_tagline')}
          </p>
        </div>
      </Link>
    </div>
  );
}

function SidebarSectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-2 text-xs font-semibold text-slate-500">{children}</p>;
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
        'group block rounded-[1.35rem] border px-3.5 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
        isActive
          ? 'border-sky-200/80 bg-[linear-gradient(135deg,rgba(219,234,254,0.92),rgba(239,246,255,0.96))] text-slate-950 shadow-sm shadow-sky-100/50'
          : 'border-slate-200/80 bg-white/90 text-slate-900 hover:border-slate-300 hover:bg-white',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'rounded-xl p-2',
            isActive ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' : 'bg-slate-100 text-slate-700',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <p className="min-w-0 text-[15px] font-semibold leading-5 tracking-tight md:text-base">
            {item.label}
          </p>
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 transition-transform',
              isActive
                ? 'text-slate-500'
                : 'text-slate-400 group-hover:translate-x-0.5',
            )}
          />
        </div>
      </div>
    </Link>
  );
}

function NavSectionBlock({
  section,
  pathname,
  onItemClick,
}: {
  section: NavSection;
  pathname: string;
  onItemClick?: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <SidebarSectionLabel>{section.label}</SidebarSectionLabel>
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
  );
}

function SidebarLanguageUtility() {
  const { t } = useAppI18n();

  return (
    <SidebarUtilityPanel>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{t('common.language')}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">PL / EN</p>
        </div>
        <div className="justify-self-end">
          <LanguageSwitcher />
        </div>
      </div>
    </SidebarUtilityPanel>
  );
}

function SidebarSyncUtility({
  dataFreshness,
}: {
  dataFreshness?: CalculationDataFreshness;
}) {
  const { t } = useAppI18n();

  return (
    <SidebarUtilityPanel>
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">{t('common.sync_data')}</p>
            <p className="mt-0.5 text-[13px] font-semibold text-slate-900">
              {dataFreshness
                ? dataFreshness.asOf ?? t('sidebar.freshness.no_date')
                : t('sidebar.freshness.no_metadata')}
            </p>
          </div>
          {dataFreshness ? (
            <span
              className={cn(
                'inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold',
                getFreshnessClass(dataFreshness),
              )}
            >
              {getFreshnessLabel(dataFreshness, t)}
            </span>
          ) : null}
        </div>

        <p className="text-xs leading-5 text-slate-600">
          {dataFreshness
            ? getFreshnessText(dataFreshness, t)
            : t('sidebar.sync_unavailable')}
        </p>
      </div>
    </SidebarUtilityPanel>
  );
}

function SidebarFooter({
  dataFreshness,
  pathname,
}: {
  dataFreshness?: CalculationDataFreshness;
  pathname: string;
}) {
  const { t } = useAppI18n();
  const hasMounted = useHasMounted();

  return (
    <div className="space-y-3 border-t border-slate-200/80 bg-white/55 p-3">
      <SidebarUtilityGroup title={t('sidebar.workspace_title')}>
        <SidebarWorkspaceUtility pathname={pathname} />
      </SidebarUtilityGroup>
      <SidebarUtilityGroup title={t('common.settings')}>
        <SidebarLanguageUtility />
        <SidebarSyncUtility dataFreshness={dataFreshness} />
      </SidebarUtilityGroup>
      <div className="px-1 pt-1 text-xs text-slate-500">
        {'\u00A9'} {hasMounted ? new Date().getFullYear() : '----'} {t('common.title')}
      </div>
    </div>
  );
}

function SidebarContent({ onItemClick, dataFreshness }: SidebarContentProps) {
  const pathname = usePathname();
  const { t } = useAppI18n();

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
      <SidebarBrand />

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {navSections.map((section) => (
          <NavSectionBlock
            key={section.label}
            section={section}
            pathname={pathname}
            onItemClick={onItemClick}
          />
        ))}
      </nav>

      <SidebarFooter dataFreshness={dataFreshness} pathname={pathname} />
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




