'use client';

import { useLanguage } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <Button
          variant={language === 'pl' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('pl')}
          className="h-8 w-9 rounded-lg p-0 text-xs font-bold"
        >
          PL
        </Button>
        <Button
          variant={language === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('en')}
          className="h-8 w-9 rounded-lg p-0 text-xs font-bold"
        >
          EN
        </Button>
      </div>
    </div>
  );
}
