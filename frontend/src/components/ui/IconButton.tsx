import React from 'react';
import { Loader2 } from 'lucide-react';
import { ButtonVariant, ButtonSize } from './Button';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  'aria-label': string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 border border-cyan-400/30',
  secondary:
    'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600',
  ghost:
    'bg-transparent hover:bg-slate-800/80 text-slate-400 hover:text-white border border-transparent',
  danger:
    'bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/40 shadow-sm shadow-rose-900/30',
  accent:
    'bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:opacity-95 text-white border border-white/10 shadow-md shadow-cyan-500/20',
  outline:
    'bg-transparent hover:bg-slate-800/60 text-slate-300 border border-studio-border hover:border-slate-500',
  warning:
    'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 w-7 rounded-lg text-xs',
  sm: 'h-8 w-8 rounded-lg text-xs',
  md: 'h-9 w-9 rounded-xl text-sm',
  lg: 'h-10 w-10 rounded-xl text-base',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'secondary',
      size = 'sm',
      isLoading = false,
      disabled,
      className = '',
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
        className={`inline-flex items-center justify-center shrink-0 transition-all select-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-40 disabled:pointer-events-none ${
          variantStyles[variant]
        } ${iconSizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
