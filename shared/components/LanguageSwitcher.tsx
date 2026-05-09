'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex w-full max-w-[132px] gap-1 rounded-lg bg-slate-100 p-1">
      <Button
        variant={language === 'pl' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('pl')}
        className="h-7 flex-1 rounded-md px-2 text-[11px] font-bold"
      >
        PL
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="h-7 flex-1 rounded-md px-2 text-[11px] font-bold"
      >
        EN
      </Button>
    </div>
  );
}
