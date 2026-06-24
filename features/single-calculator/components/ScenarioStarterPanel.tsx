'use client';

import { Rocket, Sparkles } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { StarterScenarioDefinition } from '../lib/scenario-storage';

interface ScenarioStarterPanelProps {
  starters: StarterScenarioDefinition[];
  onApply: (starter: StarterScenarioDefinition) => void;
  onDismiss: () => void;
}

export function ScenarioStarterPanel({ starters, onApply, onDismiss }: ScenarioStarterPanelProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-foreground" />
            <h2 className="ui-card-title">Quick Start</h2>
          </div>
          <p className="ui-meta">Start from realistic presets instead of blank inputs.</p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={onDismiss}>
          Hide
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {starters.map((starter) => (
          <button
            key={starter.id}
            type="button"
            onClick={() => onApply(starter)}
            className="rounded-lg bg-muted/35 p-4 text-left transition-colors hover:bg-muted/60"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-foreground" />
                  <span className="ui-card-title">{starter.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{starter.description}</p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              >
                Preset
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
