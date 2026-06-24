'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const { t } = useAppI18n();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
        <div className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === 'dark' || resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      size="icon"
      className="h-9 w-9 rounded-full border border-border text-muted-foreground transition-all hover:border-foreground/20 hover:bg-muted hover:text-foreground"
      aria-label={isDark ? t('common.light_mode') : t('common.dark_mode')}
      title={isDark ? t('common.light_mode') : t('common.dark_mode')}
    >
      <div className="relative h-5 w-5 flex items-center justify-center shrink-0">
        <Sun className="absolute h-4 w-4 rotate-0 opacity-100 transition-all duration-300 dark:-rotate-90 dark:opacity-0" />
        <Moon className="absolute h-4 w-4 rotate-90 opacity-0 transition-all duration-300 dark:rotate-0 dark:opacity-100" />
      </div>
    </Button>
  );
}
