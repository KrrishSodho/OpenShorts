import React from 'react';
import {
  Eye,
  EyeOff,
  Wand2,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Pipette,
} from 'lucide-react';
import { ClipEditState, PanKeyframe } from '../../types';
import { Button, IconButton, Input, Slider, Badge, ColorPickerField } from '../ui';

interface FramingAudioTabProps {
  clip: ClipEditState;
  sortedKfs: PanKeyframe[];
  activeShotIdx: number;
  activePan: number;
  currentPlaySec: number;
  isNearExistingCut: boolean;
  isAutoTracking: boolean;
  isRendering: boolean;
  videoVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  masterMuted?: boolean;
  updateActiveClipTitle: (title: string) => void;
  toggleActiveTopHook: (show: boolean) => void;
  updateActiveHookStyle?: (style: {
    hookSize?: 'sm' | 'md' | 'lg';
    hookTextColor?: string | null;
    hookBgColor?: string | null;
  }) => void;
  setActiveShotPan: (pan: number) => void;
  addCutAtPlayhead: () => void;
  deleteActiveCut: () => void;
  toggleActiveShotTransition?: () => void;
  setFramingLayoutMode?: (mode: 'single' | 'split' | 'trio_rotate') => void;
  setSplitPans?: (topPan: number, bottomPan: number) => void;
  swapSplitPans?: () => void;
  setSplitZoom?: (zoom: number) => void;
  setTrioPans?: (primaryPan: number, leftPan: number, rightPan: number) => void;
  autoTrackActiveClipFaces: () => Promise<void>;
  setVideoVolume: (vol: number) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setSfxVolume: (vol: number) => void;
  setMasterMuted?: (muted: boolean) => void;
  onSeekRelative: (sec: number) => void;
}

export const FramingAudioTab: React.FC<FramingAudioTabProps> = ({
  clip,
  sortedKfs,
  activeShotIdx,
  activePan,
  currentPlaySec,
  isNearExistingCut,
  isAutoTracking,
  isRendering,
  videoVolume,
  sfxEnabled,
  sfxVolume,
  masterMuted = false,
  updateActiveClipTitle,
  toggleActiveTopHook,
  updateActiveHookStyle,
  setActiveShotPan,
  addCutAtPlayhead,
  deleteActiveCut,
  toggleActiveShotTransition,
  setFramingLayoutMode,
  setSplitPans,
  swapSplitPans,
  setSplitZoom,
  setTrioPans,
  autoTrackActiveClipFaces,
  setVideoVolume,
  setSfxEnabled,
  setSfxVolume,
  setMasterMuted,
  onSeekRelative,
}) => {
  const currentShot = sortedKfs[activeShotIdx];
  const isCut = currentShot ? currentShot.transition !== 'smooth' : true;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-8 flex flex-col gap-3 text-xs select-none">
      {/* 1. Opening Hook Header */}
      <div className="bg-slate-950/70 border border-studio-border rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Opening Hook (0:00 - 0:02.4)
          </span>
          <Button
            variant="ghost"
            size="xs"
            disabled={isRendering}
            onClick={() => toggleActiveTopHook(!clip.showTopHook)}
            leftIcon={
              clip.showTopHook ? (
                <Eye className="w-3 h-3 text-cyan-400" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-500" />
              )
            }
          >
            {clip.showTopHook ? 'Visible' : 'Hidden'}
          </Button>
        </div>

        <Input
          sizeVariant="sm"
          disabled={isRendering || !clip.showTopHook}
          value={clip.title}
          onChange={(e) => updateActiveClipTitle(e.target.value)}
          placeholder="Punchy viral title hook..."
        />

        {clip.showTopHook && updateActiveHookStyle && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
            {/* Hook Size */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Hook Size
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(['sm', 'md', 'lg'] as const).map((s) => (
                  <Button
                    key={s}
                    variant={(clip.hookSize || 'md') === s ? 'primary' : 'ghost'}
                    size="xs"
                    disabled={isRendering}
                    onClick={() => updateActiveHookStyle({ hookSize: s })}
                    className="h-5 px-2 text-[10px] uppercase font-bold"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Hook Text Color */}
            <ColorPickerField
              label="Hook Text Color"
              value={clip.hookTextColor}
              autoLabel="Default White"
              defaultPlaceholder="#FFFFFF"
              disabled={isRendering}
              onChange={(color) => updateActiveHookStyle({ hookTextColor: color })}
              swatches={[
                { name: 'White', val: '#FFFFFF' },
                { name: 'Ink', val: '#0F172A' },
                { name: 'Gold', val: '#FFE600' },
                { name: 'Cyan', val: '#00F5FF' },
                { name: 'Crimson', val: '#FF2E54' },
              ]}
            />

            {/* Hook Background Color */}
            <ColorPickerField
              label="Pill Backdrop Color"
              value={clip.hookBgColor}
              autoLabel="Dark Glass"
              defaultPlaceholder="#080C16"
              disabled={isRendering}
              onChange={(color) => updateActiveHookStyle({ hookBgColor: color })}
              swatches={[
                { name: 'Dark Glass', val: 'rgba(8, 12, 22, 0.92)' },
                { name: 'Pure Black', val: '#000000' },
                { name: 'Paper Light', val: '#F6F2E9' },
                { name: 'Navy Deep', val: '#0A1630' },
                { name: 'Ruby Dark', val: '#1E0A12' },
              ]}
            />
          </div>
        )}
      </div>

      {/* 2. Framing & Camera Cuts */}
      <div className="bg-slate-950/70 border border-studio-border rounded-xl p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Camera Framing
          </span>
          <Button
            variant="outline"
            size="xs"
            disabled={isRendering || isAutoTracking}
            isLoading={isAutoTracking}
            onClick={autoTrackActiveClipFaces}
            leftIcon={<Wand2 className="w-3 h-3 text-cyan-400" />}
          >
            AI Center Speaker
          </Button>
        </div>

        {/* Layout Mode Selector */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <Button
            variant={clip.framingLayout === 'single' || !clip.framingLayout ? 'primary' : 'ghost'}
            size="xs"
            disabled={isRendering}
            onClick={() => setFramingLayoutMode?.('single')}
          >
            Single
          </Button>
          <Button
            variant={clip.framingLayout === 'split' ? 'primary' : 'ghost'}
            size="xs"
            disabled={isRendering}
            onClick={() => setFramingLayoutMode?.('split')}
          >
            Split (2-Host)
          </Button>
          <Button
            variant={clip.framingLayout === 'trio_rotate' ? 'primary' : 'ghost'}
            size="xs"
            disabled={isRendering}
            onClick={() => setFramingLayoutMode?.('trio_rotate')}
          >
            Trio (3-Way)
          </Button>
        </div>

        {/* Layout Specific Controls */}
        {clip.framingLayout === 'split' ? (
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Split Positions
              </span>
              <Button
                variant="outline"
                size="xs"
                disabled={isRendering}
                onClick={() => swapSplitPans?.()}
                leftIcon={<ArrowUpDown className="w-3 h-3" />}
              >
                Swap
              </Button>
            </div>

            <Slider
              label="Top Speaker Pan"
              value={clip.splitTopPan ?? 22}
              valueDisplay={`${clip.splitTopPan ?? 22}%`}
              disabled={isRendering}
              onChange={(val) => setSplitPans?.(val, clip.splitBottomPan ?? 78)}
            />

            <Slider
              label="Bottom Speaker Pan"
              value={clip.splitBottomPan ?? 78}
              valueDisplay={`${clip.splitBottomPan ?? 78}%`}
              disabled={isRendering}
              onChange={(val) => setSplitPans?.(clip.splitTopPan ?? 22, val)}
            />

            <Slider
              label="Host Crop Zoom"
              min={1.1}
              max={2.4}
              step={0.05}
              value={clip.splitZoom ?? 1.55}
              valueDisplay={`${(clip.splitZoom ?? 1.55).toFixed(2)}x`}
              disabled={isRendering}
              onChange={(val) => setSplitZoom?.(val)}
            />
          </div>
        ) : clip.framingLayout === 'trio_rotate' ? (
          <div className="flex flex-col gap-3 pt-1">
            <Slider
              label="Primary Speaker Pan"
              value={clip.panKeyframes[0]?.pan ?? 50}
              valueDisplay={`${clip.panKeyframes[0]?.pan ?? 50}%`}
              disabled={isRendering}
              onChange={(val) => setActiveShotPan(val)}
            />
            <Slider
              label="Left Host Pan"
              value={clip.trioLeftPan ?? 18}
              valueDisplay={`${clip.trioLeftPan ?? 18}%`}
              disabled={isRendering}
              onChange={(val) =>
                setTrioPans?.(clip.panKeyframes[0]?.pan ?? 50, val, clip.trioRightPan ?? 82)
              }
            />
            <Slider
              label="Right Host Pan"
              value={clip.trioRightPan ?? 82}
              valueDisplay={`${clip.trioRightPan ?? 82}%`}
              disabled={isRendering}
              onChange={(val) =>
                setTrioPans?.(clip.panKeyframes[0]?.pan ?? 50, clip.trioLeftPan ?? 18, val)
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            <Slider
              label={`Active Shot #${activeShotIdx + 1} of ${sortedKfs.length}`}
              value={activePan}
              valueDisplay={`${activePan}%`}
              disabled={isRendering}
              onChange={(val) => setActiveShotPan(val)}
            />

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Transition:</span>
              <Button
                variant="ghost"
                size="xs"
                disabled={isRendering}
                onClick={toggleActiveShotTransition}
                className="font-mono text-cyan-400 h-6 px-1.5"
              >
                {isCut ? 'Hard Cut' : 'Smooth Pan'}
              </Button>
            </div>

            {/* Cut Navigator & Add/Delete */}
            <div className="flex items-center gap-1.5 pt-1">
              <IconButton
                variant="secondary"
                size="xs"
                disabled={activeShotIdx === 0}
                onClick={() => onSeekRelative(sortedKfs[activeShotIdx - 1].t + 0.05)}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
                aria-label="Previous cut"
                title="Previous cut"
              />

              <Button
                variant={isNearExistingCut ? 'ghost' : 'secondary'}
                size="xs"
                disabled={isRendering || isNearExistingCut}
                onClick={addCutAtPlayhead}
                leftIcon={<Plus className="w-3 h-3 text-cyan-400" />}
                className="flex-1 justify-center font-mono"
              >
                {isNearExistingCut ? 'At Cut' : `+ Cut @ ${currentPlaySec.toFixed(1)}s`}
              </Button>

              <IconButton
                variant="danger"
                size="xs"
                disabled={isRendering || sortedKfs.length <= 1}
                onClick={deleteActiveCut}
                icon={<Trash2 className="w-3 h-3" />}
                aria-label="Delete cut"
                title="Delete current cut"
              />

              <IconButton
                variant="secondary"
                size="xs"
                disabled={activeShotIdx >= sortedKfs.length - 1}
                onClick={() => onSeekRelative(sortedKfs[activeShotIdx + 1].t + 0.05)}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                aria-label="Next cut"
                title="Next cut"
              />
            </div>

            {/* Shot Cuts Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {sortedKfs.map((kf, i) => {
                const isSel = i === activeShotIdx;
                return (
                  <Button
                    key={`kf_${i}`}
                    variant={isSel ? 'primary' : 'ghost'}
                    size="xs"
                    onClick={() => onSeekRelative(kf.t + 0.05)}
                    className="font-mono text-[10px] px-1.5 h-6 shrink-0"
                  >
                    #{i + 1} ({kf.t.toFixed(1)}s:{kf.pan}%)
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Audio Levels & Mixing */}
      <div className="bg-slate-950/70 border border-studio-border rounded-xl p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Audio Levels
          </span>
          <Button
            variant={masterMuted ? 'danger' : 'ghost'}
            size="xs"
            onClick={() => setMasterMuted?.(!masterMuted)}
            leftIcon={
              masterMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              )
            }
          >
            {masterMuted ? 'Muted' : 'Active'}
          </Button>
        </div>

        <Slider
          label="Speaker Voice"
          min={0}
          max={150}
          step={5}
          value={Math.round(videoVolume * 100)}
          valueDisplay={`${Math.round(videoVolume * 100)}%`}
          disabled={masterMuted}
          onChange={(val) => setVideoVolume(val / 100)}
        />

        <Slider
          label="Motion FX Volume"
          min={0}
          max={100}
          step={5}
          value={sfxEnabled ? Math.round(sfxVolume * 100) : 0}
          valueDisplay={sfxEnabled ? `${Math.round(sfxVolume * 100)}%` : 'Off'}
          disabled={masterMuted}
          onChange={(val) => {
            if (val === 0) {
              setSfxEnabled(false);
            } else {
              if (!sfxEnabled) setSfxEnabled(true);
              setSfxVolume(val / 100);
            }
          }}
        />
      </div>
    </div>
  );
};
