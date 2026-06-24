'use client';

import React from 'react';

export function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h3 className="ui-card-title">{title}</h3>
      <p className="ui-body text-muted-foreground">{description}</p>
    </div>
  );
}
