import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FolderOpen,
  Youtube,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Film,
  Play,
  X,
} from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import { fetchRecentEpisodes, RecentEpisodeItem } from '../api';
import { stopSfxAudioPreview } from '../utils/audioPreview';
import { Modal, Button, IconButton, Input, Badge } from './ui';

export const LoadVideoModal: React.FC = () => {
  const {
    isLoadModalOpen,
    setLoadModalOpen,
    pipelineState,
    jobProgress,
    jobStep,
    errorMessage,
    setErrorMessage,
    startLocalPathIngest,
    startFileUploadIngest,
    startYoutubeIngest,
    loadExistingEpisode,
    cancelIngestJob,
  } = useStudioStore();

  const [sourceTab, setSourceTab] = useState<'local' | 'youtube'>('local');
  const [localPath, setLocalPath] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [customScript, setCustomScript] = useState('');
  const [showScript, setShowScript] = useState(false);
  const [recentEpisodes, setRecentEpisodes] = useState<RecentEpisodeItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = pipelineState === 'PROCESSING';

  useEffect(() => {
    if (isLoadModalOpen) {
      stopSfxAudioPreview();
      fetchRecentEpisodes()
        .then((eps) => setRecentEpisodes(eps))
        .catch(() => setRecentEpisodes([]));
    }
  }, [isLoadModalOpen]);

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPath.trim() || isProcessing) return;
    startLocalPathIngest(localPath, customScript);
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim() || isProcessing) return;
    startYoutubeIngest(youtubeUrl, customScript);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !isProcessing) {
      startFileUploadIngest(file);
      e.target.value = '';
    }
  };

  return (
    <Modal
      isOpen={isLoadModalOpen}
      onClose={() => setLoadModalOpen(false)}
      title="Load Source Episode"
      subtitle="Select a local file, paste a disk path, or ingest from YouTube"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-500/80 rounded-xl p-3 flex items-start justify-between gap-2 text-xs text-rose-100">
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <IconButton
              variant="ghost"
              size="xs"
              onClick={() => setErrorMessage(null)}
              icon={<X className="w-3.5 h-3.5" />}
              aria-label="Dismiss error"
            />
          </div>
        )}

        {/* Source Tab Toggle */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-studio-border rounded-xl">
          <Button
            variant={sourceTab === 'local' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSourceTab('local')}
            leftIcon={<FolderOpen className="w-3.5 h-3.5" />}
          >
            Local File / Disk Path
          </Button>
          <Button
            variant={sourceTab === 'youtube' ? 'danger' : 'ghost'}
            size="sm"
            onClick={() => setSourceTab('youtube')}
            leftIcon={<Youtube className="w-3.5 h-3.5" />}
          >
            YouTube Link
          </Button>
        </div>

        {sourceTab === 'local' ? (
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/mkv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="md"
              fullWidth
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-4 h-4 text-cyan-400" />}
              className="border-dashed border-cyan-500/50 hover:border-cyan-400 text-cyan-200"
            >
              Select Video File (.mp4, .mov, .mkv)
            </Button>

            <form onSubmit={handleLocalSubmit} className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono text-slate-400">
                Or Paste Exact File Path on Disk (Instant):
              </label>
              <div className="flex gap-2">
                <Input
                  sizeVariant="md"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="F:\Ai Learning\episode.mp4"
                  disabled={isProcessing}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isProcessing || !localPath.trim()}
                  isLoading={isProcessing}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Generate
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleYoutubeSubmit} className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-slate-400">
              YouTube URL (Extracts VTT captions instantly):
            </label>
            <div className="flex gap-2">
              <Input
                sizeVariant="md"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                disabled={isProcessing}
              />
              <Button
                type="submit"
                variant="danger"
                size="md"
                disabled={isProcessing || !youtubeUrl.trim()}
                isLoading={isProcessing}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Generate
              </Button>
            </div>
          </form>
        )}

        {/* Recent Processed Episodes List */}
        {recentEpisodes.length > 0 && !isProcessing && (
          <div className="border border-studio-border rounded-xl bg-slate-950/60 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Film className="w-3.5 h-3.5" />
                Recent Processed Episodes ({recentEpisodes.length})
              </span>
              <span className="text-[10px] text-slate-500">Instant Load</span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {recentEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-bold text-white truncate max-w-[280px]">
                      {ep.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>{(ep.duration / 60).toFixed(1)} mins</span>
                      {ep.word_count > 0 && <span>• {ep.word_count} words</span>}
                      {ep.manifest_count > 0 && (
                        <span>• {ep.manifest_count} shorts ready</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => loadExistingEpisode(ep.id)}
                    leftIcon={<Play className="w-3 h-3 fill-current" />}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Script Accordion */}
        <div className="border border-studio-border rounded-xl bg-slate-950/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowScript(!showScript)}
            className="w-full h-9 px-3.5 flex items-center justify-between text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-medium">Optional: Paste SRT / Script (Skips Whisper)</span>
            </div>
            {showScript ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>
          {showScript && (
            <div className="p-3 border-t border-studio-border">
              <textarea
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                rows={3}
                placeholder="Paste SRT or transcript text..."
                className="w-full bg-slate-950 border border-studio-border rounded-lg p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Processing Progress Bar */}
        {isProcessing && (
          <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-100 font-medium truncate pr-2">
                {jobStep}
              </span>
              <span className="font-mono font-bold text-cyan-400">
                {jobProgress}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(5, jobProgress))}%` }}
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="xs"
                onClick={cancelIngestJob}
                leftIcon={<X className="w-3 h-3 text-rose-400" />}
              >
                Cancel Ingest
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
