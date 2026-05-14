'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex w-full max-w-[108px] items-center rounded-full border border-slate-200 bg-white p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <Button
        variant={language === 'pl' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('pl')}
        className="h-7 min-w-[46px] flex-1 rounded-full px-2 text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
      >
        PL
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="h-7 min-w-[46px] flex-1 rounded-full px-2 text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
      >
        EN
      </Button>
    </div>
  );
}
