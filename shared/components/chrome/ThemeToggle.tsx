'use client';

import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';
import { useTheme } from '@/shared/context/ThemeContext';

export function ThemeToggle() {
  const { t } = useAppI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="outline"
      aria-label={isDark ? t('common.light_mode') : t('common.dark_mode')}
      aria-pressed={isDark}
      title={t('common.theme')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
