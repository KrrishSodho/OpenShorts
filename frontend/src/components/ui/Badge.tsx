import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'cyan'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'violet';

export type BadgeSize = 'xs' | 'sm';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-slate-800 text-slate-300 border border-slate-700',
  cyan:
    'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
  amber:
    'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  emerald:
    'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  rose:
    'bg-rose-500/15 text-rose-300 border border-rose-500/30',
  violet:
    'bg-purple-500/15 text-purple-300 border border-purple-500/30',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded gap-1',
  sm: 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'xs',
  icon,
  className = '',
  children,
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center shrink-0 leading-none select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
