'use client';

import React from 'react';
import { useAppI18n } from '@/i18n/client';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SidebarUtilityPanel, SidebarUtilityRow, SidebarUtilityStack } from './SidebarUtilityGroup';
import { ThemeToggle } from './ThemeToggle';

export function SidebarSettingsUtility() {
  const { t } = useAppI18n();

  return (
    <SidebarUtilityStack>
      <SidebarUtilityPanel flush>
        <SidebarUtilityRow
          title={t('common.language')}
          description="PL / EN"
          action={<LanguageSwitcher />}
        />
      </SidebarUtilityPanel>
      <SidebarUtilityPanel flush>
        <SidebarUtilityRow
          title={t('common.theme')}
          description={t('common.theme_toggle_hint')}
          action={<ThemeToggle />}
        />
      </SidebarUtilityPanel>
    </SidebarUtilityStack>
  );
}
