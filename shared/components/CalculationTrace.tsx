'use client';

import React, { useState } from 'react';
import { YearlyTimelinePoint } from '@/features/bond-core/types';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/i18n';

interface CalculationTraceProps {
  timeline: YearlyTimelinePoint[];
}

export const CalculationTrace: React.FC<CalculationTraceProps> = ({ timeline }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="mt-8 border rounded-lg bg-card overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between font-semibold hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          {t('bonds.calculation_trace.title')}
        </span>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('bonds.calculation_trace.header_year')}</TableHead>
                <TableHead>{t('bonds.calculation_trace.header_event')}</TableHead>
                <TableHead className="text-right">{t('bonds.calculation_trace.header_capital')}</TableHead>
                <TableHead className="text-right">{t('bonds.calculation_trace.header_rate')}</TableHead>
                <TableHead className="text-right">{t('bonds.calculation_trace.header_interest')}</TableHead>
                <TableHead className="text-right">{t('bonds.calculation_trace.header_tax')}</TableHead>
                <TableHead className="text-right">{t('bonds.calculation_trace.header_value_after')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeline.map((point, index) => (
                <React.Fragment key={index}>
                  <TableRow className="bg-muted/20">
                    <TableCell className="font-medium" colSpan={2}>
                      {t('bonds.calculation_trace.year_label', { year: point.year, label: point.periodLabel })}
                    </TableCell>
                    <TableCell className="text-right font-medium">{(point.nominalValueBeforeInterest).toFixed(2)} PLN</TableCell>
                    <TableCell className="text-right font-medium">{point.interestRate.toFixed(2)}%</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">+{point.interestEarned.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-red-500">-{point.taxDeducted.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{point.nominalValueAfterInterest.toFixed(2)} PLN</TableCell>
                  </TableRow>
                  {point.events?.map((evt, eIdx) => (
                    <TableRow key={`evt-${index}-${eIdx}`} className="text-sm text-muted-foreground">
                      <TableCell></TableCell>
                      <TableCell colSpan={5} className="pl-6 italic">↳ {evt.type}: {evt.description}</TableCell>
                      <TableCell className="text-right">{evt.value ? evt.value.toFixed(2) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
