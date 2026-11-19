import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Input } from '../../ui';
import { MotionEvent } from '../../../types';

interface ChartFieldsProps {
  activeBeat: MotionEvent;
  safeIdx: number;
  updateBeat: (idx: number, patch: Partial<MotionEvent>) => void;
}

export const ChartFields: React.FC<ChartFieldsProps> = ({
  activeBeat,
  safeIdx,
  updateBeat,
}) => {
  const vals =
    activeBeat.chart_values && activeBeat.chart_values.length >= 4
      ? activeBeat.chart_values
      : [25, 50, 74, 95];

  return (
    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
      <label className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3 text-cyan-400" />
        <span>Spline Chart Points (4 Values)</span>
      </label>
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((ptIdx) => (
          <Input
            key={ptIdx}
            sizeVariant="sm"
            type="number"
            min={0}
            max={100}
            value={vals[ptIdx] ?? 50}
            onChange={(e) => {
              const nextVals = [...vals];
              nextVals[ptIdx] = Math.max(0, Math.min(100, Number(e.target.value)));
              updateBeat(safeIdx, { chart_values: nextVals });
            }}
          />
        ))}
      </div>
    </div>
  );
};
