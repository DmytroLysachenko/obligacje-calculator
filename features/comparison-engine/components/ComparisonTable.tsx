'use client';

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import { CalculationResult } from "@/features/bond-core/types";

interface ComparisonTableProps {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  bondTypeA: string;
  bondTypeB: string;
  formatCurrency: (val: number) => string;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  resultsA,
  resultsB,
  bondTypeA,
  bondTypeB,
  formatCurrency,
}) => {
  const { t } = useLanguage();

  const maxLen = Math.max(resultsA.timeline.length, resultsB.timeline.length);

  return (
    <Card className="overflow-hidden border shadow-xl">
      <CardHeader className="bg-muted/30 border-b px-8 py-6">
        <CardTitle className="text-xl font-black flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          {t('comparison.table_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="w-24 font-black uppercase text-[10px] tracking-widest px-8 h-12">{t('common.year')}</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-blue-700 px-4 h-12">
                  {bondTypeA} (A)
                </TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-emerald-700 px-4 h-12">
                  {bondTypeB} (B)
                </TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest px-8 h-12">{t('comparison.winner')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: maxLen }).map((_, i) => {
                const valA = resultsA.timeline[i]?.nominalValueAfterInterest;
                const valB = resultsB.timeline[i]?.nominalValueAfterInterest;
                const winner = valA && valB ? (valA > valB ? 'A' : 'B') : (valA ? 'A' : 'B');
                
                return (
                  <TableRow key={i} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold px-8 py-4">Y{i + 1}</TableCell>
                    <TableCell className={cn("px-4 py-4 font-mono text-sm", winner === 'A' ? "font-bold text-blue-700" : "text-slate-500")}>
                      {valA ? formatCurrency(valA) : "---"}
                    </TableCell>
                    <TableCell className={cn("px-4 py-4 font-mono text-sm", winner === 'B' ? "font-bold text-emerald-700" : "text-slate-500")}>
                      {valB ? formatCurrency(valB) : "---"}
                    </TableCell>
                    <TableCell className="text-right px-8 py-4">
                      <Badge variant="outline" className={cn(
                        "font-black text-[9px] uppercase px-3 py-0.5 border-2",
                        winner === 'A' ? "border-blue-200 bg-blue-50 text-blue-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      )}>
                        {winner === 'A' ? bondTypeA : bondTypeB} {t('comparison.winning')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
