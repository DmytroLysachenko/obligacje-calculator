'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalculationResult } from '../../bond-core/types';
import { SimulationEventType } from '../../bond-core/types/simulation';
import { useLanguage } from '@/i18n';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BondTimelineProps {
  results: CalculationResult;
}

export const BondTimeline: React.FC<BondTimelineProps> = ({ results }) => {
  const { t, language } = useLanguage();
  const [hasMounted, setHasMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const formatCurrency = (value: number) => {
    if (!hasMounted) return '---';
    return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    if (!hasMounted) return '---%';
    return `${value.toFixed(2)}%`;
  };

  const filteredTimeline = useMemo(() => {
    return results.timeline.filter(point => {
      const matchesSearch = point.periodLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          point.rateSource.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesEvent = eventTypeFilter === 'all' || 
                          point.events?.some(e => e.type === eventTypeFilter);
      
      return matchesSearch && matchesEvent;
    });
  }, [results.timeline, searchQuery, eventTypeFilter]);

  const displayedTimeline = isExpanded ? filteredTimeline : filteredTimeline.slice(0, 12);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-4 rounded-xl border border-dashed">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('common.search') || 'Search...'} 
            className="pl-9 bg-background" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-full md:w-48 bg-background">
              <SelectValue placeholder={t('bonds.filter_events') || 'Filter Events'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all_events') || 'All Events'}</SelectItem>
              {Object.values(SimulationEventType).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full overflow-x-auto border rounded-xl bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[120px] font-bold">{t('common.period')}</TableHead>
              <TableHead className="font-bold">{t('bonds.cycle')}</TableHead>
              <TableHead className="font-bold">{t('common.interest_rate')}</TableHead>
              <TableHead className="font-bold">{t('bonds.rate_source')}</TableHead>
              <TableHead className="font-bold">{t('common.nominal_value')}</TableHead>
              <TableHead className="font-bold">{t('common.net_profit')}</TableHead>
              <TableHead className="font-bold">{t('common.real_value')}</TableHead>
              <TableHead className="text-right font-bold">{t('bonds.early_exit_payout')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTimeline.map((point) => (
              <TableRow key={`${point.cycleIndex}-${point.periodLabel}`} className={point.isWithdrawal ? "bg-primary/5 font-semibold" : ""}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{point.periodLabel}</span>
                    <div className="flex flex-wrap gap-1">
                      {point.events?.map((e, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[8px] h-3 px-1 leading-none uppercase tracking-tighter">
                          {e.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{point.cycleIndex}</TableCell>
                <TableCell className="font-mono">{formatPercent(point.interestRate)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs">{point.rateSource}</span>
                    {typeof point.rateReferenceValue === 'number' && (
                      <span className="text-[10px] text-muted-foreground italic">
                        ref {formatPercent(point.rateReferenceValue)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono">{formatCurrency(point.nominalValueAfterInterest)}</TableCell>
                <TableCell className={point.netProfit >= 0 ? "text-green-600 font-mono" : "text-destructive font-mono"}>
                  {formatCurrency(point.netProfit)}
                </TableCell>
                <TableCell className="text-blue-600 font-mono">
                  {formatCurrency(point.realValue)}
                </TableCell>
                <TableCell className="text-right font-bold font-mono">
                  {formatCurrency(point.earlyWithdrawalValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredTimeline.length > 12 && (
          <div className="p-4 border-t bg-muted/5 flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs font-bold uppercase tracking-widest gap-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <><ChevronUp className="h-4 w-4" /> {t('common.show_less') || 'Show Less'}</>
              ) : (
                <><ChevronDown className="h-4 w-4" /> {t('common.show_all', { count: filteredTimeline.length }) || `Show All (${filteredTimeline.length})`}</>
              )}
            </Button>
          </div>
        )}
        
        {filteredTimeline.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <p>{t('common.no_results_found') || 'No results found for current filters.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
