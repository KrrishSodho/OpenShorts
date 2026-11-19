import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { Button, IconButton, Input } from '../../ui';

interface StepsFieldsProps {
  currentSteps: string[];
  handleAutoPickKeywords: () => void;
  handleAddStep: () => void;
  handleRemoveStep: (idx: number) => void;
  handleStepChange: (idx: number, val: string) => void;
}

export const StepsFields: React.FC<StepsFieldsProps> = ({
  currentSteps,
  handleAutoPickKeywords,
  handleAddStep,
  handleRemoveStep,
  handleStepChange,
}) => {
  return (
    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
          <span>Escalating Steps & Nodes ({currentSteps.length})</span>
        </label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleAutoPickKeywords}
            leftIcon={<Sparkles className="w-3 h-3 text-cyan-400" />}
            title="Pick top words from spoken audio"
          >
            Auto Pick
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={handleAddStep}
            leftIcon={<Plus className="w-3 h-3" />}
          >
            Add Step
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
        {currentSteps.map((stepVal, stepIdx) => (
          <div key={stepIdx} className="flex items-center gap-1.5">
            <span className="w-6 text-[10px] font-mono font-bold text-slate-400 text-center shrink-0">
              0{stepIdx + 1}
            </span>
            <Input
              sizeVariant="sm"
              value={stepVal}
              onChange={(e) => handleStepChange(stepIdx, e.target.value)}
              placeholder={`Step ${stepIdx + 1}...`}
              className="flex-1"
            />
            {currentSteps.length > 1 && (
              <IconButton
                variant="ghost"
                size="xs"
                onClick={() => handleRemoveStep(stepIdx)}
                icon={<X className="w-3 h-3 text-slate-400 hover:text-rose-400" />}
                aria-label="Remove step"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
