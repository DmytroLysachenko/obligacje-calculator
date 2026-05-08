'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';

interface RecalculateButtonProps {
  isDirty: boolean;
  loading: boolean;
  onClick: () => void;
}

export const RecalculateButton = ({
  isDirty,
  loading,
  onClick,
}: RecalculateButtonProps) => {
  const { t } = useLanguage();

  if (!isDirty && !loading) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 md:static">
      <Button
        size="default"
        className={cn(
          'h-12 rounded-2xl px-6 text-sm font-black uppercase tracking-widest shadow-lg',
          isDirty
            ? 'bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90'
            : 'bg-muted text-muted-foreground shadow-none',
        )}
        onClick={onClick}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common.calculating')}
          </>
        ) : (
          <>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('common.recalculate')}
          </>
        )}
      </Button>
    </div>
  );
};
