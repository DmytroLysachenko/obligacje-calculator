'use client';

import React from 'react';
import { History, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppI18n } from '@/i18n/client';
import { useChartData } from '@/shared/hooks/useChartData';

interface RatePoint {
  date: string;
  rate: number;
}

export function AssumptionHistoryPopover({
  endpoint,
  title,
  latestLabel,
  footerNote,
}: {
  endpoint: string;
  title: string;
  latestLabel: string;
  footerNote: string;
}) {
  const { t } = useAppI18n();
  const { data, isLoading } = useChartData<{ data: RatePoint[] }>(endpoint);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/10">
          <History className="h-3.5 w-3.5 text-primary/60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <History className="h-4 w-4 animate-spin" />
          </div>
        ) : !data?.data ? (
          <div className="p-4 text-sm italic text-muted-foreground">{t('common.no_data')}</div>
        ) : (
          <HistoryPopoverContent
            points={data.data}
            title={title}
            latestLabel={latestLabel}
            footerNote={footerNote}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function HistoryPopoverContent({
  points,
  title,
  latestLabel,
  footerNote,
}: {
  points: RatePoint[];
  title: string;
  latestLabel: string;
  footerNote: string;
}) {
  const latest = points[points.length - 1];
  const lastFew = points.slice(-5).reverse();

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center gap-2 border-b pb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold tracking-[0.08em]">{title}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 p-2">
          <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {latestLabel}
          </span>
          <span className="text-sm font-black text-primary">
            {latest.rate}% ({latest.date})
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {lastFew.map((item, idx) => (
            <div key={`${item.date}-${idx}`} className="flex justify-between px-1 text-xs">
              <span className="font-medium text-muted-foreground">{item.date}</span>
              <span className="font-bold">{item.rate}%</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed pt-2">
          <p className="text-[11px] italic leading-5 text-muted-foreground">{footerNote}</p>
        </div>
      </div>
    </div>
  );
}
