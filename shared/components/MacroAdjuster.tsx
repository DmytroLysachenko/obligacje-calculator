'use client';

import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface MacroAdjusterProps {
  label: string;
  initialPoints?: [number, number, number]; // [Year 1, Year 5, Year 10]
  onChange: (monthlyPath: number[]) => void;
  maxMonths?: number;
}

const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

export const MacroAdjuster: React.FC<MacroAdjusterProps> = ({
  label,
  initialPoints = [5, 3, 2.5],
  onChange,
  maxMonths = 120,
}) => {
  const [points, setPoints] = useState<[number, number, number]>(initialPoints);

  useEffect(() => {
    // Generate full monthly path using linear interpolation between control points
    const path: number[] = [];
    
    // Control points at month 12 (Year 1), month 60 (Year 5), month 120 (Year 10)
    const p1 = { x: 12, y: points[0] };
    const p5 = { x: 60, y: points[1] };
    const p10 = { x: 120, y: points[2] };

    for (let m = 1; m <= maxMonths; m++) {
      if (m <= p1.x) {
        // Flat before year 1 or lerp from current? Let's just hold it flat before year 1 for simplicity,
        // or lerp from current (assume current is also p1 for now)
        path.push(p1.y);
      } else if (m <= p5.x) {
        const t = (m - p1.x) / (p5.x - p1.x);
        path.push(lerp(p1.y, p5.y, t));
      } else if (m <= p10.x) {
        const t = (m - p5.x) / (p10.x - p5.x);
        path.push(lerp(p5.y, p10.y, t));
      } else {
        path.push(p10.y); // Flat after year 10
      }
    }

    onChange(path);
  }, [points, maxMonths, onChange]);

  const handlePointChange = (index: 0 | 1 | 2, value: number) => {
    const newPoints = [...points] as [number, number, number];
    newPoints[index] = value;
    setPoints(newPoints);
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div>
        <h4 className="font-semibold">{label} Path</h4>
        <p className="text-sm text-muted-foreground">Adjust target values at key milestones.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Year 1 Target</Label>
            <span className="text-sm font-medium">{points[0].toFixed(2)}%</span>
          </div>
          <Slider
            min={-5}
            max={20}
            step={0.1}
            value={[points[0]]}
            onValueChange={([val]) => handlePointChange(0, val)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Year 5 Target</Label>
            <span className="text-sm font-medium">{points[1].toFixed(2)}%</span>
          </div>
          <Slider
            min={-5}
            max={20}
            step={0.1}
            value={[points[1]]}
            onValueChange={([val]) => handlePointChange(1, val)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Year 10 Target</Label>
            <span className="text-sm font-medium">{points[2].toFixed(2)}%</span>
          </div>
          <Slider
            min={-5}
            max={20}
            step={0.1}
            value={[points[2]]}
            onValueChange={([val]) => handlePointChange(2, val)}
          />
        </div>
      </div>
    </div>
  );
};
