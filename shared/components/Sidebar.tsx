'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
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

interface SidebarContentProps {
  onItemClick?: () => void;
  dataFreshness?: CalculationDataFreshness;
}

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

function getFreshnessBadgeClass(freshness: CalculationDataFreshness) {
  if (freshness.status === 'fresh') {
    return 'text-emerald-700 bg-emerald-100';
  }

  if (freshness.status === 'fallback' || freshness.usedFallback) {
    return 'text-orange-700 bg-orange-100';
  }

  return 'text-amber-700 bg-amber-100';
}

function SidebarContent({ onItemClick, dataFreshness }: SidebarContentProps) {
  const pathname = usePathname();
  const { t, language } = useLanguage();

  const navItems = [
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
      href: '/compare',
      label: t('nav.comparison'),
      icon: Scale,
    },
    {
      href: '/optimize',
      label: t('nav.optimizer'),
      icon: TrendingUp,
    },
    {
      href: '/multi-asset',
      label: t('nav.multi_asset'),
      icon: Globe,
    },
    {
      href: '/ladder',
      label: t('nav.ladder'),
      icon: Layers,
    },
    {
      href: '/regular-investment',
      label: t('nav.regular_investment'),
      icon: TrendingUp,
    },
    {
      href: '/retirement',
      label: t('nav.retirement') || 'Retirement',
      icon: Wallet,
    },
    {
      href: '/economic-data',
      label: t('nav.economic_data'),
      icon: BarChart2,
    },
    {
      href: '/notebook',
      label: t('nav.notebook'),
      icon: Wallet,
    },
  ];

  return (
    <div className="flex h-full flex-col border-r bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden border-b p-8 group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <h1 className="relative z-10 flex items-center gap-3 text-2xl font-black tracking-tighter">
          <div className="rounded-xl bg-primary p-2 shadow-md">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-slate-900">{t('common.title')}</span>
        </h1>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-4 py-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300',
                isActive
                  ? 'text-primary'
                  : 'text-slate-500 hover:bg-black/5 hover:text-slate-900',
              )}
            >
              {isActive ? (
                <motion.div
                  layoutId="active-nav-bg"
                  className="absolute inset-0 rounded-2xl border border-primary/20 bg-primary/10 shadow-sm"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              ) : null}
              {isActive ? (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute left-0 h-6 w-1.5 rounded-full bg-primary shadow-sm"
                  initial={false}
                />
              ) : null}
              <item.icon
                className={cn(
                  'z-10 h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110',
                  isActive
                    ? 'text-primary'
                    : 'text-slate-400 group-hover:text-primary',
                )}
              />
              <span className="z-10 text-sm font-bold tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-8 border-t bg-slate-100 p-8">
        <div className="flex flex-col gap-3">
          <span className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t('common.language')}
          </span>
          <div className="space-y-1 rounded-2xl border bg-white p-1.5 shadow-sm">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
            <span>{t('common.version')}</span>
            <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-slate-600">
              v1.0.0-beta
            </span>
          </div>

          {dataFreshness?.asOf ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                <span>{t('common.sync_data')}</span>
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5',
                    getFreshnessBadgeClass(dataFreshness),
                  )}
                >
                  {dataFreshness.asOf}
                </span>
              </div>
              <span
                className={cn(
                  'block rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-widest',
                  getFreshnessBadgeClass(dataFreshness),
                )}
              >
                {getFreshnessLabel(dataFreshness, language)}
              </span>
            </div>
          ) : null}

          <div className="border-t border-slate-200 pt-4 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
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
              className="border-2 border-primary/20 bg-background/80 shadow-lg backdrop-blur-md"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
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

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r bg-white shadow-lg lg:block">
        <SidebarContent dataFreshness={dataFreshness} />
      </aside>
    </>
  );
}
