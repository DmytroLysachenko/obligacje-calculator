"use client";
import { Button } from "@/components/ui/button";
import { useAppI18n } from "@/i18n/client";
export function LanguageSwitcher() {
  const { locale: language, setLocale: setLanguage } = useAppI18n();
  return (
    <div className="inline-flex w-full max-w-[92px] items-center rounded-full border border-border bg-card p-1 shadow-none">
      <Button
        variant={language === "pl" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLanguage("pl")}
        className="h-6 min-w-9.5 flex-1 rounded-full px-2 text-[10px] font-semibold focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
      >
        PL
      </Button>
      <Button
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLanguage("en")}
        className="h-6 min-w-9.5 flex-1 rounded-full px-2 text-[10px] font-semibold focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
      >
        EN
      </Button>
    </div>
  );
}
