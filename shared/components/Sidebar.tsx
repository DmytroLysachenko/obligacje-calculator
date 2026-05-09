'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart2,
  BookOpen,
  Calculator,
  ChevronRight,
  FlaskConical,
  Globe2,
  Layers,
  Menu,
  Scale,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  description: {
    pl: string;
    en: string;
  };
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
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          {value ? (
            <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
          ) : null}
          {children ? <div className="mt-2">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

function NavLinkItem({
  item,
  isActive,
  onItemClick,
  language,
}: {
  item: NavItem;
  isActive: boolean;
  onItemClick?: () => void;
  language: 'pl' | 'en';
}) {
  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        'group block rounded-3xl border px-4 py-4 transition-colors',
        isActive
          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'rounded-2xl p-2.5',
            isActive ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-700',
          )}
        >
          <item.icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight">
                {item.label}
              </p>
              <p
                className={cn(
                  'mt-1 text-xs leading-6',
                  isActive ? 'text-white/75' : 'text-slate-600',
                )}
              >
                {language === 'pl' ? item.description.pl : item.description.en}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <FeatureStatusPill status={item.status} />
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  isActive
                    ? 'text-white/70'
                    : 'text-slate-400 group-hover:translate-x-0.5',
                )}
              />
            </div>
          </div>
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
          description: {
            pl: 'Podstawy indeksacji, podatku i mechaniki obligacji.',
            en: 'Bond mechanics, taxation, and indexing basics.',
          },
        },
        {
          href: '/single-calculator',
          label: t('nav.single_calculator'),
          icon: Calculator,
          status: 'trusted',
          description: {
            pl: 'Glowny kalkulator jednego scenariusza i jednego wyniku.',
            en: 'The main one-scenario, one-result calculator.',
          },
        },
        {
          href: '/economic-data',
          label: t('nav.economic_data'),
          icon: BarChart2,
          status: 'reference',
          description: {
            pl: 'Makro kontekst: inflacja, NBP i zakres danych.',
            en: 'Macro context: inflation, NBP, and data coverage.',
          },
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
          description: {
            pl: 'Jedno wspolne porownanie wielu obligacji.',
            en: 'One shared comparison across multiple bonds.',
          },
        },
        {
          href: '/regular-investment',
          label: t('nav.regular_investment'),
          icon: TrendingUp,
          status: 'conditional',
          description: {
            pl: 'Plan regularnych zakupow i budowy kapitalu.',
            en: 'Recurring purchases and capital-building plan.',
          },
        },
        {
          href: '/ladder',
          label: t('nav.ladder'),
          icon: Layers,
          status: 'conditional',
          description: {
            pl: 'Plynnosc i rozklad zapadalnosci w drabinie.',
            en: 'Liquidity and maturity spacing in a ladder.',
          },
        },
        {
          href: '/notebook',
          label: t('nav.notebook'),
          icon: Wallet,
          status: 'conditional',
          description: {
            pl: 'Notatnik partii, zapadalnosci i prostych rekordow.',
            en: 'Notebook for lots, maturities, and saved records.',
          },
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
          description: {
            pl: 'Powierzchnie poboczne i slabsze scenariusze.',
            en: 'Secondary and weaker-support scenario surfaces.',
          },
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
                  language={language}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-slate-200 bg-slate-100/70 p-4">
        <SidebarUtilityRow
          icon={Globe2}
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
                  'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
                  getFreshnessClass(dataFreshness),
                )}
              >
                {getFreshnessLabel(dataFreshness, language)}
              </span>
              <span className="text-xs leading-6 text-slate-600">
                {getFreshnessText(dataFreshness, language)}
              </span>
            </div>
          ) : (
            <span className="text-xs leading-6 text-slate-600">
              {t('sidebar.sync_unavailable')}
            </span>
          )}
        </SidebarUtilityRow>

        <SidebarUtilityRow
          icon={ShieldAlert}
          label={t('sidebar.recovery_scope_title')}
          value={language === 'pl' ? 'Core-first' : 'Core-first'}
        >
          <div className="space-y-2">
            <p className="text-xs leading-6 text-slate-600">
              {language === 'pl'
                ? 'Poboczne i slabsze powierzchnie nie powinny dominowac nad glowna nawigacja.'
                : 'Secondary and weaker-support surfaces should not dominate the main navigation.'}
            </p>
            <Link
              href="/recovery-lab"
              className="inline-flex text-xs font-semibold text-slate-900 hover:underline"
            >
              {t('sidebar.open_recovery_lab')}
            </Link>
          </div>
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
