'use client';

import { RotateCcw, Save, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import type { BondInputs } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';

const DRAFT_KEY = 'single-calculator-draft-v1';

function readDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as BondInputs) : null;
  } catch {
    return null;
  }
}

export function ScenarioDraftStatus({
  inputs,
  isDirty,
  onRestore,
}: {
  inputs: BondInputs;
  isDirty: boolean;
  onRestore: (inputs: BondInputs) => void;
}) {
  const { t } = useAppI18n();
  const [draft, setDraft] = React.useState<BondInputs | null>(null);

  React.useEffect(() => setDraft(readDraft()), []);
  React.useEffect(() => {
    if (!isDirty) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(inputs));
      setDraft(inputs);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [inputs, isDirty]);

  const clearDraft = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
  };

  return (
    <aside
      className="ui-status-note flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      aria-live="polite"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Save className="size-3.5 text-success" aria-hidden="true" />
          {isDirty ? t('bonds.simulation.draft_saved') : t('bonds.simulation.draft_ready')}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t('bonds.simulation.draft_description')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {draft ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onRestore(draft)}>
            <RotateCcw aria-hidden="true" />
            {t('bonds.simulation.restore_draft')}
          </Button>
        ) : null}
        {draft ? (
          <Button type="button" size="sm" variant="ghost" onClick={clearDraft}>
            <Trash2 aria-hidden="true" />
            {t('bonds.simulation.clear_draft')}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
