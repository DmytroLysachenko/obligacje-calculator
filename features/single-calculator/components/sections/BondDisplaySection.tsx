'use client';

import React from 'react';
import { BondInputs } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';

interface BondDisplaySectionProps {
  inputs?: BondInputs;
  onUpdate?: (key: keyof BondInputs, value: unknown) => void;
}

export const BondDisplaySection: React.FC<BondDisplaySectionProps> = React.memo(() => {
  const { t } = useAppI18n();

  return (
    <div className="space-y-2 pb-5">
      <p className="ui-card-title">{t('bonds.form.display_summary_title')}</p>
      <p className="text-xs leading-6 text-muted-foreground">
        {t('bonds.form.display_summary_desc')}
      </p>
    </div>
  );
});

BondDisplaySection.displayName = 'BondDisplaySection';




