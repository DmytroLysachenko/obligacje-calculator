'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from '@/i18n';
import Link from 'next/link';
import { Calculator, Scale, Layers, TrendingUp, BookOpen, BarChart2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function LandingDashboardClient() {
  const { t } = useLanguage();

  const features = [
    {
      href: '/single-calculator',
      title: t('nav.single_calculator'),
      description: 'Run detailed simulations for individual Polish treasury bonds over their entire lifecycle.',
      icon: Calculator,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      href: '/compare',
      title: t('nav.comparison'),
      description: 'Compare multiple bonds side-by-side to find the best yield for your timeline.',
      icon: Scale,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      href: '/regular-investment',
      title: t('nav.regular_investment'),
      description: 'Simulate monthly or yearly contributions into bonds and watch your wealth grow.',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      href: '/ladder',
      title: t('nav.ladder'),
      description: 'Build a bond ladder strategy to ensure consistent liquidity and optimal interest rates.',
      icon: Layers,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      href: '/economic-data',
      title: t('nav.economic_data'),
      description: 'Track historical inflation and NBP interest rates that affect floating-rate bonds.',
      icon: BarChart2,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10'
    },
    {
      href: '/education',
      title: t('nav.education'),
      description: 'Learn the basics of Polish treasury bonds, taxation, and investment strategies.',
      icon: BookOpen,
      color: 'text-slate-500',
      bg: 'bg-slate-500/10'
    }
  ];

  const containerState: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemState: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-12 pb-20">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 md:p-12 lg:p-16 border shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50 mix-blend-screen" />
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
          >
            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">Polish Bonds</span> Strategy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-xl"
          >
            A comprehensive toolkit designed for investors matching exact Ministry of Finance logic. Project yields, compare inflation scenarios, and build optimal portfolios.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-4"
          >
            <Link href="/single-calculator">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full font-bold shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                Start Calculating <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">Financial Tools</h2>
        </div>

        <motion.div 
          variants={containerState}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, idx) => (
            <motion.div key={idx} variants={itemState}>
              <Link href={feature.href} className="block group h-full">
                <Card className="h-full border-muted/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 bg-card overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 space-y-4 relative z-10">
                    <div className={`p-3 w-fit rounded-2xl ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
