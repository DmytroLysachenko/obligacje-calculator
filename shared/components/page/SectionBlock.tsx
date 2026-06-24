import React from 'react';

import { cn } from '@/lib/utils';

type SectionBlockVariant = 'plain' | 'divided' | 'surface' | 'card';

interface SectionBlockProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: SectionBlockVariant;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const variantClass: Record<SectionBlockVariant, string> = {
  plain: 'space-y-6',
  divided: 'space-y-6 border-t border-border py-8',
  surface: 'space-y-6 rounded-lg bg-muted/20 p-5 md:p-6',
  card: 'space-y-6 rounded-lg border border-border bg-card p-5 md:p-6',
};

export function SectionBlock({
  title,
  description,
  icon,
  action,
  children,
  variant = 'divided',
  className,
  headerClassName,
  contentClassName,
}: SectionBlockProps) {
  const hasHeader = title || description || icon || action;

  return (
    <section className={cn(variantClass[variant], className)}>
      {hasHeader ? (
        <div
          className={cn(
            'flex flex-col gap-4 md:flex-row md:items-start md:justify-between',
            headerClassName,
          )}
        >
          <div className="max-w-4xl space-y-2">
            {title ? (
              <div className="flex items-center gap-2">
                {icon ? <span className="text-foreground">{icon}</span> : null}
                <h3 className="ui-section-title">{title}</h3>
              </div>
            ) : null}
            {description ? <p className="ui-body text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
