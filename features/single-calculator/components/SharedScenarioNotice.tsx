'use client';

import { Link2 } from 'lucide-react';

interface SharedScenarioNoticeProps {
  title: string;
  badge: string;
  snapshotLabel: string;
}

export function SharedScenarioNotice({ title, badge, snapshotLabel }: SharedScenarioNoticeProps) {
  return (
    <div className="ui-inline-notice">
      <div className="flex flex-wrap items-center gap-2 font-semibold">
        <Link2 className="h-4 w-4" />
        {badge}
      </div>
      <p className="mt-2 leading-7">
        {title}
        {' - '}
        {snapshotLabel}
      </p>
    </div>
  );
}
