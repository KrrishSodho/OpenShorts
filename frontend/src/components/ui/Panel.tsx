import React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  fullHeight?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  fullHeight = true,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-studio-panel/90 border border-studio-border rounded-2xl flex flex-col overflow-hidden shadow-xl ${
        fullHeight ? 'h-full min-h-0' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
