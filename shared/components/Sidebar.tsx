'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart2,
  BookOpen,
  Calculator,
  Globe,
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
import { FeatureStatusPill, FeatureStatus } from './FeatureStatusNotice';

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
    return language === 'pl' ? 'Fallback / dane czesciowe' : 'Fallback / partial data';
  }

  return language === 'pl' ? 'Dane moga byc nieaktualne' : 'Data may be stale';
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

function SidebarContent({ onItemClick, dataFreshness }: SidebarContentProps) {
  const pathname = usePathname();
  const { t, language } = useLanguage();

  const navSections: NavSection[] = [
    {
      label: 'Core',
      items: [
        { href: '/education', label: t('nav.education'), icon: BookOpen, status: 'trusted' },
        { href: '/single-calculator', label: t('nav.single_calculator'), icon: Calculator, status: 'trusted' },
        { href: '/economic-data', label: t('nav.economic_data'), icon: BarChart2, status: 'reference' },
      ],
    },
    {
      label: 'Conditional',
      items: [
        { href: '/compare', label: t('nav.comparison'), icon: Scale, status: 'conditional' },
        { href: '/regular-investment', label: t('nav.regular_investment'), icon: TrendingUp, status: 'conditional' },
        { href: '/ladder', label: t('nav.ladder'), icon: Layers, status: 'conditional' },
        { href: '/notebook', label: t('nav.notebook'), icon: Wallet, status: 'conditional' },
      ],
    },
    {
      label: 'Experimental',
      items: [
        { href: '/optimize', label: t('nav.optimizer'), icon: TrendingUp, status: 'experimental' },
        { href: '/multi-asset', label: t('nav.multi_asset'), icon: Globe, status: 'experimental' },
        { href: '/retirement', label: t('nav.retirement') || 'Retirement', icon: Wallet, status: 'limited' },
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
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
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
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-6 border-t bg-slate-100 p-6">
        <div className="space-y-2">
          <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {t('common.language')}
          </span>
          <div className="rounded-2xl border bg-white p-1.5 shadow-sm">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold uppercase tracking-wide">{t('common.version')}</span>
            <span className="rounded-md border bg-white px-2 py-1 font-medium text-slate-700">
              v1.0.0-beta
            </span>
          </div>

          {dataFreshness?.asOf ? (
            <div className="space-y-2 rounded-2xl border bg-white p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold uppercase tracking-wide text-slate-500">
                  {t('common.sync_data')}
                </span>
                <span className="font-medium text-slate-900">{dataFreshness.asOf}</span>
              </div>
              <span
                className={cn(
                  'block rounded-lg border px-3 py-2 text-[11px] font-medium',
                  getFreshnessBadgeClass(dataFreshness),
                )}
              >
                {getFreshnessLabel(dataFreshness, language)}
              </span>
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-3 text-[11px] text-slate-500">
              <p className="font-semibold uppercase tracking-wide">{t('common.sync_data')}</p>
              <p className="mt-1">No sync metadata available.</p>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3 text-center text-[11px] text-slate-500">
            © {new Date().getFullYear()} {t('common.title')}
          </div>
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

