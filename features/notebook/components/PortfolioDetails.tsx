
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserPortfolio, UserInvestmentLot } from '@/db/schema';
import { useLanguage } from '@/i18n';
import { 
  ArrowLeft, 
  TrendingUp, 
  History, 
  PieChart, 
  ArrowUpRight,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

interface PortfolioDetailsProps {
  portfolio: UserPortfolio;
  onBack: () => void;
}

export const PortfolioDetails: React.FC<PortfolioDetailsProps> = ({ portfolio, onBack }) => {
  const { t, language } = useLanguage();
  const [lots, setLots] = useState<UserInvestmentLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLots = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/portfolio/lots?portfolioId=${portfolio.id}`);
      if (response.ok) {
        const data = await response.json();
        setLots(data);
      }
    } catch (err) {
      console.error('Failed to fetch lots:', err);
    } finally {
      setIsLoading(false);
    }
  }, [portfolio.id]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  const totalValue = lots.reduce((acc, lot) => acc + (Number(lot.amount) * 100), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">{portfolio.name}</h2>
          <p className="text-muted-foreground font-medium">{portfolio.description || t('notebook.portfolio_details')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/70 font-black uppercase text-[10px] tracking-widest">{t('notebook.total_invested')}</CardDescription>
            <CardTitle className="text-4xl font-black">
              {new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { style: 'currency', currency: 'PLN' }).format(totalValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs font-bold bg-white/10 w-fit px-2 py-1 rounded-lg">
              <ArrowUpRight className="h-3 w-3" />
              <span>{t('notebook.live_data')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">{t('notebook.active_lots')}</CardDescription>
            <CardTitle className="text-4xl font-black text-slate-800">{lots.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">{t('notebook.diversified')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">{t('notebook.est_profit')}</CardDescription>
            <CardTitle className="text-4xl font-black text-green-600">~5.2%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">{t('notebook.weighted_yield')}</p>
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
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('notebook.holdings')}</h3>
          </div>

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
                          <p className="text-lg font-black text-green-600">5.75%</p>
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
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-dashed border-2 py-20 text-center">
            <CardContent className="space-y-4">
              <PieChart className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">{t('notebook.detailed_soon')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
