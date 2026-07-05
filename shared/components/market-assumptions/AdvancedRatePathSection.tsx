'use client';

import { ProjectedRatePathEditor } from '@/shared/components/market-assumptions/ProjectedRatePathEditor';

interface AdvancedRatePathSectionProps {
  title: string;
  description: string;
  emptyNote: string;
  values?: number[];
  step: number;
  onChange: (values: number[]) => void;
}

export function AdvancedRatePathSection({
  title,
  description,
  emptyNote,
  values,
  step,
  onChange,
}: AdvancedRatePathSectionProps) {
  return (
    <div className="space-y-3 border-t border-dashed pt-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="ui-card-title">{title}</p>
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {values ? (
        <ProjectedRatePathEditor values={values} prefix="Y" step={step} onChange={onChange} />
      ) : (
        <p className="text-[11px] leading-5 text-muted-foreground">{emptyNote}</p>
      )}
    </div>
  );
}
