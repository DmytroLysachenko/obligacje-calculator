'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BarChart3, TrendingUp, Info } from 'lucide-react';
import { useLanguage } from '@/i18n';
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
  const { t } = useLanguage();
  const { data: response } = useChartData<Insight[]>('/api/community/insights');
  
  const insight = response?.find(i => i.bondType === bondType);

  if (!insight) return null;

  return (
    <Card className="border-2 border-primary/10 bg-primary/5 shadow-none rounded-2xl overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('community.popularity')}</span>
          </div>
          <span className="text-sm font-black text-primary">{insight.popularityScore} {t('community.users')}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
             <div className="flex items-center gap-1.5 text-muted-foreground">
               <TrendingUp className="h-3 w-3" />
               <span className="text-[8px] font-bold uppercase">{t('community.sentiment')}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(parseFloat(insight.sentimentScore) + 1) * 50}%` }}
                  />
                </div>
                <span className="text-[10px] font-black">{parseFloat(insight.sentimentScore) > 0 ? 'Bullish' : 'Neutral'}</span>
             </div>
          </div>

          <div className="space-y-1">
             <div className="flex items-center gap-1.5 text-muted-foreground">
               <BarChart3 className="h-3 w-3" />
               <span className="text-[8px] font-bold uppercase">{t('community.est_volume')}</span>
             </div>
             <p className="text-[10px] font-black">~{Math.round(parseFloat(insight.totalVolume) / 1000)}k PLN</p>
          </div>
        </div>

        <div className="pt-2 border-t border-dashed border-primary/10 flex items-start gap-2">
           <Info className="h-3 w-3 text-primary shrink-0 mt-0.5" />
           <p className="text-[8px] font-medium text-muted-foreground leading-tight italic">
             {t('community.anonymized_notice')}
           </p>
        </div>
      </CardContent>
    </Card>
  );
};
