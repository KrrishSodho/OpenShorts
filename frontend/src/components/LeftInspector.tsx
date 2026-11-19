import React, { useState } from 'react';
import { Crosshair, Mic, FileEdit, Palette } from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import { PanKeyframe } from '../types';
import { Panel, Tabs, TabItem } from './ui';
import { FramingAudioTab } from './inspector/FramingAudioTab';
import { TranscriptTab } from './inspector/TranscriptTab';
import { ThemePresetsTab } from './inspector/ThemePresetsTab';

interface Props {
  onSeekRelative: (seconds: number) => void;
}

const INSPECTOR_TABS: TabItem[] = [
  { id: 'controls', label: 'Framing', icon: <Mic className="w-3.5 h-3.5" /> },
  { id: 'theme', label: 'Theme', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'transcript', label: 'Transcript', icon: <FileEdit className="w-3.5 h-3.5" /> },
];

export const LeftInspector: React.FC<Props> = ({ onSeekRelative }) => {
  const {
    activeClipId,
    clipEditsById,
    currentPlaySec,
    isAutoTracking,
    isRendering,
    videoVolume,
    sfxEnabled,
    sfxVolume,
    masterMuted,
    presets,
    selectedPreset,
    themeAccentOverride,
    updateActiveClipTitle,
    toggleActiveTopHook,
    updateActiveHookStyle,
    updateActivePanKeyframes,
    updateClipWordText,
    autoTrackActiveClipFaces,
    setFramingLayoutMode,
    setSplitPans,
    swapSplitPans,
    setSplitZoom,
    setTrioPans,
    setCleanSpeakerMode,
    setSelectedPreset,
    setThemeAccentOverride,
    setVideoVolume,
    setSfxEnabled,
    setSfxVolume,
    setMasterMuted,
  } = useStudioStore();

  const [tab, setTab] = useState<'controls' | 'theme' | 'transcript'>('controls');

  const clip = activeClipId ? clipEditsById[activeClipId] : null;

  if (!clip) {
    return (
      <Panel className="p-5 flex flex-col items-center justify-center text-center text-slate-500 gap-2">
        <Crosshair className="w-7 h-7 text-slate-600" />
        <span className="text-xs font-semibold text-slate-300">Inspector Ready</span>
        <span className="text-[11px] text-slate-500 max-w-xs">
          Load a video to edit Hook, Framing, Audio, and Transcript words.
        </span>
      </Panel>
    );
  }

  const sortedKfs =
    clip.panKeyframes.length > 0
      ? [...clip.panKeyframes].sort((a, b) => a.t - b.t)
      : [{ t: 0, pan: 50 }];

  let activeShotIdx = 0;
  for (let i = 0; i < sortedKfs.length; i++) {
    if (currentPlaySec + 0.035 >= sortedKfs[i].t) {
      activeShotIdx = i;
    }
  }
  const activePan = sortedKfs[activeShotIdx]?.pan ?? 50;

  const setActiveShotPan = (pan: number) => {
    if (isRendering) return;
    const clamped = Math.round(Math.max(0, Math.min(100, pan)));
    const next = sortedKfs.map((kf, idx) =>
      idx === activeShotIdx ? { ...kf, pan: clamped } : kf
    );
    updateActivePanKeyframes(next);
  };

  const isNearExistingCut = sortedKfs.some(
    (kf) => Math.abs(kf.t - currentPlaySec) < 0.2
  );

  const addCutAtPlayhead = () => {
    if (isRendering || isNearExistingCut) return;
    const t = Math.round(currentPlaySec * 10) / 10;
    const next = [...sortedKfs, { t, pan: activePan }].sort((a, b) => a.t - b.t);
    updateActivePanKeyframes(next);
  };

  const deleteActiveCut = () => {
    if (isRendering || sortedKfs.length <= 1 || activeShotIdx === 0) return;
    updateActivePanKeyframes(sortedKfs.filter((_, i) => i !== activeShotIdx));
  };

  const toggleActiveShotTransition = () => {
    if (isRendering) return;
    const current = sortedKfs[activeShotIdx]?.transition || 'cut';
    const nextTransition: 'cut' | 'smooth' = current === 'cut' ? 'smooth' : 'cut';
    const next: PanKeyframe[] = sortedKfs.map((kf, idx) =>
      idx === activeShotIdx ? { ...kf, transition: nextTransition } : kf
    );
    updateActivePanKeyframes(next);
  };

  return (
    <Panel className="p-3.5 flex flex-col gap-3 min-w-0 w-full">
      {/* Standardized Tab Switcher */}
      <Tabs
        tabs={INSPECTOR_TABS}
        activeTab={tab}
        onChange={(id) => setTab(id as any)}
        size="sm"
      />

      <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden">
        {tab === 'controls' ? (
          <FramingAudioTab
            clip={clip}
            sortedKfs={sortedKfs}
            activeShotIdx={activeShotIdx}
            activePan={activePan}
            currentPlaySec={currentPlaySec}
            isNearExistingCut={isNearExistingCut}
            isAutoTracking={isAutoTracking}
            isRendering={isRendering}
            videoVolume={videoVolume}
            sfxEnabled={sfxEnabled}
            sfxVolume={sfxVolume}
            masterMuted={masterMuted}
            setMasterMuted={setMasterMuted}
            updateActiveClipTitle={updateActiveClipTitle}
            toggleActiveTopHook={toggleActiveTopHook}
            updateActiveHookStyle={updateActiveHookStyle}
            setActiveShotPan={setActiveShotPan}
            addCutAtPlayhead={addCutAtPlayhead}
            deleteActiveCut={deleteActiveCut}
            toggleActiveShotTransition={toggleActiveShotTransition}
            autoTrackActiveClipFaces={autoTrackActiveClipFaces}
            setFramingLayoutMode={setFramingLayoutMode}
            setSplitPans={setSplitPans}
            swapSplitPans={swapSplitPans}
            setSplitZoom={setSplitZoom}
            setTrioPans={setTrioPans}
            setVideoVolume={setVideoVolume}
            setSfxEnabled={setSfxEnabled}
            setSfxVolume={setSfxVolume}
            onSeekRelative={onSeekRelative}
          />
        ) : tab === 'theme' ? (
          <ThemePresetsTab
            clip={clip}
            presets={presets}
            selectedPreset={selectedPreset}
            themeAccentOverride={themeAccentOverride}
            isRendering={isRendering}
            setSelectedPreset={setSelectedPreset}
            setThemeAccentOverride={setThemeAccentOverride}
            setCleanSpeakerMode={setCleanSpeakerMode}
          />
        ) : (
          <TranscriptTab
            clip={clip}
            currentPlaySec={currentPlaySec}
            isRendering={isRendering}
            updateClipWordText={updateClipWordText}
            onSeekRelative={onSeekRelative}
          />
        )}
      </div>
    </Panel>
  );
};
