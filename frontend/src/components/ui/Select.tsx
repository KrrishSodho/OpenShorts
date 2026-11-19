import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  sizeVariant?: 'sm' | 'md';
  options?: SelectOption[];
  error?: string;
  fullWidth?: boolean;
}

const selectSizeStyles = {
  sm: 'h-8 pl-2.5 pr-8 text-xs rounded-lg',
  md: 'h-9 pl-3 pr-8 text-xs rounded-xl',
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      sizeVariant = 'sm',
      options,
      error,
      fullWidth = true,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}>
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none bg-slate-900/90 border text-slate-100 font-sans transition-colors cursor-pointer focus:outline-none focus:ring-1 disabled:opacity-40 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40'
              : 'border-studio-border focus:border-cyan-500 focus:ring-cyan-500/40'
          } ${selectSizeStyles[sizeVariant]} ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-slate-900 text-slate-100"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
        {error && (
          <span className="block mt-1 text-[11px] font-mono text-rose-400">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
