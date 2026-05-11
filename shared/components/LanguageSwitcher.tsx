'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex w-full max-w-[108px] gap-1 rounded-full bg-slate-100 p-1">
      <Button
        variant={language === 'pl' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('pl')}
        className="h-7 flex-1 rounded-full px-2 text-[11px] font-semibold tracking-[0.08em] focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
      >
        PL
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="h-7 flex-1 rounded-full px-2 text-[11px] font-semibold tracking-[0.08em] focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
      >
        EN
      </Button>
    </div>
  );
}
