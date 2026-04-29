'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, FolderOpen, Save, Trash2 } from 'lucide-react';
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
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <FolderOpen className="h-4 w-4 text-primary" />
              Saved Scenarios
            </CardTitle>
            <CardDescription>
              Resume, duplicate, or clean up your last planning runs.
            </CardDescription>
          </div>
          <Button size="sm" className="gap-2 text-xs font-bold" onClick={onSaveCurrent}>
            <Save className="h-3.5 w-3.5" />
            Save Current
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {scenarios.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
            No saved scenarios yet. Save current inputs to build reusable planning paths.
          </div>
        ) : (
          scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black tracking-tight text-slate-900">{scenario.name}</h3>
                    {scenario.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] font-black uppercase tracking-widest">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Updated {new Date(scenario.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 lg:w-[260px]">
                  <Button variant="outline" size="sm" className="gap-2 text-xs font-bold" onClick={() => onLoad(scenario)}>
                    <FolderOpen className="h-3.5 w-3.5" />
                    Open
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-xs font-bold" onClick={() => onDuplicate(scenario)}>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-xs font-bold text-destructive" onClick={() => onDelete(scenario)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
