'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from '@/i18n';
import Link from 'next/link';
import { Calculator, Scale, Layers, TrendingUp, BookOpen, BarChart2, ArrowRight, Briefcase, PieChart as PieChartIcon, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChartData } from '@/shared/hooks/useChartData';
import { PortfolioSimulationCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getBondColor } from '@/shared/constants/bond-colors';
import { BondType } from '@/features/bond-core/types';
import { isAfter, isBefore, addDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface DistributionItem {
  name: string;
  value: number;
}

export function LandingDashboardClient() {
  const { t, language } = useLanguage();
  const { data: summaryEnvelope } = useChartData<PortfolioSimulationCalculationEnvelope>('/api/portfolio/summary');
  
  const summary = summaryEnvelope?.result;
  const hasPortfolio = summary && summary.items.length > 0;

  const distributionData = React.useMemo(() => {
    if (!summary) return [];
    const dist: Record<string, number> = {};
    summary.items.forEach(item => {
      dist[item.bondType] = (dist[item.bondType] || 0) + item.amount;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [summary]);

  const features = [
    {
      href: '/single-calculator',
      title: t('nav.single_calculator'),
      description: t('landing.cards.single_calculator'),
      icon: Calculator,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      href: '/compare',
      title: t('nav.comparison'),
      description: t('landing.cards.comparison'),
      icon: Scale,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      href: '/regular-investment',
      title: t('nav.regular_investment'),
      description: t('landing.cards.regular_investment'),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      href: '/ladder',
      title: t('nav.ladder'),
      description: t('landing.cards.ladder'),
      icon: Layers,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      href: '/economic-data',
      title: t('nav.economic_data'),
      description: t('landing.cards.economic_data'),
      icon: BarChart2,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10'
    },
    {
      href: '/education',
      title: t('nav.education'),
      description: t('landing.cards.education'),
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
            {t('landing.hero_title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">{t('landing.hero_title_accent')}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-xl"
          >
            {t('landing.hero_description')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-4 flex flex-wrap gap-4"
          >
            <Link href="/single-calculator">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full font-bold shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                {t('landing.start_calculating')} <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            {hasPortfolio && (
              <Link href="/notebook">
                <button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 px-8 py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> {t('nav.notebook')}
                </button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {hasPortfolio && (
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                {t('landing.portfolio_overview')}
              </h2>
              <Link href="/notebook" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest flex items-center gap-1">
                {t('landing.manage_portfolio')} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-2 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{t('bonds.total_invested')}</p>
                  <p className="text-2xl font-black">{new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(summary!.summary.totalInvested)}</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm bg-primary/5">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">{t('bonds.total_net_value')}</p>
                  <p className="text-2xl font-black text-primary">{new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(summary!.summary.totalNetValue)}</p>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{t('common.net_profit')}</p>
                  <p className="text-2xl font-black text-green-600">+{new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(summary!.summary.totalProfit)}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {t('landing.upcoming_events')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {summary!.items.length > 0 ? (
                    (() => {
                      const thirtyDaysFromNow = addDays(new Date(), 30);
                      const events = summary!.items
                        .flatMap(item => item.result.timeline
                          .filter(p => p.isMaturity || p.isWithdrawal)
                          .map(p => ({
                            type: item.bondType,
                            date: p.cycleEndDate,
                            label: p.isMaturity ? t('bonds.maturity') : t('bonds.interest_payment'),
                            amount: p.totalValue || p.netInterest
                          }))
                        )
                        .filter(e => isAfter(parseISO(e.date), new Date()) && isBefore(parseISO(e.date), thirtyDaysFromNow))
                        .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

                      if (events.length === 0) {
                        return (
                          <div className="p-8 text-center space-y-2">
                            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto opacity-20" />
                            <p className="text-sm font-medium text-muted-foreground">{t('landing.no_events_30d')}</p>
                          </div>
                        );
                      }

                      return events.map((event, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-black">{event.type} - {event.label}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{event.date}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="font-black text-green-600 bg-green-50">
                            +{new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { style: 'currency', currency: 'PLN' }).format(event.amount)}
                          </Badge>
                        </div>
                      ));
                    })()
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-black tracking-tight">{t('landing.diversification')}</h2>
            </div>
            <Card className="border-2 shadow-xl h-[400px]">
              <CardContent className="p-0 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distributionData.map((entry: DistributionItem, index: number) => (
                        <Cell key={`cell-${index}`} fill={getBondColor(entry.name as BondType)} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: unknown) => {
                        if (val === undefined || val === null) return '';
                        return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(Number(val));
                      }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </aside>
        </motion.section>
      )}

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">{t('landing.financial_tools')}</h2>
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
