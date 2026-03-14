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
  Layers
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
      href: '/',
      label: t('nav.single_calculator'),
      icon: Calculator,
    },
    {
      href: '/compare',
      label: t('nav.comparison'),
      icon: Scale,
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
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-background/80 backdrop-blur-sm">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-card border-r shadow-sm transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b bg-muted/20">
            <h1 className="text-2xl font-black tracking-tighter text-primary flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>{t('common.title')}</span>
            </h1>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-primary/10 rounded-lg"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("h-5 w-5 shrink-0 z-10", isActive && "text-primary")} />
                  <span className="z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t bg-muted/10 space-y-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                {t('common.language')}
              </span>
              <LanguageSwitcher />
            </div>
            <div className="text-[10px] text-muted-foreground text-center">
              © {new Date().getFullYear()} {t('common.title')}
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
