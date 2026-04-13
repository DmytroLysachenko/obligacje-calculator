
"use client";

import React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface RecalculateButtonProps {
  isDirty: boolean;
  loading: boolean;
  onClick: () => void;
}

export const RecalculateButton = ({ isDirty, loading, onClick }: RecalculateButtonProps) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {(isDirty || loading) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="md:static fixed bottom-4 right-4 z-50"
        >
          <ShadcnButton 
            asChild
            size="default" 
            className={cn(
              "h-12 px-6 rounded-2xl shadow-xl font-black text-sm uppercase tracking-widest border-2 transition-all group",
              isDirty 
                ? "bg-primary border-primary/20 hover:bg-primary/90 shadow-primary/20" 
                : "bg-muted text-muted-foreground border-transparent"
            )}
            onClick={onClick}
            disabled={loading}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
            </motion.button>
          </ShadcnButton>
          
          {/* Pulse rings for extra visual attention when dirty */}
          {isDirty && !loading && (
            <span className="absolute inset-0 rounded-2xl animate-ping-slow border-2 border-primary/30 pointer-events-none" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
