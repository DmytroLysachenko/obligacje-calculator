'use client';

import React from 'react';

import { useAppI18n } from '@/i18n/client';

import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { SidebarUtilityPanel, SidebarUtilityRow, SidebarUtilityStack } from './SidebarUtilityGroup';

export function SidebarSettingsUtility() {
  const { t } = useAppI18n();

  return (
    <SidebarUtilityStack>
      <SidebarUtilityPanel flush>
        <SidebarUtilityRow title={t('common.language')} action={<LanguageSwitcher />} />
        <SidebarUtilityRow title={t('common.theme')} action={<ThemeToggle />} />
      </SidebarUtilityPanel>
    </SidebarUtilityStack>
  );
}
