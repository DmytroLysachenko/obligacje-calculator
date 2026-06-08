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
import { cn } from '@/lib/utils';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { SidebarUtilityGroup } from './SidebarUtilityGroup';
import { SidebarWorkspaceUtility } from './SidebarWorkspaceUtility';
import { SidebarSettingsUtility } from './SidebarSettingsUtility';
import { SidebarSyncSummary } from './SidebarSyncSummary';

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

function SidebarBrand() {
  const { t } = useAppI18n();

  return (
    <div className="border-b border-border px-4 py-4">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="rounded-md bg-foreground p-1.5 text-background">
          <TrendingUp className="h-3 w-3" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold tracking-tight text-foreground">{t('common.title')}</p>
          <p className="max-w-[11rem] text-xs leading-5 text-muted-foreground">
            {t('sidebar.brand_tagline')}
          </p>
        </div>
      </Link>
    </div>
  );
}

function SidebarSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
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
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        'group relative block rounded-md px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40',
        isActive
          ? 'bg-card text-foreground shadow-sm before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:bg-primary'
          : 'bg-transparent text-muted-foreground hover:bg-card/70 hover:text-foreground',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'rounded-md p-1.5 transition-colors',
            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <p className="min-w-0 text-sm font-medium leading-5">
            {item.label}
          </p>
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 transition-transform',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground group-hover:translate-x-0.5',
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
      <div className="space-y-1.5">
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

function SidebarFooter({
  dataFreshness,
  pathname,
}: {
  dataFreshness?: CalculationDataFreshness;
  pathname: string;
}) {
  const { t } = useAppI18n();
  const hasMounted = useHasMounted();
  const { canManageWorkspace } = usePortfolioAccess();

  return (
    <div className="space-y-4 border-t border-border bg-muted/20 px-3 py-4">
      {canManageWorkspace ? (
        <SidebarUtilityGroup title={t('sidebar.workspace_title')}>
          <SidebarWorkspaceUtility pathname={pathname} />
        </SidebarUtilityGroup>
      ) : null}
      <SidebarUtilityGroup title={t('common.settings')}>
        <SidebarSettingsUtility />
        <SidebarSyncSummary dataFreshness={dataFreshness} />
      </SidebarUtilityGroup>
      <div className="border-t border-border px-0.5 pt-3 text-xs leading-5 text-muted-foreground">
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
    <div className="flex h-full flex-col border-r border-border bg-secondary/70 text-foreground">
      <SidebarBrand />

      <nav
        aria-label={t('common.primary_navigation')}
        className="custom-scrollbar flex-1 space-y-7 overflow-y-auto px-3 py-5"
      >
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
  const { t } = useAppI18n();

  return (
    <>
      <div className="fixed left-3 top-3 z-50 lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('common.open_navigation')}
              className="border border-border bg-card shadow-none"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t('common.open_navigation')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(22rem,100vw)] border-none p-0">
            <SheetTitle className="sr-only">{t('common.navigation_menu')}</SheetTitle>
            <SidebarContent
              onItemClick={() => setIsOpen(false)}
              dataFreshness={dataFreshness}
            />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] border-r border-border bg-secondary/70 lg:block">
        <SidebarContent dataFreshness={dataFreshness} />
      </aside>
    </>
  );
}




