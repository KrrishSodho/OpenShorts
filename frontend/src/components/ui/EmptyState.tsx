import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3 select-none ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-cyan-400/80 shadow-inner">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1 max-w-xs">
        <h3 className="text-sm font-headline font-bold text-slate-100 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};
