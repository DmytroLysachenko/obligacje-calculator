'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Edit3, Save, RotateCcw, TrendingUp } from 'lucide-react';
import { useAppI18n } from '@/i18n/client';

interface MacroPoint {
  year: number;
  inflation: number;
  nbpRate: number;
}

interface MacroAdjusterProps {
  initialInflation: number;
  initialNbpRate: number;
  horizonYears: number;
  onUpdate: (path: { inflation: number[]; nbpRate: number[] }) => void;
}

export const MacroAdjuster: React.FC<MacroAdjusterProps> = ({ 
  initialInflation, 
  initialNbpRate, 
  horizonYears,
  onUpdate 
}) => {
  const { t } = useAppI18n();
  const [data, setData] = useState<MacroPoint[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const lastSyncProps = useRef({ initialInflation, initialNbpRate, horizonYears });

  useEffect(() => {
    const shouldSync = lastSyncProps.current.initialInflation !== initialInflation || 
                       lastSyncProps.current.initialNbpRate !== initialNbpRate || 
                       lastSyncProps.current.horizonYears !== horizonYears ||
                       data.length === 0;

    if (shouldSync) {
      const initialData = Array.from({ length: horizonYears + 1 }, (_, i) => ({
        year: i,
        inflation: initialInflation,
        nbpRate: initialNbpRate
      }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(initialData);
      lastSyncProps.current = { initialInflation, initialNbpRate, horizonYears };
    }
  }, [initialInflation, initialNbpRate, horizonYears, data.length]);

  const handleReset = () => {
    const resetData = Array.from({ length: horizonYears + 1 }, (_, i) => ({
      year: i,
      inflation: initialInflation,
      nbpRate: initialNbpRate
    }));
    setData(resetData);
    onUpdate({
      inflation: resetData.map(d => d.inflation),
      nbpRate: resetData.map(d => d.nbpRate)
    });
  };

  const handlePointMove = (year: number, type: 'inflation' | 'nbpRate', value: number) => {
    const newData = data.map(d => d.year === year ? { ...d, [type]: Math.max(-5, Math.min(50, value)) } : d);
    setData(newData);
  };

  const handleSave = () => {
    setIsEditing(false);
    onUpdate({
      inflation: data.map(d => d.inflation),
      nbpRate: data.map(d => d.nbpRate)
    });
  };

  return (
    <section className="space-y-6 border-t border-border py-6">
      <div className="flex flex-row items-center justify-between gap-4 border-b border-dashed border-border pb-4">
        <div>
          <h3 className="flex items-center gap-2 ui-card-title">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t('bonds.macro_painter.title')}
          </h3>
          <p className="ui-metadata text-muted-foreground">{t('bonds.macro_painter.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="h-8 gap-1 rounded-lg text-xs font-semibold"
          >
            <RotateCcw className="h-3 w-3" />
            {t('bonds.macro_painter.reset')}
          </Button>
          <Button
            variant={isEditing ? "default" : "outline"}
 
            size="sm" 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="h-8 gap-1 rounded-lg text-xs font-semibold"
          >
            {isEditing ? <Save className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            {isEditing ? t('bonds.macro_painter.apply_path') : t('bonds.macro_painter.edit_path')}
          </Button>
        </div>
      </div>
      <div>
        <div className="h-[250px] w-full relative">
          {!isEditing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 opacity-0 transition-opacity hover:opacity-100">
               <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)} className="rounded-lg text-xs font-semibold">{t('bonds.macro_painter.click_to_edit')}</Button>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="year" hide />
              <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'none' }}
                labelFormatter={(year) => t('bonds.tax_leak.year', { year })}
              />
              <Line 
                type="monotone" 
                dataKey="inflation" 
                stroke="hsl(var(--destructive))"
                strokeWidth={isEditing ? 4 : 2} 
                dot={isEditing}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="nbpRate" 
                stroke="hsl(var(--primary))"
                strokeWidth={isEditing ? 4 : 2} 
                dot={isEditing}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {isEditing && (
          <div className="mt-4 grid grid-cols-5 gap-2">
             {data.filter((_, i) => i % Math.max(1, Math.floor(horizonYears/5)) === 0).map((point) => (
               <div key={point.year} className="space-y-1">
                 <p className="text-center ui-metadata">Y{point.year}</p>
                 <input 
                   type="number" 
                   value={point.inflation}
                   onChange={(e) => handlePointMove(point.year, 'inflation', Number(e.target.value))}
                   className="w-full rounded border border-border bg-background p-1 text-[10px] font-semibold text-destructive"
                   step="0.1"
                 />
                 <input 
                   type="number" 
                   value={point.nbpRate}
                   onChange={(e) => handlePointMove(point.year, 'nbpRate', Number(e.target.value))}
                   className="w-full rounded border border-border bg-background p-1 text-[10px] font-semibold text-primary"
                   step="0.1"
                 />
               </div>
             ))}
          </div>
        )}
        <div className="mt-4 flex justify-center gap-6">
           <div className="flex items-center gap-2">
             <div className="h-3 w-3 rounded-full bg-destructive" />
             <span className="ui-metadata text-muted-foreground">{t('bonds.macro_painter.inflation_path')}</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="h-3 w-3 rounded-full bg-primary" />
             <span className="ui-metadata text-muted-foreground">{t('bonds.macro_painter.nbp_path')}</span>
           </div>
        </div>
      </div>
    </section>
  );
};




