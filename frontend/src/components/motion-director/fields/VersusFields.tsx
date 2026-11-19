import React from 'react';
import { Sliders } from 'lucide-react';
import { Input, Slider } from '../../ui';
import { MotionEvent } from '../../../types';

interface VersusFieldsProps {
  activeBeat: MotionEvent;
  safeIdx: number;
  updateBeat: (idx: number, patch: Partial<MotionEvent>) => void;
}

export const VersusFields: React.FC<VersusFieldsProps> = ({
  activeBeat,
  safeIdx,
  updateBeat,
}) => {
  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
      <div className="flex items-center gap-1.5 text-slate-300">
        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
        <label className="text-[10px] font-mono uppercase font-bold">
          Comparison Items (Left vs Right)
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-mono uppercase text-slate-400">Left Item</label>
          <Input
            sizeVariant="sm"
            value={activeBeat.left_item || ''}
            onChange={(e) => updateBeat(safeIdx, { left_item: e.target.value })}
            placeholder="e.g. FACTOR A..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-mono uppercase text-slate-400">Right Item</label>
          <Input
            sizeVariant="sm"
            value={activeBeat.right_item || ''}
            onChange={(e) => updateBeat(safeIdx, { right_item: e.target.value })}
            placeholder="e.g. OUTCOME B..."
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Slider
          label="Left Ratio"
          min={0}
          max={100}
          step={5}
          value={activeBeat.left_ratio ?? 45}
          valueDisplay={`${activeBeat.left_ratio ?? 45}%`}
          onChange={(val) => updateBeat(safeIdx, { left_ratio: val })}
        />
        <Slider
          label="Right Ratio"
          min={0}
          max={100}
          step={5}
          value={activeBeat.right_ratio ?? 90}
          valueDisplay={`${activeBeat.right_ratio ?? 90}%`}
          onChange={(val) => updateBeat(safeIdx, { right_ratio: val })}
        />
      </div>
    </div>
  );
};
