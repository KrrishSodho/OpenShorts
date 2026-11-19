import React, { useEffect } from 'react';
import {
  Wand2,
  Plus,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  MotionEvent,
  TranscriptWord,
} from '../types';
import { useStudioStore } from '../store/useStudioStore';
import { Panel, PanelHeader, Button, Badge } from './ui';
import { BeatPillTrack } from './motion-director/BeatPillTrack';
import { BeatCardEditor } from './motion-director/BeatCardEditor';

interface MotionDirectorPanelProps {
  motionEvents: MotionEvent[];
  clipWords: TranscriptWord[];
  sfxVolume: number;
  onChangeMotionEvents: (events: MotionEvent[]) => void;
  currentPlaySec: number;
  clipDuration: number;
  onSeekRelative: (seconds: number) => void;
  onAIRemix: () => void;
  onClearAll?: () => void;
  isRemixing: boolean;
  isLocked: boolean;
  hasMedia: boolean;
}

export const MotionDirectorPanel: React.FC<MotionDirectorPanelProps> = ({
  motionEvents,
  clipWords,
  sfxVolume,
  onChangeMotionEvents,
  currentPlaySec,
  clipDuration,
  onSeekRelative,
  onAIRemix,
  onClearAll,
  isRemixing,
  isLocked,
  hasMedia,
}) => {
  const { selectedBeatIdx, setSelectedBeatIdx } = useStudioStore();

  // Auto-sync selected beat with the beat currently rendering on screen
  useEffect(() => {
    if (motionEvents.length === 0) return;
    const activeScreenIdx = motionEvents.findIndex(
      (ev) =>
        currentPlaySec >= ev.time_sec - 0.05 &&
        currentPlaySec <= ev.time_sec + (ev.duration_sec || 2.4)
    );
    if (activeScreenIdx !== -1 && activeScreenIdx !== selectedBeatIdx) {
      setSelectedBeatIdx(activeScreenIdx);
    }
  }, [currentPlaySec, motionEvents, selectedBeatIdx, setSelectedBeatIdx]);

  const safeIdx =
    motionEvents.length === 0 ? -1 : Math.min(selectedBeatIdx, motionEvents.length - 1);
  const activeBeat = safeIdx >= 0 ? motionEvents[safeIdx] : null;

  const updateBeat = (idx: number, patch: Partial<MotionEvent>) => {
    if (isLocked) return;
    const next = motionEvents.map((ev, i) => (i === idx ? { ...ev, ...patch } : ev));
    next.sort((a, b) => a.time_sec - b.time_sec);
    onChangeMotionEvents(next);
  };

  const handleAddBeatAtPlayhead = () => {
    if (isLocked) return;
    const t =
      Math.round(
        Math.max(0, Math.min(currentPlaySec, Math.max(1, clipDuration - 2))) * 10
      ) / 10;

    const spokenWindow = clipWords.filter(
      (w) => w.start >= t - 0.3 && w.start <= t + 3.2
    );
    const snippetWords = spokenWindow
      .map((w) =>
        w.word
          .replace(/[^a-zA-Z0-9\u00C0-\u024F\u0600-\u06FF\u0900-\u097F']/g, '')
          .trim()
      )
      .filter(Boolean);

    const strong = snippetWords.filter((w) => w.length >= 4);
    const primaryWord = (strong[0] || snippetWords[0] || 'KEY POINT').toUpperCase();
    const headlineText =
      snippetWords.slice(0, 5).join(' ').toUpperCase() || 'KEY SPOKEN MOMENT';
    const derivedKeywords =
      strong.slice(0, 3).map((w) => w.toUpperCase()).length > 0
        ? strong.slice(0, 3).map((w) => w.toUpperCase())
        : [primaryWord];

    const newBeat: MotionEvent = {
      time_sec: t,
      duration_sec: 2.4,
      type: 'word_hit',
      zone: 'center_spotlight',
      transition: 'spring_slam',
      label: 'MOTION CARD',
      text: primaryWord,
      subtext: headlineText !== primaryWord ? headlineText : '',
      value: primaryWord,
      keywords: derivedKeywords,
      sfx_type: 'whoosh',
    };

    const next = [...motionEvents, newBeat].sort((a, b) => a.time_sec - b.time_sec);
    const newIdx = next.findIndex((b) => b.time_sec === t);
    onChangeMotionEvents(next);
    if (newIdx >= 0) setSelectedBeatIdx(newIdx);
  };

  const handleDeleteBeat = (idx: number) => {
    if (isLocked) return;
    const next = motionEvents.filter((_, i) => i !== idx);
    onChangeMotionEvents(next);
    setSelectedBeatIdx(Math.max(0, idx - 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBeatIdx >= 0 && selectedBeatIdx < motionEvents.length) {
          e.preventDefault();
          handleDeleteBeat(selectedBeatIdx);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBeatIdx, motionEvents, isLocked]);

  const headerActions = (
    <>
      {motionEvents.length > 0 && onClearAll && (
        <Button
          variant="ghost"
          size="xs"
          disabled={!hasMedia || isLocked}
          onClick={onClearAll}
          leftIcon={<Trash2 className="w-3 h-3 text-red-400" />}
          className="text-red-400 hover:text-red-300"
        >
          Clear
        </Button>
      )}

      <Button
        variant="ghost"
        size="xs"
        disabled={!hasMedia || isRemixing || isLocked}
        isLoading={isRemixing}
        onClick={onAIRemix}
        leftIcon={<Wand2 className="w-3 h-3 text-purple-400" />}
        title="This makes 1 AI request"
      >
        Plan Short with AI
      </Button>

      <Button
        variant="primary"
        size="xs"
        disabled={!hasMedia || isLocked}
        onClick={handleAddBeatAtPlayhead}
        leftIcon={<Plus className="w-3 h-3" />}
      >
        Add
      </Button>
    </>
  );

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Motion Studio"
        icon={<Layers className="w-4 h-4 text-cyan-400" />}
        badge={<Badge variant="cyan" size="xs">{motionEvents.length}</Badge>}
        actions={headerActions}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 pb-8 flex flex-col gap-3">
        {motionEvents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-5 bg-slate-950/40 rounded-xl border border-dashed border-studio-border gap-3 my-auto">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shadow-md shadow-purple-500/10">
              <Wand2 className="w-5 h-5 text-purple-300" />
            </div>
            <div className="flex flex-col gap-1 max-w-[280px]">
              <span className="font-headline font-bold text-xs text-white">
                Procedural Motion Studio
              </span>
              <span className="text-[11px] text-slate-400 leading-relaxed">
                Video is in clean speaker mode. Generate spoken-word synchronized kinetic cards, contrast splits, verified metrics, and sound effects on demand.
              </span>
            </div>

            <Button
              variant="accent"
              size="md"
              disabled={!hasMedia || isRemixing || isLocked}
              isLoading={isRemixing}
              onClick={onAIRemix}
              leftIcon={<Sparkles className="w-3.5 h-3.5 fill-current" />}
              className="w-full max-w-[280px]"
              title="This makes 1 AI request"
            >
              Plan Short with AI (1 AI request)
            </Button>
          </div>
        ) : (
          <>
            <BeatPillTrack
              motionEvents={motionEvents}
              safeIdx={safeIdx}
              onSelectBeat={(idx) => {
                setSelectedBeatIdx(idx);
                onSeekRelative(motionEvents[idx].time_sec + 0.25);
              }}
            />

            {activeBeat && (
              <BeatCardEditor
                activeBeat={activeBeat}
                safeIdx={safeIdx}
                clipDuration={clipDuration}
                clipWords={clipWords}
                sfxVolume={sfxVolume}
                isLocked={isLocked}
                updateBeat={updateBeat}
                handleDeleteBeat={handleDeleteBeat}
                onSeekRelative={onSeekRelative}
              />
            )}
          </>
        )}
      </div>
    </Panel>
  );
};
