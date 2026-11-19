// PATH: frontend/src/components/ui/ColorPickerField.tsx
import React from 'react';
import { Pipette } from 'lucide-react';
import { Button } from './Button';

export interface ColorSwatch {
  name: string;
  val: string;
}

export interface ColorPickerFieldProps {
  label: string;
  value?: string | null;
  swatches?: ColorSwatch[];
  onChange: (color: string | null) => void;
  defaultPlaceholder?: string;
  autoLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label,
  value,
  swatches = [],
  onChange,
  defaultPlaceholder = '#00F5FF',
  autoLabel = 'Theme Auto',
  icon,
  disabled = false,
}) => {
  const isAuto = !value;
  const currentVal = value || '';

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.trim().toUpperCase();
    if (raw && !raw.startsWith('#')) {
      raw = '#' + raw;
    }
    // If empty or just '#', reset to auto/null
    if (!raw || raw === '#') {
      onChange(null);
    } else {
      onChange(raw);
    }
  };

  return (
    <div className="flex flex-col gap-1 pt-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
          {icon}
          <span>{label}</span>
        </label>
        {autoLabel && (
          <Button
            variant={isAuto ? 'primary' : 'ghost'}
            size="xs"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="h-5 px-1.5 text-[9px] font-bold"
          >
            {autoLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        {swatches.map((sw) => {
          const isSel = currentVal.toUpperCase() === sw.val.toUpperCase();
          return (
            <button
              key={sw.name}
              type="button"
              disabled={disabled}
              onClick={() => onChange(sw.val)}
              title={`${label}: ${sw.name} (${sw.val})`}
              aria-label={`${label} ${sw.name}`}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                isSel
                  ? 'border-white ring-2 ring-cyan-400 scale-110 z-10 shadow-sm'
                  : 'border-slate-700 hover:scale-105'
              }`}
              style={{ backgroundColor: sw.val }}
            />
          );
        })}

        {/* Native Pipette / Palette Trigger */}
        <label
          title={`Custom ${label} Picker`}
          className={`relative w-5 h-5 rounded-md cursor-pointer flex items-center justify-center overflow-hidden transition-all shadow-sm ${
            value && !swatches.some((s) => s.val.toUpperCase() === currentVal.toUpperCase())
              ? 'ring-2 ring-cyan-400 scale-110 shadow-lg'
              : 'border border-slate-600 hover:scale-105'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          style={{
            background:
              'conic-gradient(from 180deg at 50% 50%, #EF4444 0deg, #F59E0B 72deg, #10B981 144deg, #00F5FF 216deg, #A855F7 288deg, #EF4444 360deg)',
          }}
        >
          <Pipette className="w-2.5 h-2.5 text-slate-950 stroke-[3] relative z-10 drop-shadow-sm" />
          <input
            type="color"
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer"
            value={value || defaultPlaceholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>

        {/* Direct Hex Code Input Field */}
        <input
          type="text"
          disabled={disabled}
          value={currentVal}
          onChange={handleHexInput}
          placeholder={defaultPlaceholder}
          maxLength={7}
          title={`Type custom Hex code for ${label}, e.g. #FFFFFF or #1E293B`}
          className="w-16 px-1.5 py-0.5 text-[9px] font-mono bg-slate-950 border border-slate-700 rounded text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
        />
      </div>
    </div>
  );
};
