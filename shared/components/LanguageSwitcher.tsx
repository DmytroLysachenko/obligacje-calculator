'use client';

import { useLanguage } from '@/i18n';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex w-full gap-1 rounded-xl bg-slate-100 p-1">
        <Button
          variant={language === 'pl' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('pl')}
          className="h-8 flex-1 rounded-lg px-3 text-xs font-bold"
        >
          PL
        </Button>
        <Button
          variant={language === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('en')}
          className="h-8 flex-1 rounded-lg px-3 text-xs font-bold"
        >
          EN
        </Button>
      </div>
    
  );
}
