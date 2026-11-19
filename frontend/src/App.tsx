import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { AlertTriangle, Loader2, X, MoveHorizontal, Sparkles, XCircle } from 'lucide-react';
import { useStudioStore } from './store/useStudioStore';
import { TopCommandBar } from './components/TopCommandBar';
import { LoadVideoModal } from './components/LoadVideoModal';
import { LeftInspector } from './components/LeftInspector';
import { MultiTrackTimeline } from './components/MultiTrackTimeline';
import { MotionDirectorPanel } from './components/MotionDirectorPanel';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { MasterShortComposition } from './remotion/MasterShortComposition';
import { Button, IconButton, EmptyState } from './components/ui';
import { CanvasDragOverlay } from './components/CanvasDragOverlay';
import { fetchJobStatus, fetchRenderStatus } from './api';
import { useStudioHotkeys } from './hooks/useStudioHotkeys';
import { usePlayerSync } from './hooks/usePlayerSync';

export const App: React.FC = () => {
  const playerRef = useRef<PlayerRef>(null);
  const canvasBoxRef = useRef<HTMLDivElement>(null);

  const {
    initBackend,
    pipelineState,
    activeJobId,
    setJobProgressState,
    completeIngestJob,
    failIngestJob,
    activeRenderId,
    isRendering,
    renderProgress,
    renderStep,
    renderEtaSec,
    renderElapsedSec,
    updateRenderProgressState,
    completeRenderExport,
    failRenderExport,
    cancelRenderExport,
    errorMessage,
    setErrorMessage,
    currentMedia,
    activeClipId,
    clipEditsById,
    isPreparingClip,
    isRemixing,
    selectedPreset,
    subtitleConfig,
    fps,
    videoVolume,
    sfxEnabled,
    sfxVolume,
    masterMuted,
    themeAccentOverride,
    currentPlaySec,
    setCurrentPlaySec,
    selectedBeatIdx,
    updateActiveMotionEvents,
    updateActivePanKeyframes,
    updateActiveClipTrim,
    aiRemixActiveClipMotion,
    clearAllMotionEvents,
    setLoadModalOpen,
    isLoadModalOpen,
    undo,
    redo,
  } = useStudioStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const dragStartXRef = useRef(0);
  const startPanRef = useRef(50);
  const consecutiveJobErrorsRef = useRef(0);

  const activeClip = activeClipId ? clipEditsById[activeClipId] : null;
  const clipDuration = activeClip
    ? Math.max(1, activeClip.endTime - activeClip.startTime)
    : 0;
  const totalFrames = Math.max(30, Math.floor((clipDuration || 10) * fps));

  useEffect(() => {
    initBackend();
  }, [initBackend]);

  useEffect(() => {
    if (!activeJobId || pipelineState !== 'PROCESSING') return;
    consecutiveJobErrorsRef.current = 0;

    const poll = async () => {
      try {
        const data = await fetchJobStatus(activeJobId);
        consecutiveJobErrorsRef.current = 0;
        setJobProgressState(data.progress ?? 10, data.step || 'Processing...');
        if (data.status === 'completed' && data.result) {
          completeIngestJob(data.result);
        } else if (data.status === 'failed') {
          failIngestJob(data.error || 'Video processing failed.');
        }
      } catch (err: any) {
        consecutiveJobErrorsRef.current += 1;
        if (consecutiveJobErrorsRef.current >= 15) {
          failIngestJob(err?.message || 'Lost connection to backend.');
        }
      }
    };

    poll();
    const timer = window.setInterval(poll, 1000);
    return () => window.clearInterval(timer);
  }, [activeJobId, pipelineState, setJobProgressState, completeIngestJob, failIngestJob]);

  useEffect(() => {
    if (!activeRenderId || !isRendering) return;

    const pollRender = async () => {
      try {
        const data = await fetchRenderStatus(activeRenderId);
        updateRenderProgressState(
          data.progress ?? 10,
          data.step || 'Rendering MP4...',
          data.eta_sec ?? 5,
          data.elapsed_sec ?? 1
        );
        if (data.status === 'completed' && data.download_url) {
          completeRenderExport(data.download_url, data.filename || 'short.mp4', {
            thumbnailUrl: data.thumbnail_url || null,
            fileSizeBytes: data.file_size_bytes,
            durationSec: data.duration_sec,
          });
        } else if (data.status === 'failed') {
          failRenderExport(data.error || 'MP4 export failed.');
        } else if (data.status === 'cancelled') {
          cancelRenderExport();
        }
      } catch {
        // Keep polling
      }
    };

    const timer = window.setInterval(pollRender, 700);
    return () => window.clearInterval(timer);
  }, [
    activeRenderId,
    isRendering,
    updateRenderProgressState,
    completeRenderExport,
    failRenderExport,
    cancelRenderExport,
  ]);

  // Player synchronization hook
  const { handleSeekRelative, handleTogglePlay, handleRestartAndPlay } = usePlayerSync({
    playerRef,
    activeClip,
    activeClipId,
    fps,
    totalFrames,
    clipDuration,
    currentPlaySec,
    setCurrentPlaySec,
    setIsPlaying,
    isPreparingClip,
    isLoadModalOpen,
    pipelineState,
  });

  // Global Pro-NLE hotkeys hook
  useStudioHotkeys({
    undo,
    redo,
    handleTogglePlay,
    handleSeekRelative,
    handleRestartAndPlay,
    updateActiveClipTrim,
    activeClip,
    currentPlaySec,
    clipDuration,
    fps,
    toggleShortcutsModal: () => setIsShortcutsOpen((o) => !o),
  });

  const rawKfs = activeClip?.panKeyframes;
  const sortedKfs =
    Array.isArray(rawKfs) && rawKfs.length > 0
      ? [...rawKfs].sort((a, b) => a.t - b.t)
      : [{ t: 0, pan: 50 }];
  let activeShotIdx = 0;
  for (let i = 0; i < sortedKfs.length; i++) {
    if (currentPlaySec + 0.035 >= sortedKfs[i].t) activeShotIdx = i;
  }
  const activePan = sortedKfs[activeShotIdx]?.pan ?? 50;

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isRendering || !activeClip?.videoUrl || !canvasBoxRef.current) return;
    setIsDraggingPan(true);
    dragStartXRef.current = e.clientX;
    startPanRef.current = activePan;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPan || isRendering || !canvasBoxRef.current) return;
    const box = canvasBoxRef.current;
    const overflow = box.clientHeight * (16 / 9) - box.clientWidth;
    const deltaX = e.clientX - dragStartXRef.current;
    const deltaPct = -(deltaX / Math.max(60, overflow)) * 100;
    const clamped = Math.round(Math.max(0, Math.min(100, startPanRef.current + deltaPct)));
    const nextKfs = sortedKfs.map((kf, i) =>
      i === activeShotIdx ? { ...kf, pan: clamped } : kf
    );
    updateActivePanKeyframes(nextKfs);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingPan) {
      setIsDraggingPan(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const rawMotionEvents = activeClip?.motionEvents;
  const activeBeat =
    Array.isArray(rawMotionEvents) &&
    selectedBeatIdx >= 0 &&
    selectedBeatIdx < rawMotionEvents.length
      ? rawMotionEvents[selectedBeatIdx]
      : null;

  const handleUpdateBeatPos = (
    beatIdx: number,
    pos: { custom_x?: number | null; custom_y?: number | null }
  ) => {
    if (!Array.isArray(activeClip?.motionEvents) || beatIdx < 0 || beatIdx >= activeClip.motionEvents.length) return;
    const nextEvents = activeClip.motionEvents.map((evt, idx) =>
      idx === beatIdx ? { ...evt, ...pos } : evt
    );
    updateActiveMotionEvents(nextEvents);
  };

  const memoizedInputProps = useMemo(() => {
    if (!activeClip || !selectedPreset) return null;
    return {
      videoUrl: activeClip.videoUrl,
      words: activeClip.words,
      preset: selectedPreset,
      subtitleConfig,
      title: activeClip.title,
      showTopHook: activeClip.showTopHook,
      hookSize: activeClip.hookSize || 'md',
      hookTextColor: activeClip.hookTextColor || null,
      hookBgColor: activeClip.hookBgColor || null,
      panPercent: activeClip.panKeyframes[0]?.pan ?? 50,
      panKeyframes: activeClip.panKeyframes,
      motionEvents: activeClip.motionEvents,
      videoVolume: masterMuted ? 0 : videoVolume,
      sfxEnabled: masterMuted ? false : sfxEnabled,
      sfxVolume: masterMuted ? 0 : sfxVolume,
      framingLayout: activeClip.framingLayout || 'single',
      splitTopPan: activeClip.splitTopPan ?? 22,
      splitBottomPan: activeClip.splitBottomPan ?? 78,
      splitZoom: activeClip.splitZoom ?? 1.55,
      trioLeftPan: activeClip.trioLeftPan ?? 18,
      trioRightPan: activeClip.trioRightPan ?? 82,
      cleanSpeakerMode: activeClip.cleanSpeakerMode ?? false,
      themeAccentOverride,
    };
  }, [
    activeClip?.videoUrl,
    activeClip?.words,
    selectedPreset,
    subtitleConfig,
    activeClip?.title,
    activeClip?.showTopHook,
    activeClip?.hookSize,
    activeClip?.hookTextColor,
    activeClip?.hookBgColor,
    activeClip?.panKeyframes,
    activeClip?.motionEvents,
    masterMuted,
    videoVolume,
    sfxEnabled,
    sfxVolume,
    activeClip?.framingLayout,
    activeClip?.splitTopPan,
    activeClip?.splitBottomPan,
    activeClip?.splitZoom,
    activeClip?.trioLeftPan,
    activeClip?.trioRightPan,
    activeClip?.cleanSpeakerMode,
    themeAccentOverride,
  ]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-studio-dark text-slate-100 flex flex-col">
      <TopCommandBar />
      <LoadVideoModal />
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {errorMessage && (
        <div className="bg-rose-950/95 border-b border-rose-500/80 px-4 py-1.5 flex items-center justify-between text-xs text-rose-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => setErrorMessage(null)}
            icon={<X className="w-3.5 h-3.5" />}
            aria-label="Dismiss error banner"
          />
        </div>
      )}

      {isRendering && (
        <div className="bg-cyan-950/70 border-b border-cyan-500/40 px-4 py-1.5 flex items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2 text-cyan-200 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>{renderStep} (Editing locked while rendering)</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="text-slate-300">Elapsed: {renderElapsedSec}s</span>
            <span className="text-amber-300">ETA: ~{renderEtaSec}s</span>
            <span className="font-bold text-cyan-400">{renderProgress}%</span>
            <Button
              variant="danger"
              size="xs"
              onClick={cancelRenderExport}
              leftIcon={<XCircle className="w-3 h-3" />}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0 grid grid-cols-12 gap-3.5 p-3.5 overflow-hidden">
        <div className="col-span-3 min-w-0 h-full overflow-hidden">
          <LeftInspector onSeekRelative={handleSeekRelative} />
        </div>

        <div className="col-span-5 min-w-0 h-full flex flex-col items-center justify-between gap-3 bg-studio-panel/90 border border-studio-border rounded-2xl p-3.5 overflow-hidden shadow-xl">
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <div
              ref={canvasBoxRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              className={`group relative aspect-[9/16] h-full max-h-full rounded-2xl overflow-hidden border-2 bg-black shadow-2xl select-none ${
                isRendering
                  ? 'border-cyan-500/40 cursor-not-allowed'
                  : isDraggingPan
                  ? 'border-cyan-400 cursor-grabbing'
                  : 'border-studio-border cursor-grab'
              }`}
            >
              {selectedPreset && activeClip?.videoUrl && memoizedInputProps ? (
                <>
                  <Player
                    key={activeClip.clipId}
                    ref={playerRef}
                    component={MasterShortComposition as any}
                    inputProps={memoizedInputProps}
                    durationInFrames={totalFrames}
                    compositionWidth={1080}
                    compositionHeight={1920}
                    fps={fps}
                    style={{ width: '100%', height: '100%' }}
                    controls={false}
                    clickToPlay={false}
                    autoPlay={false}
                    loop
                    errorFallback={({ error }) => (
                      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 select-none">
                        <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                        <h3 className="text-base font-bold text-white mb-1">Canvas Render Warning</h3>
                        <p className="text-xs text-slate-400 max-w-xs mb-4">
                          {error?.message || 'Error encountered while rendering preview frames.'}
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg border border-slate-700 font-medium transition-colors"
                        >
                          Refresh Canvas
                        </button>
                      </div>
                    )}
                  />
                  <CanvasDragOverlay
                    activeBeat={activeBeat}
                    activeBeatIndex={selectedBeatIdx}
                    currentPlaySec={currentPlaySec}
                    isRendering={isRendering}
                    isPlaying={isPlaying}
                    onUpdateBeatPos={handleUpdateBeatPos}
                  />
                </>
              ) : (
                <EmptyState
                  icon={<Sparkles className="w-6 h-6" />}
                  title="No Video Loaded"
                  description="Load a video file or paste a YouTube URL to edit viral shorts."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setLoadModalOpen(true)}
                    >
                      + Load Video
                    </Button>
                  }
                />
              )}

              {isPreparingClip && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-50 select-none">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                  <span className="text-sm font-headline font-bold text-white tracking-wide">
                    Switching Short...
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300/80">
                    Trimming speaker audio & tracking camera cuts
                  </span>
                </div>
              )}

              {isDraggingPan && (
                <div className="absolute top-3 right-3 bg-black/85 border border-cyan-400/50 px-2.5 py-1 rounded-lg text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 z-50 pointer-events-none">
                  <MoveHorizontal className="w-3.5 h-3.5" />
                  <span>Shot #{activeShotIdx + 1}: {activePan}%</span>
                </div>
              )}
            </div>
          </div>

          <MultiTrackTimeline
            durationSec={clipDuration}
            currentPlaySec={currentPlaySec}
            fps={fps}
            isPlaying={isPlaying}
            panKeyframes={sortedKfs}
            motionEvents={activeClip?.motionEvents || []}
            words={activeClip?.words || []}
            trimStart={activeClip?.trimStart ?? 0}
            trimEnd={activeClip?.trimEnd ?? clipDuration}
            onTogglePlay={handleTogglePlay}
            onSeekRelative={handleSeekRelative}
            onRestartAndPlay={handleRestartAndPlay}
            onTrimChange={updateActiveClipTrim}
          />
        </div>

        <div className="col-span-4 min-w-0 h-full overflow-hidden">
          <MotionDirectorPanel
            motionEvents={activeClip?.motionEvents || []}
            clipWords={activeClip?.words || []}
            sfxVolume={sfxVolume}
            onChangeMotionEvents={updateActiveMotionEvents}
            currentPlaySec={currentPlaySec}
            clipDuration={clipDuration}
            onSeekRelative={handleSeekRelative}
            onAIRemix={aiRemixActiveClipMotion}
            onClearAll={clearAllMotionEvents}
            isRemixing={isRemixing}
            isLocked={isRendering}
            hasMedia={Boolean(currentMedia && activeClip)}
          />
        </div>
      </main>
    </div>
  );
};
