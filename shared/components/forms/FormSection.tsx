'use client';

import { ChevronDown } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  aside,
  defaultOpen = true,
  collapsible = false,
  className,
}: FormSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const contentId = React.useId();
  const visible = !collapsible || open;

  return (
    <section className={cn('ui-control-group', className)}>
      <div className="ui-section-header gap-3">
        <div className="ui-section-intro">
          {collapsible ? (
            <button
              type="button"
              className="ui-disclosure-summary ui-interactive-surface w-full rounded-md text-left motion-reduce:transition-none"
              aria-expanded={open}
              aria-controls={contentId}
              onClick={() => setOpen((current) => !current)}
            >
              <span>{title}</span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-150', open && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
          ) : (
            <h3 className="ui-card-title">{title}</h3>
          )}
          {description ? <div className="ui-field-description ui-pretty">{description}</div> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div id={contentId} className="ui-control-stack pt-1" hidden={!visible}>
        {children}
      </div>
    </section>
  );
}
