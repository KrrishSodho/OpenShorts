import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Layers,
  Sparkles,
  ChevronDown,
  Plus,
  Loader2,
  Check,
  Film,
  XCircle,
  Undo2,
  Redo2,
  Cpu,
  Settings,
} from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import { Button, IconButton, Badge } from './ui';
import { SubtitleDropdown } from './top-bar/SubtitleDropdown';
import { ExportHistoryDropdown } from './top-bar/ExportHistoryDropdown';
import { ExportHistoryModal } from './top-bar/ExportHistoryModal';
import { AiTraceModal } from './AiTraceModal';
import { SettingsModal } from './SettingsModal';

export const TopCommandBar: React.FC = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAiTraceOpen, setIsAiTraceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    apiStatus,
    currentMedia,
    recommendedClips,
    activeClipId,
    clipEditsById,
    isPreparingClip,
    selectShort,
    subtitleConfig,
    setSubtitleConfig,
    presets,
    selectedPreset,
    setSelectedPreset,
    fps,
    setFps,
    isRendering,
    renderProgress,
    startRenderExport,
    cancelRenderExport,
    exportHistory,
    removeExportHistoryItem,
    clearExportHistory,
    canUndo,
    canRedo,
    undo,
    redo,
    setLoadModalOpen,
    pipelineState,
  } = useStudioStore();

  const activeClip = activeClipId ? clipEditsById[activeClipId] : null;

  return (
    <header className="h-14 px-4 bg-studio-panel border-b border-studio-border flex items-center justify-between gap-3 shrink-0 shadow-lg select-none z-30">
      {/* Left zone: Brand & Session */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2 mr-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline font-black text-xs tracking-wider text-white">
              OPENSHORT
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              title={apiStatus === 'online' ? 'Engine Online' : 'Connecting...'}
            />
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={isRendering}
          onClick={() => setLoadModalOpen(true)}
          leftIcon={
            pipelineState === 'PROCESSING' ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
            )
          }
        >
          {currentMedia ? 'New Video' : 'Load Video'}
        </Button>

        {/* Undo / Redo controls */}
        <div className="flex items-center gap-0.5 bg-slate-900/80 border border-slate-700/80 rounded-lg p-0.5">
          <IconButton
            variant="ghost"
            size="xs"
            disabled={!canUndo || isRendering}
            onClick={undo}
            title="Undo edit (Ctrl+Z)"
            aria-label="Undo edit"
            icon={<Undo2 className="w-3.5 h-3.5" />}
          />
          <IconButton
            variant="ghost"
            size="xs"
            disabled={!canRedo || isRendering}
            onClick={redo}
            title="Redo edit (Ctrl+Y)"
            aria-label="Redo edit"
            icon={<Redo2 className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Center zone: Active Short & Presets */}
      <div className="flex items-center gap-2 shrink-0 justify-center">
        {/* Recommended Viral Shorts Switcher */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild disabled={isRendering || isPreparingClip}>
            <Button
              variant="outline"
              size="sm"
              className="shrink text-amber-300 border-amber-500/40 hover:bg-amber-500/20"
              leftIcon={
                isPreparingClip ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                ) : (
                  <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )
              }
              rightIcon={<ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1.5" />}
              title={
                recommendedClips.length > 0
                  ? `Top Shorts (${recommendedClips.length} ready) • Current: ${activeClip?.title || 'Selected'}`
                  : 'Top Shorts (No shorts loaded yet)'
              }
            >
              <span>Top Shorts</span>
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              side="bottom"
              sideOffset={8}
              collisionPadding={16}
              className="w-[360px] bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-50 flex flex-col gap-1.5 max-h-[480px] overflow-y-auto"
            >
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                <span>AI-Detected Viral Shorts</span>
                <span className="text-amber-400 font-bold">{recommendedClips.length} Ready</span>
              </div>

              {recommendedClips.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-slate-400 flex flex-col items-center gap-1.5">
                  <Film className="w-5 h-5 text-slate-600 mb-1" />
                  <span>No viral shorts generated yet.</span>
                  <span className="text-[10px] text-slate-500">Load a video or paste a link to extract top moments.</span>
                </div>
              ) : (
                recommendedClips.map((clip, idx) => {
                  const cid = clip.clip_id || `${currentMedia?.id}_${idx}`;
                  const isSelected = cid === activeClipId;
                  const dur = clip.duration ?? clip.end_time - clip.start_time;
                  return (
                    <DropdownMenu.Item
                      key={`${cid}_${idx}`}
                      onSelect={() => selectShort(clip)}
                      className={`p-2 rounded-lg cursor-pointer outline-none flex items-start justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-amber-500/20 border border-amber-400/60 text-white'
                          : 'hover:bg-slate-800 text-slate-200 border border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                            #{clip.rank || idx + 1} • {clip.hook_score ?? 95}%
                          </span>
                          <span className="text-xs font-bold truncate">{clip.title}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          {clip.start_time.toFixed(1)}s - {clip.end_time.toFixed(1)}s ({dur.toFixed(1)}s)
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                    </DropdownMenu.Item>
                  );
                })
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Modular Subtitle Dropdown */}
        <SubtitleDropdown
          subtitleConfig={subtitleConfig}
          isRendering={isRendering}
          setSubtitleConfig={setSubtitleConfig}
        />
      </div>

      {/* Right zone: Tools, Settings & Render Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          disabled={!currentMedia || !activeClip?.videoUrl}
          onClick={() => setIsAiTraceOpen(true)}
          leftIcon={<Cpu className="w-3.5 h-3.5 text-cyan-400" />}
          title={
            !currentMedia || !activeClip?.videoUrl
              ? "Load a video and run AI Director first"
              : "Inspect live AI prompt, token cost & raw JSON trace"
          }
        >
          <span className="hidden lg:inline">AI Output / Tokens</span>
          <span className="lg:hidden">Tokens</span>
        </Button>

        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
          icon={<Settings className="w-4 h-4 text-slate-300" />}
          title="Configure API Keys & Studio Settings"
          aria-label="Settings"
        />

        {isRendering ? (
          <Button
            variant="danger"
            size="sm"
            onClick={cancelRenderExport}
            leftIcon={<XCircle className="w-3.5 h-3.5" />}
          >
            Cancel ({renderProgress}%)
          </Button>
        ) : (
          <Button
            variant="accent"
            size="sm"
            disabled={!activeClip?.videoUrl}
            onClick={startRenderExport}
            leftIcon={<Sparkles className="w-3.5 h-3.5 fill-current" />}
          >
            Export MP4
          </Button>
        )}

        {/* Modular Export History Dropdown */}
        <ExportHistoryDropdown
          exportHistory={exportHistory}
          onOpenModal={() => setIsExportModalOpen(true)}
        />
      </div>

      <ExportHistoryModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exportHistory={exportHistory}
        onRemoveItem={removeExportHistoryItem}
        onClearAll={clearExportHistory}
      />

      <AiTraceModal
        isOpen={isAiTraceOpen}
        onClose={() => setIsAiTraceOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  );
};
