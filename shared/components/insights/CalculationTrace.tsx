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
import { useAppI18n } from '@/i18n/client';

interface CalculationTraceProps {
  timeline: YearlyTimelinePoint[];
}

export const CalculationTrace: React.FC<CalculationTraceProps> = ({ timeline }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useAppI18n();

  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 font-semibold transition-colors hover:bg-muted/50"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          {t('bonds.calculation_trace.title')}
        </span>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <div className="overflow-x-auto border-t border-dashed border-slate-200 p-4">
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
                      {t('bonds.calculation_trace.year_label', {
                        year: point.year,
                        label: point.periodLabel,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">{point.nominalValueBeforeInterest.toFixed(2)} PLN</TableCell>
                    <TableCell className="text-right font-medium">{point.interestRate.toFixed(2)}%</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">+{point.interestEarned.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-red-500">-{point.taxDeducted.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{point.nominalValueAfterInterest.toFixed(2)} PLN</TableCell>
                  </TableRow>
                  {point.events?.map((event, eventIndex) => (
                    <TableRow key={`event-${index}-${eventIndex}`} className="text-sm text-muted-foreground">
                      <TableCell />
                      <TableCell colSpan={5} className="pl-6 italic">
                        {`\u2192`} {event.type}: {event.description}
                      </TableCell>
                      <TableCell className="text-right">{event.value ? event.value.toFixed(2) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
};
