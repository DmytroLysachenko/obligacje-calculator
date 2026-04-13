'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from '@/i18n';
import { CalculationResult } from '@/features/bond-core/types';
import { Info, HelpCircle, ArrowRight, Calculator, Landmark, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface MathDeepDiveProps {
  results: CalculationResult;
  trigger?: React.ReactNode;
}

export const MathDeepDive: React.FC<MathDeepDiveProps> = ({ results, trigger }) => {
  const { t, language } = useLanguage();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const totalInterest = results.grossValue - results.initialInvestment;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            <Info className="h-4 w-4" />
            {t('bonds.how_calculated')}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            <Calculator className="h-5 w-5 text-primary" />
            {t('bonds.how_calculated')}
          </SheetTitle>
          <SheetDescription>
            {t('bonds.explanation_text')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8 pb-8">
          {/* Step 1: Gross Value */}
          <section className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px]">1</span>
              {t('bonds.gross_value')}
            </h4>
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('bonds.initial_investment')}</span>
                <span className="font-mono font-bold">{formatCurrency(results.initialInvestment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('bonds.plus_interest')}</span>
                <span className="font-mono font-bold text-green-600">+{formatCurrency(totalInterest)}</span>
              </div>
              <Separator className="bg-primary/10" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-black uppercase">{t('bonds.gross_value')}</span>
                <span className="text-lg font-black">{formatCurrency(results.grossValue)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic leading-relaxed pt-1">
                {t('bonds.interest_formula')}
              </p>
            </div>
          </section>

          {/* Step 2: Reductions */}
          <section className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px]">2</span>
              {t('bonds.fees_and_tax')}
            </h4>
            <div className="rounded-2xl border border-red-100 bg-red-50/30 p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Link href="/education#belka_tax" className="text-muted-foreground hover:text-primary underline decoration-dotted flex items-center gap-1">
                    {t('education.concepts.belka_tax.title')}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <span className="font-mono font-bold text-red-600">-{formatCurrency(results.totalTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <Link href="/education#early_redemption" className="text-muted-foreground hover:text-primary underline decoration-dotted flex items-center gap-1">
                    {t('education.concepts.early_redemption.title')}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <span className="font-mono font-bold text-red-600">-{formatCurrency(results.totalEarlyWithdrawalFee)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-black uppercase">{t('bonds.total_fees_and_tax')}</span>
                <span className="text-lg font-black text-red-700">-{formatCurrency(results.totalTax + results.totalEarlyWithdrawalFee)}</span>
              </div>
            </div>
          </section>

          {/* Step 3: Final Net */}
          <section className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px]">3</span>
              {t('bonds.net_payout')}
            </h4>
            <div className="rounded-2xl border-2 border-green-500/20 bg-green-50/50 p-6 space-y-4 shadow-sm">
              <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t('bonds.payout_calculation')}
                </p>
                <div className="bg-white/50 rounded-lg p-3 font-mono text-[11px] leading-relaxed border border-green-100">
                  <span className="font-bold">{formatCurrency(results.initialInvestment)}</span> (Cap) 
                  + (<span className="text-green-600 font-bold">{formatCurrency(totalInterest)}</span> (Int)
                  - <span className="text-red-600 font-bold">{formatCurrency(results.totalTax)}</span> (Tax)
                  - <span className="text-red-600 font-bold">{formatCurrency(results.totalEarlyWithdrawalFee)}</span> (Fee))
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase text-green-800">{t('bonds.net_payout')}</span>
                  <p className="text-[10px] text-green-700/60 font-medium">{t('bonds.actual_cash_in_hand')}</p>
                </div>
                <div className="text-2xl font-black text-green-700">
                  {formatCurrency(results.netPayoutValue)}
                </div>
              </div>
            </div>
          </section>

          {/* Rules & Education */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
              <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                {t('bonds.rounding_rules')}
              </h5>
              <ul className="text-[11px] space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
                <li>{t('bonds.rounding_desc')}</li>
                <li>{t('bonds.tax_rounding_desc')}</li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
              <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('education.bond_types')}
              </h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('education.disclaimer')}
              </p>
              <Button asChild variant="link" className="p-0 h-auto text-[11px] font-bold">
                <Link href="/education" className="flex items-center gap-1">
                  {t('nav.education')}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
