'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  BookOpen, 
  ChevronRight, 
  AlertCircle,
  FileText,
  Calendar,
  RefreshCcw,
  ShieldCheck,
  FolderOpen,
  Sparkles,
  Download,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPortfolio } from '@/db/schema';
import { cn } from '@/lib/utils';
import { PortfolioDetails } from './PortfolioDetails';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", className)}>
    {children}
  </span>
);

export const NotebookContainer: React.FC = () => {
  const { t } = useLanguage();
  const [portfolios, setPortfolios] = useState<UserPortfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  const resolvePortfolioError = useCallback(
    (payload?: { error?: string; code?: string } | null) => {
      if (payload?.code === 'portfolio_storage_unavailable') {
        return t('notebook.storage_unavailable');
      }

      return payload?.error || t('notebook.create_error');
    },
    [t],
  );

  const fetchPortfolios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      if (!response.ok) {
        setError(resolvePortfolioError(data));
        setPortfolios([]);
        return;
      }

      if (!Array.isArray(data) && data?.error) {
        setError(resolvePortfolioError(data));
      }

      setPortfolios(Array.isArray(data) ? data : (data.items ?? []));
    } catch {
      setError(t('notebook.load_error'));
    } finally {
      setIsLoading(false);
    }
  }, [resolvePortfolioError, t]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const handleCreateDefault = async () => {
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: t('notebook.new_portfolio'), 
          description: t('notebook.default_description') 
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(resolvePortfolioError(payload));
        return;
      }

      setError(null);
      fetchPortfolios();
    } catch (err) {
      console.error(err);
      setError(t('notebook.create_error'));
    }
  };

  const handleCreateDemo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: t('notebook.demo_name'), 
          description: t('notebook.demo_description') 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create portfolio');
      const portfolio = await response.json();
      const portfolioId = portfolio.data?.id || portfolio.id;

      // Add some demo lots
      const demoLots = [
        { bondType: 'EDO', amount: 50, purchaseDate: '2023-01-01' },
        { bondType: 'COI', amount: 100, purchaseDate: '2023-06-15' },
        { bondType: 'TOS', amount: 200, purchaseDate: '2024-01-10' },
      ];

      for (const lot of demoLots) {
        await fetch('/api/portfolio/lots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolioId, ...lot }),
        });
      }

      fetchPortfolios();
    } catch (err) {
      console.error(err);
      setError(t('notebook.create_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportClick = () => {
    importRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const response = await fetch('/api/portfolio/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      await fetchPortfolios();
    } catch (err) {
      console.error(err);
      setError('Import failed. Use portfolio export JSON package.');
    } finally {
      event.target.value = '';
    }
  };

  if (selectedPortfolioId) {
    const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
    return (
      <PortfolioDetails 
        portfolio={portfolio!} 
        onBack={() => setSelectedPortfolioId(null)} 
      />
    );
  }

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />
      <Button 
        variant="outline"
        onClick={handleImportClick}
        className="h-10 px-4 rounded-xl text-xs font-black gap-2"
      >
        <Upload className="h-4 w-4" />
        IMPORT JSON
      </Button>
      <Button 
        onClick={handleCreateDefault}
        className="h-10 px-4 rounded-xl text-xs font-black gap-2 shadow-sm hover:shadow-primary/20 transition-all active:scale-95"
      >
        <Plus className="h-4 w-4" />
        {t('notebook.new_portfolio').toUpperCase()}
      </Button>
    </div>
  );

  return (
    <CalculatorPageShell
      title={t('notebook.title')}
      description={t('notebook.subtitle')}
      icon={<BookOpen className="h-8 w-8" />}
      isCalculating={isLoading}
      hasResults={portfolios.length > 0}
      extraHeaderActions={headerActions}
    >
      {error && (
        <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-3 font-bold">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={fetchPortfolios}>
              <RefreshCcw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </div>
        </div>
      )}

      <Card className="border-blue-100 bg-blue-50/20 shadow-sm">
        <CardContent className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">{t('notebook.guest_mode')}</p>
              <p className="text-xs text-blue-800/80">{t('notebook.guest_desc')}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCreateDefault}>
            {t('notebook.new_portfolio')}
          </Button>
        </CardContent>
      </Card>

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
                    {p.description || t('notebook.portfolio_details')}
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
          <div className="col-span-full py-20 text-center space-y-8 rounded-3xl border-2 border-dashed border-primary/20 bg-muted/5">
            <div className="relative inline-flex">
              <div className="absolute -inset-4 rounded-full bg-primary/10 blur-xl animate-pulse" />
              <div className="relative p-8 bg-white rounded-full shadow-xl border-2 border-primary/5 text-primary">
                <FolderOpen className="h-16 w-16" />
              </div>
            </div>
            <div className="space-y-3 max-w-md mx-auto px-6">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{t('notebook.empty_title')}</h3>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                {t('notebook.empty_desc')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-6">
              <Button 
                size="lg" 
                onClick={handleCreateDefault}
                className="h-14 px-10 rounded-2xl font-black shadow-xl hover:shadow-primary/30 transition-all active:scale-95 gap-2"
              >
                <Plus className="h-5 w-5" />
                {t('notebook.create_first').toUpperCase()}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleCreateDemo}
                className="h-14 px-10 rounded-2xl font-black border-2 gap-2 hover:bg-primary/5 transition-all"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                {t('notebook.load_demo').toUpperCase()}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleImportClick}
                className="h-14 px-10 rounded-2xl font-black border-2 gap-2 hover:bg-primary/5 transition-all"
              >
                <Download className="h-5 w-5 text-primary" />
                IMPORT PACKAGE
              </Button>
            </div>
          </div>
        )}
      </div>
    </CalculatorPageShell>
  );
};
