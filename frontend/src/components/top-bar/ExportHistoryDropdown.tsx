import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { History, Download, Film, Maximize2 } from 'lucide-react';
import { ExportHistoryItem } from '../../types';
import { Button } from '../ui';

interface ExportHistoryDropdownProps {
  exportHistory: ExportHistoryItem[];
  onOpenModal?: () => void;
}

export const ExportHistoryDropdown: React.FC<ExportHistoryDropdownProps> = ({
  exportHistory,
  onOpenModal,
}) => {
  if (exportHistory.length === 0) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 font-mono font-bold shrink-0"
          leftIcon={<History className="w-3.5 h-3.5 text-emerald-400" />}
        >
          <span>Exports ({exportHistory.length})</span>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="w-[340px] bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-50 flex flex-col gap-1.5"
        >
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
            <span>Rendered Shorts ({exportHistory.length})</span>
            {onOpenModal && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onOpenModal}
                className="h-6 px-1.5 text-cyan-400 hover:text-cyan-300 font-bold lowercase text-[10px]"
                leftIcon={<Maximize2 className="w-3 h-3" />}
              >
                view all
              </Button>
            )}
          </div>
          {exportHistory.slice(0, 5).map((item) => (
            <a
              key={item.renderId}
              href={item.downloadUrl}
              download={`viral_short_v${item.version}.mp4`}
              className="p-2 rounded-lg bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-2.5 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-12 rounded bg-black border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                      v{item.version}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.presetName} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
            </a>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
