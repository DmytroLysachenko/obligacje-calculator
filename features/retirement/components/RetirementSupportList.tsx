'use client';

import React from 'react';

interface RetirementSupportListProps {
  title: string;
  items: string[];
  emptyLabel: string;
}

export function RetirementSupportList({
  title,
  items,
  emptyLabel,
}: RetirementSupportListProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-3">
        <h4 className="ui-card-title">{title}</h4>
        <span className="ui-metadata font-semibold text-muted-foreground">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="ui-body text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="divide-y divide-dashed divide-border">
          {items.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="py-3 text-sm leading-6 text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
