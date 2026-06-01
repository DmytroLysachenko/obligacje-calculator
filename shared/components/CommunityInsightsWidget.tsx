'use client';

import React from 'react';
import { Users, BarChart3, TrendingUp, Info } from 'lucide-react';
import { useAppI18n } from '@/i18n/client';
import { useChartData } from '@/shared/hooks/useChartData';
import { BondType } from '@/features/bond-core/types';

interface Insight {
  bondType: string;
  popularityScore: number;
  sentimentScore: string;
  totalVolume: string;
}

interface CommunityInsightsWidgetProps {
  bondType: BondType;
}

export const CommunityInsightsWidget: React.FC<CommunityInsightsWidgetProps> = ({ bondType }) => {
  const { t } = useAppI18n();
  const { data: response } = useChartData<Insight[]>('/api/community/insights');
  
  const insight = response?.find(i => i.bondType === bondType);

  if (!insight) return null;

  return (
    <section className="space-y-4 border-t border-border py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="ui-card-title">{t('community.popularity')}</span>
        </div>
        <span className="text-sm font-black text-primary">{insight.popularityScore} {t('community.users')}</span>
      </div>

      <div className="grid grid-cols-2 gap-0 divide-x divide-dashed divide-border border-y border-border">
        <div className="space-y-1 py-3 pr-4">
           <div className="flex items-center gap-1.5 text-muted-foreground">
             <TrendingUp className="h-3 w-3" />
             <span className="ui-metadata">{t('community.sentiment')}</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div 
                  className="h-full bg-success"
                  style={{ width: `${(parseFloat(insight.sentimentScore) + 1) * 50}%` }}
                />
              </div>
              <span className="text-[10px] font-black">{parseFloat(insight.sentimentScore) > 0 ? 'Bullish' : 'Neutral'}</span>
           </div>
        </div>

        <div className="space-y-1 py-3 pl-4">
           <div className="flex items-center gap-1.5 text-muted-foreground">
             <BarChart3 className="h-3 w-3" />
             <span className="ui-metadata">{t('community.est_volume')}</span>
           </div>
           <p className="text-[10px] font-black">~{Math.round(parseFloat(insight.totalVolume) / 1000)}k PLN</p>
        </div>
      </div>

      <div className="flex items-start gap-2 border-t border-dashed border-primary/10 pt-3">
         <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
         <p className="text-[8px] italic leading-tight text-muted-foreground">
           {t('community.anonymized_notice')}
         </p>
      </div>
    </section>
  );
};




