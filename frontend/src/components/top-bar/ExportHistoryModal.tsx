import React from 'react';
import { Download, Trash2, Film, Clock, FileVideo } from 'lucide-react';
import { ExportHistoryItem } from '../../types';
import { Modal, Button, IconButton, Badge } from '../ui';

interface ExportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportHistory: ExportHistoryItem[];
  onRemoveItem: (renderId: string) => void;
  onClearAll: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ExportHistoryModal: React.FC<ExportHistoryModalProps> = ({
  isOpen,
  onClose,
  exportHistory,
  onRemoveItem,
  onClearAll,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exported Reel Versions"
      subtitle={`${exportHistory.length} rendered social-ready video(s)`}
      maxWidth="xl"
    >
      <div className="flex flex-col gap-4">
        {exportHistory.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="xs"
              onClick={onClearAll}
              leftIcon={<Trash2 className="w-3 h-3 text-rose-400" />}
            >
              Clear All History
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {exportHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2.5 text-center">
              <FileVideo className="w-10 h-10 text-slate-600" />
              <span className="text-xs font-semibold text-slate-300">
                No Exported Videos Yet
              </span>
              <span className="text-[11px] text-slate-500 max-w-xs">
                Click 'Export MP4' on the top command bar to render your high-retention reel.
              </span>
            </div>
          ) : (
            exportHistory.map((item) => (
              <div
                key={item.renderId}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-20 rounded-lg overflow-hidden bg-black border border-slate-800 shrink-0 relative flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-5 h-5 text-slate-600" />
                    )}
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/85 text-[8px] font-mono font-bold text-emerald-400">
                      v{item.version}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {item.title}
                      </span>
                      <Badge variant="emerald" size="xs">Ready</Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-slate-400">
                      <span className="text-purple-300">{item.presetName}</span>
                      <span>•</span>
                      <span className="text-cyan-300">{item.subtitleStyle}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {item.durationSec && (
                        <span>{item.durationSec.toFixed(1)}s</span>
                      )}
                      {item.fileSizeBytes && (
                        <span>{formatBytes(item.fileSizeBytes)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.downloadUrl}
                    download={`viral_short_v${item.version}.mp4`}
                  >
                    <Button
                      variant="primary"
                      size="xs"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                  </a>
                  <IconButton
                    variant="ghost"
                    size="xs"
                    onClick={() => onRemoveItem(item.renderId)}
                    title="Delete item"
                    aria-label="Delete item"
                    icon={<Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400" />}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
