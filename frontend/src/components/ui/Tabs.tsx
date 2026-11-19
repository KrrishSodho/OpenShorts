import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'xs' | 'sm';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'sm',
}) => {
  const containerHeight = size === 'xs' ? 'h-8' : 'h-9';
  const itemHeight = size === 'xs' ? 'h-6' : 'h-7';
  const textSize = size === 'xs' ? 'text-[11px]' : 'text-xs';

  return (
    <div
      role="tablist"
      className={`bg-slate-900/90 border border-studio-border p-1 rounded-xl flex items-center gap-1 ${containerHeight} ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex-1 ${itemHeight} ${textSize} px-2.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all select-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 ${
              isActive
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.icon && (
              <span className={`shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
                {tab.icon}
              </span>
            )}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-slate-950 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
