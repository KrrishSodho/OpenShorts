import React from 'react';

export interface PanelHeaderProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  icon,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`h-11 px-3.5 bg-slate-900/60 border-b border-studio-border flex items-center justify-between gap-2 shrink-0 select-none ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className="text-cyan-400 shrink-0 flex items-center">{icon}</span>
        )}
        <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-slate-200 truncate">
          {title}
        </h3>
        {badge && <span className="shrink-0">{badge}</span>}
      </div>
      {actions && (
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
