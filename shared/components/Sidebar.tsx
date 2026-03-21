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
  X,
  Scale,
  Layers,
  Globe,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { motion } from 'framer-motion';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-background/80 backdrop-blur-md shadow-lg border-2 border-primary/20">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 border-r border-white/5 shadow-2xl transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
          <div className="p-8 border-b border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 relative z-10">
              <div className="p-2 bg-primary rounded-xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
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
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/20 shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.1)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute left-0 w-1.5 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                      initial={false}
                    />
                  )}
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 z-10 transition-transform duration-300 group-hover:scale-110", 
                    isActive ? "text-white" : "text-slate-500 group-hover:text-white"
                  )} />
                  <span className="z-10 font-bold text-sm tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-8 border-t border-white/5 bg-black/20 space-y-8">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                {t('common.language')}
              </span>
              <div className="bg-white/5 p-1.5 rounded-2xl border border-white/5">
                <LanguageSwitcher />
              </div>
            </div>
            <div className="text-[10px] text-slate-600 font-bold text-center uppercase tracking-widest">
              © {new Date().getFullYear()} {t('common.title')}
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
