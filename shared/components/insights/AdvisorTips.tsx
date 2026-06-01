'use client';

import React from 'react';
import { AdvisorTip } from '@/features/bond-core/utils/advisor-rules';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AdvisorTips: React.FC<{ tips: AdvisorTip[] }> = ({ tips }) => {
  if (!tips.length) return null;

  return (
    <div className="mt-6 space-y-4 border-t border-border py-4">
      <h3 className="flex items-center gap-2 ui-section-title">
        Smart Advisor
      </h3>
      {tips.map((tip) => (
        <div
          key={tip.id}
          className={cn(
            'flex items-start gap-3 border-t border-dashed border-border py-4',
            tip.type === 'warning' && 'text-warning',
            tip.type === 'info' && 'text-primary',
            tip.type === 'success' && 'text-success',
          )}
        >
          {tip.type === 'warning' && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
          {tip.type === 'info' && <Info className="mt-0.5 h-5 w-5 shrink-0" />}
          {tip.type === 'success' && <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />}
          <div>
            <h4 className="text-sm font-medium">{tip.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{tip.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
