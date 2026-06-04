import React from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartSection({
  title,
  description,
  controls,
  children,
  className,
}: ChartSectionProps) {
  return (
    <section className={cn('space-y-4 border-t border-border py-5', className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-muted p-2 text-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <h3 className="ui-section-title">{title}</h3>
            {description ? (
              <p className="ui-body max-w-4xl text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {controls ? (
          <div className="shrink-0 lg:max-w-[520px]">
            {controls}
          </div>
        ) : null}
      </div>

      {children}
    </section>
  );
}
