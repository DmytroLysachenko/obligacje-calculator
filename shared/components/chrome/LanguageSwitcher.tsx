'use client';

import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';

const languages = [
  { code: 'pl', label: 'PL', name: 'Polski' },
  { code: 'en', label: 'EN', name: 'English' },
] as const;

export function LanguageSwitcher() {
  const { locale: language, setLocale: setLanguage, t } = useAppI18n();

  return (
    <div
      className="inline-flex w-[88px] items-center rounded-md border border-border bg-card p-0.5"
      role="group"
      aria-label={t('common.language')}
    >
      {languages.map((item) => {
        const active = language === item.code;
        return (
          <Button
            key={item.code}
            variant={active ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage(item.code)}
            aria-pressed={active}
            aria-label={item.name}
            className="min-h-9 min-w-9 flex-1 rounded-sm px-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 [@media(pointer:coarse)]:min-h-11"
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
