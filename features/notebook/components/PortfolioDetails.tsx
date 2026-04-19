"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPortfolio, UserInvestmentLot } from '@/db/schema';
import { useLanguage } from '@/i18n';
import { 
  ArrowLeft, 
  TrendingUp, 
  History, 
  PieChart, 
  ArrowUpRight,
  Loader2,
  ExternalLink,
  Plus,
  CalendarDays,
  Zap,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Share2,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, isAfter, parseISO } from 'date-fns';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { PortfolioSimulationResult } from '@/features/bond-core/types/scenarios';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface PortfolioDetailsProps {
  portfolio: UserPortfolio;
  onBack: () => void;
}

export const PortfolioDetails: React.FC<PortfolioDetailsProps> = ({ portfolio, onBack }) => {
  const { t, language } = useLanguage();
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const [lots, setLots] = useState<UserInvestmentLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [simulation, setSimulation] = useState<PortfolioSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPublic, setIsPublic] = useState(portfolio.isPublic || false);
  const [isSharing, setIsSharing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${portfolio.shareId}` : '';

  const handleToggleShare = async () => {
    setIsSharing(true);
    try {
      const response = await fetch('/api/portfolio/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: portfolio.id, isPublic: !isPublic }),
      });
      if (response.ok) {
        setIsPublic(!isPublic);
      }
    } catch (err) {
      console.error('Failed to update sharing:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);
  };

  const fetchLots = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/portfolio/lots?portfolioId=${portfolio.id}`);
      const data = await response.json();
      if (response.ok) {
        setLots(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      console.error('Failed to fetch lots:', err);
    } finally {
      setIsLoading(false);
    }
  }, [portfolio.id]);

  const runSimulation = useCallback(async () => {
    if (lots.length === 0) return;
    setIsSimulating(true);
    try {
      const response = await fetch('/api/portfolio/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: portfolio.id }),
      });
      const data = await response.json();
      if (response.ok) {
        setSimulation(data.result?.result || data.result);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  }, [lots.length, portfolio.id]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  useEffect(() => {
    if (lots.length > 0) {
      runSimulation();
    }
  }, [lots, runSimulation]);

  const formatCurrency = useCallback((val: number) => 
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { 
      style: 'currency', 
      currency: 'PLN', 
      maximumFractionDigits: 0 
    }).format(val), [language]);

  const totalValue = lots.reduce((acc, lot) => acc + (Number(lot.amount) * 100), 0);

  const upcomingMaturities = useMemo(() => {
    if (!lots.length || !definitions) return [];
    return lots.map(lot => {
      const def = definitions[lot.bondType as BondType];
      if (!def) return null;
      const maturityDate = addDays(parseISO(lot.purchaseDate), Math.round(def.duration * 365));
      return {
        ...lot,
        maturityDate,
        formattedMaturity: format(maturityDate, 'MMMM yyyy'),
        value: Number(lot.amount) * 100
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null && isAfter(m.maturityDate, new Date()))
    .sort((a, b) => a.maturityDate.getTime() - b.maturityDate.getTime());
  }, [lots, definitions]);

  const nextMaturity = upcomingMaturities[0] || null;

  const taxAudit = useMemo(() => {
    const standardLots = (lots as (UserInvestmentLot & { taxStrategy?: TaxStrategy })[]).filter(l => !l.taxStrategy || l.taxStrategy === TaxStrategy.STANDARD);
    const totalStandardValue = standardLots.reduce((acc, lot) => acc + (Number(lot.amount) * 100), 0);
    
    // Find specifically large lots that are "Tax Leaks"
    const leakyLots = standardLots
      .filter(l => Number(l.amount) * 100 > 10000)
      .sort((a, b) => Number(b.amount) - Number(a.amount));

    const potentialSavings = totalStandardValue * 0.045; // Approx weighted average tax leak over 10y

    let suggestion = t('notebook.tax_optimized_congrats');
    if (totalStandardValue > 0) {
      if (leakyLots.length > 0) {
        suggestion = t('notebook.tax_leak_action_required', { 
          count: leakyLots.length, 
          type: leakyLots[0].bondType,
          year: format(parseISO(leakyLots[0].purchaseDate), 'yyyy'),
          value: formatCurrency(totalStandardValue)
        });
      } else {
        suggestion = t('notebook.tax_leak_small', { count: standardLots.length });
      }
    }

    return {
      hasLeaks: totalStandardValue > 0,
      totalStandardValue,
      potentialSavings,
      leakyLots,
      suggestion
    };
  }, [lots, formatCurrency, t]);

  if (isLoadingDefs || !definitions) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-primary uppercase">{portfolio.name}</h2>
            <p className="text-muted-foreground font-medium">{portfolio.description || t('notebook.portfolio_details')}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <div className="flex bg-muted p-1 rounded-xl border-2">
             {isPublic && (
               <Button 
                 variant="ghost" 
                 className="rounded-lg h-9 text-xs font-black uppercase gap-2 px-3"
                 onClick={copyToClipboard}
               >
                 {justCopied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
                 {justCopied ? t('common.copied') : t('common.copy_link')}
               </Button>
             )}
             <Button 
               variant={isPublic ? "default" : "ghost"}

               className={cn(
                 "rounded-lg h-9 text-xs font-black uppercase gap-2 px-3",
                 !isPublic && "hover:bg-primary/10 hover:text-primary"
               )}
               onClick={handleToggleShare}
               disabled={isSharing}
             >
               {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
               {isPublic ? t('notebook.public') : t('notebook.private')}
             </Button>
           </div>
           <Button className="rounded-xl font-black gap-2 shadow-lg shadow-primary/20">
             <Plus className="h-4 w-4" />
             {t('notebook.add_lot')}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/70 font-black uppercase text-[10px] tracking-widest">{t('notebook.total_invested')}</CardDescription>
            <CardTitle className="text-4xl font-black">
              {formatCurrency(totalValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs font-bold bg-white/10 w-fit px-2 py-1 rounded-lg">
              <ArrowUpRight className="h-3 w-3" />
              <span>{t('notebook.live_data')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/5 relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">{t('notebook.active_lots')}</CardDescription>
            <CardTitle className="text-4xl font-black text-slate-800">{lots.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
              {lots.length > 0 ? t('notebook.diversified') : t('notebook.no_lots')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/5 bg-slate-50/50">
          <CardHeader className="pb-2">
            <CardDescription className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">{t('notebook.next_maturity')}</CardDescription>
            <CardTitle className="text-2xl font-black text-slate-800">
              {nextMaturity ? format(nextMaturity.maturityDate, 'dd.MM.yyyy') : t('notebook.next_maturity_placeholder')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">
              {nextMaturity ? nextMaturity.bondType : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lots" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl mb-8">
          <TabsTrigger value="lots" className="rounded-xl px-8 font-black uppercase text-xs gap-2">
            <History className="h-4 w-4" />
            {t('notebook.invested_lots_tab')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl px-8 font-black uppercase text-xs gap-2">
            <PieChart className="h-4 w-4" />
            {t('notebook.analytics_tab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lots" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('notebook.holdings')}</h3>
              <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="font-bold uppercase text-xs tracking-widest">{t('notebook.updating')}</p>
                  </div>
                ) : lots.length === 0 ? (
                  <div className="py-20 text-center bg-muted/20 border-2 border-dashed rounded-3xl space-y-4">
                    <div className="p-4 bg-muted w-fit mx-auto rounded-full text-muted-foreground">
                      <History className="h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">{t('notebook.no_lots')}</p>
                  </div>
                ) : (
                  lots.map((lot) => (
                    <Card key={lot.id} className="group hover:border-primary/30 transition-all border-2 shadow-sm rounded-2xl overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row items-center">
                          <div className="p-6 bg-muted/30 border-r border-dashed border-primary/10 min-w-[120px] flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{t('notebook.type')}</span>
                            <span className="text-2xl font-black text-primary">{lot.bondType}</span>
                          </div>
                          <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t('notebook.amount')}</p>
                              <p className="text-lg font-black">{lot.amount} {t('notebook.bond_count')}</p>
                              <p className="text-[10px] font-bold text-slate-400">{t('notebook.nominal_val')}: {Number(lot.amount) * 100} PLN</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t('notebook.purchase_date')}</p>
                              <p className="text-lg font-black">{format(new Date(lot.purchaseDate), 'MMM yyyy')}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t('notebook.current_yield')}</p>
                              <p className="text-lg font-black text-green-600">{t('notebook.current_yield_placeholder')}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="icon" className="rounded-lg hover:border-primary hover:text-primary transition-colors">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-2 border-primary/10 shadow-lg rounded-2xl">
                <CardHeader className="pb-2 border-b border-dashed">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Liquidity Calendar</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {upcomingMaturities.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingMaturities.slice(0, 5).map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-muted/30 rounded-xl border border-border/50">
                          <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{m.formattedMaturity}</p>
                            <p className="text-xs font-bold">{m.bondType} ({m.amount} {t('notebook.bond_count')})</p>
                          </div>
                          <p className="font-black text-sm">{formatCurrency(m.value)}</p>
                        </div>
                      ))}
                      {upcomingMaturities.length > 5 && (
                        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase">+ {upcomingMaturities.length - 5} more events</p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <Calendar className="h-8 w-8 mx-auto text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">No upcoming liquidity events.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-green-600/20 bg-green-50/30 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="pb-2 border-b border-green-100 bg-green-100/20">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-green-800">Tax Health Audit</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {taxAudit.hasLeaks ? (
                    <>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 leading-relaxed text-balance">
                          {taxAudit.suggestion}
                        </p>
                      </div>
                      <div className="bg-white/50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-green-600" />
                          <span className="text-[10px] font-bold uppercase text-green-700">Estimated Savings</span>
                        </div>
                        <span className="font-black text-green-700">~{formatCurrency(taxAudit.potentialSavings)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs font-bold text-green-700">Your portfolio is tax-optimized! ✨</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200 border-2 rounded-2xl shadow-sm overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600 fill-amber-600" />
                    <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest">Strategy Insight</p>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {upcomingMaturities.length < 3 
                      ? "Your portfolio has low liquidity frequency. Consider buying bonds in monthly intervals to create a steady cash-flow stream."
                      : "You have a good maturity spread. Reinvesting your next payout will maintain your ladder's strength."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card className="border-2 shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-dashed">
                <CardTitle className="text-xl font-black uppercase tracking-tight">{t('bonds.growth_projection')}</CardTitle>
                <CardDescription>Aggregated nominal value evolution across all lots</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isSimulating ? (
                  <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Running Portfolio Simulation...</p>
                  </div>
                ) : simulation?.aggregatedTimeline ? (
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={simulation.aggregatedTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis 
                          dataKey="date" 
                          tick={{fontSize: 10}} 
                          tickFormatter={(val) => format(new Date(val), 'yyyy')}
                          minTickGap={50}
                        />
                        <YAxis tick={{fontSize: 10}} tickFormatter={(val) => `${val/1000}k`} />
                        <Tooltip 
                          labelFormatter={(val) => format(new Date(val as string), 'MMMM yyyy')}
                          formatter={(val: ValueType | undefined) => [formatCurrency(Number(val || 0)), 'Total Value']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="totalNetValue" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorNet)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground italic">
                    Add lots to see your portfolio evolution.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
