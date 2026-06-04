'use client';

import React from 'react';
import { useAppI18n } from '@/i18n/client';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SidebarUtilityPanel, SidebarUtilityRow } from './SidebarUtilityGroup';
import { ThemeToggle } from './ThemeToggle';

export function SidebarSettingsUtility() {
  const { t } = useAppI18n();

  return (
    <div className="space-y-0">
      <SidebarUtilityPanel>
        <SidebarUtilityRow
          title={t('common.language')}
          description="PL / EN"
          action={<LanguageSwitcher />}
        />
        <div className="mt-2.5 border-t border-border pt-2.5">
        <SidebarUtilityRow
          title={t('common.theme')}
          description={t('common.theme_toggle_hint')}
          action={<ThemeToggle />}
        />
        </div>
      </SidebarUtilityPanel>
    </div>
  );
}
