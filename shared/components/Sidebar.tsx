'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';
import { 
  BookOpen, 
  Calculator, 
  TrendingUp, 
  BarChart2,
  Menu,
  Scale,
  Layers,
  Globe,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';

interface SidebarContentProps {
  onItemClick?: () => void;
  dataFreshness?: CalculationDataFreshness;
}

function SidebarContent({ onItemClick, dataFreshness }: SidebarContentProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

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
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 border-r">
      <div className="p-8 border-b relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 relative z-10">
          <div className="p-2 bg-primary rounded-xl shadow-md">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-slate-900">
            {t('common.title')}
          </span>
        </h1>
      </div>

      <nav className="flex-1 p-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                isActive
                  ? "text-primary"
                  : "text-slate-500 hover:text-slate-900 hover:bg-black/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute left-0 w-1.5 h-6 bg-primary rounded-full shadow-sm"
                  initial={false}
                />
              )}
              <item.icon className={cn(
                "h-5 w-5 shrink-0 z-10 transition-transform duration-300 group-hover:scale-110", 
                isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
              )} />
              <span className="z-10 font-bold text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-8 border-t bg-slate-100 space-y-8">
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
            {t('common.language')}
          </span>
          <div className="bg-white p-1.5 rounded-2xl border shadow-sm space-y-1">
            <LanguageSwitcher />
          </div>
        </div>
        
        <div className="space-y-2 px-1">
          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            <span>Version</span>
            <span className="text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-md">v1.0.0-prod</span>
          </div>
          {dataFreshness?.asOf && (
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              <span>Sync Data</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-md",
                dataFreshness.status === 'fresh' ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100"
              )}>
                {dataFreshness.asOf}
              </span>
            </div>
          )}
          <div className="text-[9px] text-slate-400 font-bold text-center uppercase tracking-widest pt-4 border-t border-slate-200">
            © {new Date().getFullYear()} {t('common.title')}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ dataFreshness }: { dataFreshness?: CalculationDataFreshness }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle via Sheet */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-background/80 backdrop-blur-md shadow-lg border-2 border-primary/20"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-none">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent onItemClick={() => setIsOpen(false)} dataFreshness={dataFreshness} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar - Always visible on large screens */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-72 bg-white border-r shadow-lg">
        <SidebarContent dataFreshness={dataFreshness} />
      </aside>
    </>
  );
}
