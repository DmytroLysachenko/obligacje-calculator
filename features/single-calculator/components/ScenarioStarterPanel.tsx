'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Sparkles } from 'lucide-react';
import { StarterScenarioDefinition } from '../lib/scenario-storage';

interface ScenarioStarterPanelProps {
  starters: StarterScenarioDefinition[];
  onApply: (starter: StarterScenarioDefinition) => void;
  onDismiss: () => void;
}

export function ScenarioStarterPanel({
  starters,
  onApply,
  onDismiss,
}: ScenarioStarterPanelProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-primary/10">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">
                Quick Start
              </CardTitle>
            </div>
            <CardDescription>
              Start from realistic presets instead of blank inputs.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={onDismiss}>
            Hide
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
        {starters.map((starter) => (
          <button
            key={starter.id}
            type="button"
            onClick={() => onApply(starter)}
            className="rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-black tracking-tight text-slate-900">{starter.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{starter.description}</p>
              </div>
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">
                Preset
              </Badge>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
