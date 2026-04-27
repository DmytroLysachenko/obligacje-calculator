'use client';

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import { BondType, TaxStrategy } from "@/features/bond-core/types";

interface ScenarioOverrideCardProps {
  title: string;
  colorClass: string;
  bondType: BondType;
  onBondTypeChange: (value: BondType) => void;
  rollover?: boolean;
  onRolloverChange: (value: boolean) => void;
  isRebought?: boolean;
  onReboughtChange: (value: boolean) => void;
  taxStrategy?: TaxStrategy;
  onTaxStrategyChange: (value: TaxStrategy | undefined) => void;
  customHorizonEnabled: boolean;
  onCustomHorizonEnabledChange: (value: boolean) => void;
  customHorizonMonths?: number;
  onCustomHorizonMonthsChange: (value: number | undefined) => void;
}

export const ScenarioOverrideCard: React.FC<ScenarioOverrideCardProps> = ({
  title,
  colorClass,
  bondType,
  onBondTypeChange,
  rollover,
  onRolloverChange,
  isRebought,
  onReboughtChange,
  taxStrategy,
  onTaxStrategyChange,
  customHorizonEnabled,
  onCustomHorizonEnabledChange,
  customHorizonMonths,
  onCustomHorizonMonthsChange,
}) => {
  const { t, language } = useLanguage();

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className={cn("border-b pb-4", colorClass)}>
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t("bonds.bond_type")}</Label>
          <Select value={bondType} onValueChange={(value) => onBondTypeChange(value as BondType)}>
            <SelectTrigger className="h-11 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(BondType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type} · {language === "pl" ? "Obligacja" : "Bond"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
          <div>
            <p className="text-sm font-bold">{t("bonds.reinvest")}</p>
            <p className="text-[10px] text-muted-foreground font-medium italic">{t("bonds.rollover_desc")}</p>
          </div>
          <Switch checked={!!rollover} onCheckedChange={onRolloverChange} />
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
          <div>
            <p className="text-sm font-bold">{t("bonds.is_rebought")}</p>
            <p className="text-[10px] text-muted-foreground font-medium italic">{t("bonds.is_rebought_desc")}</p>
          </div>
          <Switch checked={!!isRebought} onCheckedChange={onReboughtChange} />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t("bonds.tax_strategy")}</Label>
          <Select
            value={taxStrategy ?? "shared"}
            onValueChange={(value) => onTaxStrategyChange(value === "shared" ? undefined : (value as TaxStrategy))}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shared">{t("comparison.use_shared_tax")}</SelectItem>
              <SelectItem value={TaxStrategy.STANDARD}>{t("bonds.tax_standard")}</SelectItem>
              <SelectItem value={TaxStrategy.IKE}>{t("bonds.tax_ike")}</SelectItem>
              <SelectItem value={TaxStrategy.IKZE}>{t("bonds.tax_ikze")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
          <div>
            <p className="text-sm font-bold">{t("comparison.custom_horizon")}</p>
            <p className="text-[10px] text-muted-foreground font-medium italic">{t("comparison.custom_horizon_desc")}</p>
          </div>
          <Switch checked={customHorizonEnabled} onCheckedChange={onCustomHorizonEnabledChange} />
        </div>

        {customHorizonEnabled ? (
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <span>{t("comparison.scenario_horizon")}</span>
              <span className="text-primary font-black">
                {Math.max(1, Math.round((customHorizonMonths ?? 12) / 12))} {t("common.years")}
              </span>
            </div>
            <Slider
              value={[customHorizonMonths ?? 12]}
              min={12}
              max={360}
              step={1}
              onValueChange={([value]) => onCustomHorizonMonthsChange(value)}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
