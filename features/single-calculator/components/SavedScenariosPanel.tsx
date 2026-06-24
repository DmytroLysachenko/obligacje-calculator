'use client';
import { Copy, FolderOpen, Save, Trash2 } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';
import { getIntlLocale } from '@/i18n/locale-utils';

import { SavedScenarioRecord } from '../lib/scenario-storage';
interface SavedScenariosPanelProps {
  scenarios: SavedScenarioRecord[];
  onSaveCurrent: () => void;
  onLoad: (scenario: SavedScenarioRecord) => void;
  onDuplicate: (scenario: SavedScenarioRecord) => void;
  onDelete: (scenario: SavedScenarioRecord) => void;
}
export function SavedScenariosPanel({
  scenarios,
  onSaveCurrent,
  onLoad,
  onDuplicate,
  onDelete,
}: SavedScenariosPanelProps) {
  const { t, locale: language } = useAppI18n();
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="ui-card-title flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-foreground" />
            {t('single_calculator.saved_scenarios.title')}
          </h2>
          <p className="ui-meta">{t('single_calculator.saved_scenarios.description')}</p>
        </div>
        <Button size="sm" className="gap-2 text-xs font-semibold" onClick={onSaveCurrent}>
          <Save className="h-3.5 w-3.5" />
          {t('single_calculator.saved_scenarios.save_current')}
        </Button>
      </div>
      <div className="ui-divider-group">
        {scenarios.length === 0 ? (
          <div className="py-4 text-sm text-muted-foreground">
            {t('single_calculator.saved_scenarios.empty')}
          </div>
        ) : (
          scenarios.map((scenario) => (
            <div key={scenario.id} className="py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="ui-card-title">{scenario.name}</h3>
                    {scenario.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {t('single_calculator.saved_scenarios.updated')}{' '}
                    {new Date(scenario.updatedAt).toLocaleString(getIntlLocale(language))}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 lg:w-[260px]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs font-semibold"
                    onClick={() => onLoad(scenario)}
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    {t('single_calculator.saved_scenarios.open')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs font-semibold"
                    onClick={() => onDuplicate(scenario)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t('single_calculator.saved_scenarios.copy')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs font-semibold text-destructive"
                    onClick={() => onDelete(scenario)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('single_calculator.saved_scenarios.delete')}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
