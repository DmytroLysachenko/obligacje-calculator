import React from 'react';

import { cn } from '@/lib/utils';

type SectionBlockVariant = 'plain' | 'divided' | 'surface' | 'card';

interface SectionBlockProps {
  id?: string;
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
  plain: 'ui-section-flow',
  divided: 'ui-section-flow border-t border-border py-8',
  surface: 'ui-section-flow ui-surface-inset p-5 md:p-6',
  card: 'ui-section-flow ui-surface p-5 md:p-6',
};

export function SectionBlock({
  id,
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
    <section id={id} className={cn(variantClass[variant], className)}>
      {hasHeader ? (
        <div className={cn('ui-section-header gap-4', headerClassName)}>
          <div className="ui-section-intro">
            {title ? (
              <div className="flex items-center gap-2">
                {icon ? (
                  <span className="ui-icon-tile-sm" aria-hidden="true">
                    {icon}
                  </span>
                ) : null}
                <h3 className="ui-section-title">{title}</h3>
              </div>
            ) : null}
            {description ? (
              <p className="ui-body ui-pretty text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="ui-action-row shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
