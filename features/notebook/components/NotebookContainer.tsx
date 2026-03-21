'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Wallet, 
  Briefcase, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  FileText,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPortfolio } from '@/db/schema';
import { cn } from '@/lib/utils';
import { PortfolioDetails } from './PortfolioDetails';

export const NotebookContainer: React.FC = () => {
  const { t } = useLanguage();
  const [portfolios, setPortfolios] = useState<UserPortfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/portfolio');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPortfolios(data);
    } catch {
      setError('Could not load portfolios. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDefault = async () => {
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: t('notebook.new_portfolio'), 
          description: 'Primary savings' 
        }),
      });
      if (response.ok) fetchPortfolios();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  if (selectedPortfolioId) {
    const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
    return (
      <PortfolioDetails 
        portfolio={portfolio!} 
        onBack={() => setSelectedPortfolioId(null)} 
      />
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-8 rounded-3xl border-4 border-primary/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-primary">
          <Wallet className="h-32 w-32" />
        </div>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-primary uppercase">
              {t('notebook.title')}
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm font-medium">
            {t('notebook.subtitle')}
          </p>
        </div>
        <Button 
          onClick={handleCreateDefault}
          className="h-14 px-8 rounded-2xl text-lg font-black gap-3 shadow-lg hover:shadow-primary/20 transition-all active:scale-95 z-10"
        >
          <Plus className="h-6 w-6" />
          {t('notebook.new_portfolio').toUpperCase()}
        </Button>
      </header>

      {error && (
        <div className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-2xl flex items-center gap-3 text-destructive font-bold text-sm">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {portfolios.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedPortfolioId(p.id)}
            >
              <Card className="group cursor-pointer hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-2xl rounded-3xl overflow-hidden border-2 h-full flex flex-col bg-card">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none">{t('notebook.active').toUpperCase()}</Badge>
                  </div>
                  <CardTitle className="text-xl font-black mt-4 group-hover:text-primary transition-colors">
                    {p.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 font-medium">
                    {p.description || '...'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{t('notebook.created')}</span>
                      <span className="text-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-8 h-12 rounded-xl font-black gap-2 group-hover:bg-primary group-hover:text-white transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPortfolioId(p.id);
                    }}
                  >
                    {t('notebook.open_portfolio').toUpperCase()}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {portfolios.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center space-y-6">
            <div className="inline-flex p-6 bg-muted rounded-full text-muted-foreground">
              <Briefcase className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">{t('notebook.empty_title')}</h3>
              <p className="text-muted-foreground font-medium max-w-md mx-auto">
                {t('notebook.empty_desc')}
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={handleCreateDefault}
              className="h-14 px-10 rounded-2xl font-black shadow-xl"
            >
              {t('notebook.create_first').toUpperCase()}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", className)}>
    {children}
  </span>
);
