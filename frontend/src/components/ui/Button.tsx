import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'accent'
  | 'outline'
  | 'warning';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 border border-cyan-400/30',
  secondary:
    'bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700 hover:border-slate-600',
  ghost:
    'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent',
  danger:
    'bg-rose-600/90 hover:bg-rose-500 text-white font-semibold border border-rose-500/40 shadow-sm shadow-rose-900/30',
  accent:
    'bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:opacity-95 text-white font-headline font-bold shadow-md shadow-cyan-500/20 border border-white/10',
  outline:
    'bg-transparent hover:bg-slate-800/60 text-slate-200 border border-studio-border hover:border-slate-500',
  warning:
    'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] rounded-lg gap-1.5',
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-9 px-3.5 text-xs rounded-xl gap-2',
  lg: 'h-10 px-4 text-sm rounded-xl gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'sm',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center shrink-0 font-medium transition-all select-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-40 disabled:pointer-events-none ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        {children && <span className="truncate">{children}</span>}
        {!isLoading && rightIcon && (
          <span className="shrink-0 flex items-center ml-auto">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
