'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useLanguage } from '@/i18n';

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
  const { t } = useLanguage();
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
    <Card className="border-2 rounded-3xl overflow-hidden shadow-xl">
      <CardHeader className="bg-muted/30 border-b border-dashed flex flex-row items-center justify-between py-4">
        <div>
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t('bonds.macro_painter.title')}
          </CardTitle>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('bonds.macro_painter.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="h-8 rounded-xl text-[10px] font-black uppercase gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            {t('bonds.macro_painter.reset')}
          </Button>
          <Button
            variant={isEditing ? "default" : "outline"}
 
            size="sm" 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="h-8 rounded-xl text-[10px] font-black uppercase gap-1"
          >
            {isEditing ? <Save className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            {isEditing ? t('bonds.macro_painter.apply_path') : t('bonds.macro_painter.edit_path')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[250px] w-full relative">
          {!isEditing && (
            <div className="absolute inset-0 z-10 bg-white/5 backdrop-blur-[1px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
               <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)} className="rounded-full font-black uppercase text-[10px]">{t('bonds.macro_painter.click_to_edit')}</Button>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="year" hide />
              <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelFormatter={(year) => t('bonds.tax_leak.year', { year })}
              />
              <Line 
                type="monotone" 
                dataKey="inflation" 
                stroke="#ef4444" 
                strokeWidth={isEditing ? 4 : 2} 
                dot={isEditing}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="nbpRate" 
                stroke="#3b82f6" 
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
                 <p className="text-[9px] font-black text-center uppercase">Y{point.year}</p>
                 <input 
                   type="number" 
                   value={point.inflation}
                   onChange={(e) => handlePointMove(point.year, 'inflation', Number(e.target.value))}
                   className="w-full text-[10px] font-bold p-1 rounded border text-red-600 bg-red-50"
                   step="0.1"
                 />
                 <input 
                   type="number" 
                   value={point.nbpRate}
                   onChange={(e) => handlePointMove(point.year, 'nbpRate', Number(e.target.value))}
                   className="w-full text-[10px] font-bold p-1 rounded border text-blue-600 bg-blue-50"
                   step="0.1"
                 />
               </div>
             ))}
          </div>
        )}
        <div className="mt-4 flex justify-center gap-6">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-red-500 rounded-full" />
             <span className="text-[10px] font-bold uppercase text-muted-foreground">{t('bonds.macro_painter.inflation_path')}</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-blue-500 rounded-full" />
             <span className="text-[10px] font-bold uppercase text-muted-foreground">{t('bonds.macro_painter.nbp_path')}</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
};
