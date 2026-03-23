
"use client";

import React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface RecalculateButtonProps {
  isDirty: boolean;
  loading: boolean;
  onClick: () => void;
}

export const RecalculateButton = ({ isDirty, loading, onClick }: RecalculateButtonProps) => {
  const { t } = useLanguage();
  if (!isDirty && !loading) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <ShadcnButton 
        size="default" 
        className={cn(
          "h-12 px-6 rounded-2xl shadow-2xl font-black text-sm uppercase tracking-widest border-2 transition-all hover:scale-105 active:scale-95 group",
          isDirty 
            ? "bg-primary border-primary/20 hover:bg-primary/90 animate-subtle-pulse shadow-primary/20" 
            : "bg-muted text-muted-foreground border-transparent"
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
            <TrendingUp className={cn(
              "mr-2 h-4 w-4 transition-transform group-hover:scale-110",
              isDirty && "text-white"
            )} />
            {t('common.recalculate')}
          </>
        )}
      </ShadcnButton>
      
      {/* Pulse rings for extra visual attention when dirty */}
      {isDirty && !loading && (
        <span className="absolute inset-0 rounded-2xl animate-ping-slow border-2 border-primary/30 pointer-events-none" />
      )}
    </div>
  );
};
