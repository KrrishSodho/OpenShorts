import React from 'react';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  sizeVariant?: 'sm' | 'md';
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  error?: string;
  fullWidth?: boolean;
}

const inputSizeStyles = {
  sm: 'h-8 px-2.5 text-xs rounded-lg',
  md: 'h-9 px-3 text-xs rounded-xl',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      sizeVariant = 'sm',
      leftAdornment,
      rightAdornment,
      error,
      fullWidth = true,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}>
        <div className="relative flex items-center">
          {leftAdornment && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-slate-400">
              {leftAdornment}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={`w-full bg-slate-900/90 border text-slate-100 placeholder:text-slate-500 font-sans transition-colors focus:outline-none focus:ring-1 disabled:opacity-40 disabled:cursor-not-allowed ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40'
                : 'border-studio-border focus:border-cyan-500 focus:ring-cyan-500/40'
            } ${inputSizeStyles[sizeVariant]} ${
              leftAdornment ? 'pl-8' : ''
            } ${rightAdornment ? 'pr-8' : ''} ${className}`}
            {...props}
          />
          {rightAdornment && (
            <div className="absolute right-2.5 flex items-center text-slate-400">
              {rightAdornment}
            </div>
          )}
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

Input.displayName = 'Input';
