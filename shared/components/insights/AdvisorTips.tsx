'use client';

import React from 'react';
import { AdvisorTip } from '@/features/bond-core/utils/advisor-rules';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

export const AdvisorTips: React.FC<{ tips: AdvisorTip[] }> = ({ tips }) => {
  if (!tips.length) return null;

  return (
    <div className="space-y-4 mt-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        💡 Smart Advisor
      </h3>
      {tips.map((tip) => (
        <div key={tip.id} className={`p-4 border rounded-lg flex gap-3 items-start
          ${tip.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200' : ''}
          ${tip.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200' : ''}
          ${tip.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200' : ''}
        `}>
          {tip.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
          {tip.type === 'info' && <Info className="w-5 h-5 shrink-0 mt-0.5" />}
          {tip.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div>
            <h4 className="font-medium text-sm">{tip.title}</h4>
            <p className="text-sm mt-1 opacity-90">{tip.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
