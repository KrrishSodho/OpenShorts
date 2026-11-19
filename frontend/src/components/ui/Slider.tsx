import React from 'react';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
  valueDisplay?: string | number;
  className?: string;
  sizeVariant?: 'sm' | 'md';
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  label,
  valueDisplay,
  className = '',
  sizeVariant = 'sm',
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100));

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {(label || valueDisplay !== undefined) && (
        <div className="flex items-center justify-between text-[11px] font-mono leading-none">
          {label && <span className="text-slate-400 font-bold uppercase">{label}</span>}
          {valueDisplay !== undefined && (
            <span className="text-cyan-400 font-bold ml-auto">{valueDisplay}</span>
          )}
        </div>
      )}
      <div className="relative flex items-center w-full h-6 select-none touch-none">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #00F5FF 0%, #00F5FF ${percentage}%, #1E293B ${percentage}%, #1E293B 100%)`,
          }}
          className={`w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-950 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,245,255,0.6)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-950 [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(0,245,255,0.6)]`}
        />
      </div>
    </div>
  );
};
