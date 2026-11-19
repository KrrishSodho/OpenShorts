import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Video,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { KineticCaptions } from './layers/KineticCaptions';
import { DynamicStageRenderer } from './layers/DynamicStageRenderer';
import { SpeakerFramingLayer } from './layers/SpeakerFramingLayer';
import { BrollLayer } from './layers/BrollLayer';
import { SfxAudioSequencer } from './layers/SfxAudioSequencer';
import { resolveDynamicTheme } from './themeEngine';
import { compileDynamicSceneGraph } from './sceneCompiler';
import {
  PresetConfig,
  TranscriptWord,
  MotionEvent,
  PanKeyframe,
  SubtitleConfig,
} from '../types';

export interface MasterShortCompositionProps {
  videoUrl: string;
  words: TranscriptWord[];
  preset: PresetConfig;
  subtitleConfig?: SubtitleConfig;
  title: string;
  showTopHook?: boolean;
  hookSize?: 'sm' | 'md' | 'lg';
  hookTextColor?: string | null;
  hookBgColor?: string | null;
  panPercent?: number;
  panKeyframes?: PanKeyframe[];
  motionEvents?: MotionEvent[];
  videoVolume?: number;
  sfxEnabled?: boolean;
  sfxVolume?: number;
  storageBaseUrl?: string;
  isExport?: boolean;
  framingLayout?: 'single' | 'split' | 'trio_rotate';
  splitTopPan?: number;
  splitBottomPan?: number;
  splitZoom?: number;
  trioLeftPan?: number;
  trioRightPan?: number;
  cleanSpeakerMode?: boolean;
  themeAccentOverride?: string | null;
}

const DEFAULT_SUBTITLE_CFG: SubtitleConfig = {
  style: 'tape_crimson',
  fontSize: 'md',
  position: 'bottom',
  maxWordsPerPhrase: 3,
  uppercase: true,
  highlightColor: 'yellow',
};

export const MasterShortComposition: React.FC<MasterShortCompositionProps> = ({
  videoUrl,
  words,
  preset,
  subtitleConfig = DEFAULT_SUBTITLE_CFG,
  title,
  showTopHook = true,
  hookSize = 'md',
  hookTextColor = null,
  hookBgColor = null,
  panPercent = 50,
  panKeyframes,
  motionEvents = [],
  videoVolume = 1.0,
  sfxEnabled = true,
  sfxVolume = 0.25,
  storageBaseUrl = '',
  isExport = false,
  framingLayout = 'single',
  splitTopPan = 22,
  splitBottomPan = 78,
  splitZoom = 1.55,
  trioLeftPan = 18,
  trioRightPan = 82,
  cleanSpeakerMode = false,
  themeAccentOverride = null,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentTime = frame / fps;
  const totalDurationSec = durationInFrames / fps;

  const VideoEngine = isExport ? OffthreadVideo : Video;

  const resolveUrl = (pathOrUrl: string | null | undefined): string => {
    if (!pathOrUrl) return '';
    if (pathOrUrl.startsWith('/storage/') && storageBaseUrl) {
      return `${storageBaseUrl}${pathOrUrl}`;
    }
    return pathOrUrl;
  };

  const resolvedPan = useMemo(() => {
    if (!panKeyframes || panKeyframes.length === 0) {
      return panPercent ?? 50;
    }
    const sorted = [...panKeyframes].sort((a, b) => a.t - b.t);
    if (sorted.length === 1) return sorted[0].pan;

    let activeIdx = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (currentTime >= sorted[i].t) {
        activeIdx = i;
      } else {
        break;
      }
    }

    const currentKf = sorted[activeIdx];
    const nextKf = sorted[activeIdx + 1];
    if (!nextKf) return currentKf.pan;

    const isSmooth = nextKf.transition === 'smooth' || currentKf.transition === 'smooth';
    if (!isSmooth) return currentKf.pan;

    const timeDelta = nextKf.t - currentKf.t;
    const easeDuration = Math.min(0.45, Math.max(0.15, timeDelta * 0.4));
    const easeStart = nextKf.t - easeDuration;
    if (currentTime < easeStart) return currentKf.pan;

    const progress = Math.min(1, Math.max(0, (currentTime - easeStart) / easeDuration));
    const eased = progress * progress * (3 - 2 * progress);
    return Math.round(currentKf.pan + (nextKf.pan - currentKf.pan) * eased);
  }, [panKeyframes, panPercent, currentTime]);

  const sceneGraph = useMemo(
    () =>
      compileDynamicSceneGraph(
        words,
        motionEvents,
        showTopHook ? title : '',
        totalDurationSec
      ),
    [words, motionEvents, title, showTopHook, totalDurationSec]
  );

  const theme = useMemo(
    () => resolveDynamicTheme(preset, themeAccentOverride || null),
    [preset, themeAccentOverride]
  );
  const safeVideoUrl = resolveUrl(videoUrl);
  const safeMediaVolume = isExport ? videoVolume : Math.min(1.0, videoVolume);

  if (!safeVideoUrl) {
    return (
      <AbsoluteFill className="bg-[#090D16] flex flex-col items-center justify-center text-slate-400 gap-6 select-none p-12">
        <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 font-mono text-2xl font-black shadow-2xl">
          9:16
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-3xl font-headline font-black tracking-wider text-white uppercase">
            Viral Studio Pro v4.2
          </span>
          <span className="text-lg text-slate-400 font-mono">
            Load a video to preview & edit shorts
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  const activeScene = sceneGraph.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  const sceneFrame = activeScene
    ? Math.max(0, Math.round((currentTime - activeScene.start) * fps))
    : 0;
  const sceneTotalFrames = activeScene
    ? Math.max(20, Math.round((activeScene.end - activeScene.start) * fps))
    : 60;

  const enterSpring = activeScene
    ? spring({
        frame: sceneFrame,
        fps,
        config: { damping: 15, stiffness: 180, mass: 0.7 },
      })
    : 0;

  const secondarySpring = activeScene
    ? spring({
        frame: Math.max(0, sceneFrame - 6),
        fps,
        config: { damping: 15, stiffness: 165, mass: 0.75 },
      })
    : 0;

  const exitCurtain = activeScene
    ? interpolate(
        sceneFrame,
        [sceneTotalFrames - 8, sceneTotalFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  const morphProgress = Math.min(1, enterSpring) * exitCurtain;

  const zone = activeScene?.zone || 'center_spotlight';
  const isBrollFull = activeScene?.type === 'broll_full' && Boolean(activeScene.brollUrl);
  const isBrollSplit = activeScene?.type === 'broll_split' && Boolean(activeScene.brollUrl);

  const isTopStage = !cleanSpeakerMode && Boolean(activeScene) && !isBrollFull && zone === 'top_stage';
  const isBottomStage = !cleanSpeakerMode && Boolean(activeScene) && !isBrollFull && zone === 'bottom_stage';
  const isFullTakeover = !cleanSpeakerMode && Boolean(activeScene) && !isBrollFull && zone === 'full_takeover';
  const isCenterSpotlight = !cleanSpeakerMode && Boolean(activeScene) && !isBrollFull && zone === 'center_spotlight';
  const isFloatingOverlay = !cleanSpeakerMode && Boolean(activeScene) && !isBrollFull && zone === 'floating_overlay';

  const isMultiSpeakerLayout = framingLayout === 'split' || framingLayout === 'trio_rotate';

  const animatedTopPct = !isMultiSpeakerLayout && isTopStage
    ? interpolate(morphProgress, [0, 1], [0, 42])
    : 0;

  const animatedHeightPct = !isMultiSpeakerLayout && isTopStage
    ? interpolate(morphProgress, [0, 1], [100, 58])
    : !isMultiSpeakerLayout && isBottomStage
    ? interpolate(morphProgress, [0, 1], [100, 46])
    : 100;

  const verticalHeadFocusPct = isTopStage
    ? interpolate(morphProgress, [0, 1], [42, 24])
    : isBottomStage
    ? interpolate(morphProgress, [0, 1], [42, 36])
    : 42;

  const breathingCycle = Math.sin(Math.PI * ((currentTime % 9.0) / 9.0));
  const punchZoom = activeScene?.zoom && morphProgress > 0.05
    ? interpolate(morphProgress, [0, 1], [1.0, 1.12], { extrapolateRight: 'clamp' })
    : 1.0;
  const subtleCameraZoom =
    (isTopStage || isBottomStage ? 1.0 : 1.0 + 0.045 * breathingCycle) * punchZoom;

  const blurPx = isCenterSpotlight ? interpolate(morphProgress, [0, 1], [0, 5.5]) : 0;
  const brightnessVal = isCenterSpotlight ? interpolate(morphProgress, [0, 1], [1, 0.38]) : 1;
  const useBw = activeScene?.bwFilter && morphProgress > 0.2;

  const presetId = (preset?.id || '').toLowerCase();
  let lookFilter = '';
  if (presetId.includes('cyber')) lookFilter = 'contrast(112%) saturate(120%) ';
  else if (presetId.includes('opus')) lookFilter = 'sepia(12%) contrast(106%) saturate(95%) ';
  else if (presetId.includes('fable')) lookFilter = 'contrast(108%) saturate(115%) ';
  else if (presetId.includes('vox')) lookFilter = 'contrast(114%) saturate(110%) ';
  else if (presetId.includes('minimal')) lookFilter = 'contrast(104%) saturate(102%) ';

  const computedVideoFilter = `${useBw ? 'grayscale(100%) contrast(125%) ' : lookFilter}brightness(${brightnessVal.toFixed(2)}) blur(${blurPx.toFixed(1)}px)`;

  const hookDurationLimit = Math.min(2.4, totalDurationSec);
  const isHookActive =
    !cleanSpeakerMode &&
    Boolean(showTopHook) &&
    Boolean(title) &&
    currentTime <= hookDurationLimit &&
    !isFullTakeover;
  const hookFadeOpacity =
    currentTime <= hookDurationLimit - 0.3
      ? 1
      : Math.max(0, (hookDurationLimit - currentTime) / 0.3);
  const topStageOffset = isHookActive ? 210 : 96;

  const stageOverlayStyle: React.CSSProperties = isFullTakeover
    ? { top: 0, height: '100%' }
    : isTopStage
    ? { top: `${topStageOffset}px`, height: isHookActive ? '36%' : '42%' }
    : isBottomStage
    ? { top: '46%', height: '36%' }
    : isFloatingOverlay
    ? { top: '9%', height: '24%' }
    : { top: '18%', height: '46%' };

  const baseSubTop =
    subtitleConfig.position === 'top'
      ? '12%'
      : subtitleConfig.position === 'middle'
      ? '45%'
      : '76%';

  const captionTopPct = isBottomStage
    ? '86%'
    : isFullTakeover
    ? '82%'
    : isCenterSpotlight && subtitleConfig.position === 'middle'
    ? '76%'
    : baseSubTop;

  const progressPercent = Math.min(100, (frame / Math.max(1, durationInFrames)) * 100);

  const brollScenes = sceneGraph.filter(
    (s) => (s.type === 'broll_full' || s.type === 'broll_split') && Boolean(s.brollUrl)
  );
  const brollLoopFrames = Math.max(60, Math.round(5.0 * fps));

  return (
    <AbsoluteFill
      className="overflow-hidden select-none bg-black"
      style={{
        backgroundColor: theme.stageBg,
        backgroundImage: theme.gridPattern,
        backgroundSize: theme.gridSize,
      }}
    >
      {/* 1. SFX Audio Layer */}
      <SfxAudioSequencer
        sfxEnabled={sfxEnabled}
        sfxVolume={sfxVolume}
        cleanSpeakerMode={cleanSpeakerMode}
        sceneGraph={sceneGraph}
        fps={fps}
        durationInFrames={durationInFrames}
        resolveUrl={resolveUrl}
      />

      {/* 2. Speaker Video Framing Layer (Single / Split / Trio) */}
      <SpeakerFramingLayer
        framingLayout={framingLayout}
        safeVideoUrl={safeVideoUrl}
        safeMediaVolume={safeMediaVolume}
        computedVideoFilter={computedVideoFilter}
        splitTopPan={splitTopPan}
        splitBottomPan={splitBottomPan}
        splitZoom={splitZoom}
        trioLeftPan={trioLeftPan}
        trioRightPan={trioRightPan}
        animatedTopPct={animatedTopPct}
        animatedHeightPct={animatedHeightPct}
        subtleCameraZoom={subtleCameraZoom}
        resolvedPan={resolvedPan}
        verticalHeadFocusPct={verticalHeadFocusPct}
        isTopStage={isTopStage}
        isBottomStage={isBottomStage}
        morphProgress={morphProgress}
        theme={theme}
        VideoEngine={VideoEngine}
      />

      {/* 3. Universal Floating Opening Hook Header */}
      {isHookActive && (
        <div
          className="absolute inset-x-6 z-30 flex justify-center pointer-events-none select-none transition-opacity"
          style={{
            top: hookSize === 'sm' ? 80 : hookSize === 'lg' ? 120 : 100,
            opacity: hookFadeOpacity,
          }}
        >
          <div
            style={{
              backgroundColor: hookBgColor || 'rgba(8, 12, 22, 0.92)',
              borderColor: theme.accentPrimary || '#00F5FF',
              borderWidth: hookSize === 'lg' ? 3.5 : 2.5,
              borderRadius: hookSize === 'sm' ? 22 : hookSize === 'lg' ? 38 : 30,
              padding: hookSize === 'sm' ? '16px 36px' : hookSize === 'lg' ? '30px 68px' : '22px 52px',
              backdropFilter: 'blur(16px)',
              boxShadow: `0 16px 48px rgba(0,0,0,0.85), 0 0 35px ${(theme.accentPrimary || '#00F5FF')}55`,
              maxWidth: '92%',
              wordBreak: 'break-word',
            }}
            className="text-center"
          >
            <span
              style={{
                color: hookTextColor || '#FFFFFF',
                fontSize: hookSize === 'sm' ? 44 : hookSize === 'lg' ? 84 : 62,
                lineHeight: 1.22,
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: "'Plus Jakarta Sans', Montserrat, Inter, sans-serif",
                textShadow: '0 3px 18px rgba(0,0,0,0.95)',
                display: 'inline-block',
              }}
            >
              {title}
            </span>
          </div>
        </div>
      )}

      {/* 4. Cinematic B-Roll Layer */}
      <BrollLayer
        brollScenes={brollScenes}
        fps={fps}
        durationInFrames={durationInFrames}
        brollLoopFrames={brollLoopFrames}
        enterSpring={enterSpring}
        resolveUrl={resolveUrl}
        VideoEngine={VideoEngine}
      />

      {/* 5. Full Stage Takeover Backdrop (dimmed + blurred over speaker video) */}
      {isFullTakeover && activeScene && (
        <div
          style={{
            opacity: morphProgress,
            backgroundColor: 'rgba(11, 15, 25, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            backgroundImage: theme.gridPattern,
            backgroundSize: theme.gridSize,
          }}
          className="absolute inset-0 z-20 pointer-events-none"
        />
      )}

      {/* 6. Dynamic Motion Graphics Stage */}
      {!cleanSpeakerMode && activeScene && !isBrollFull && !isBrollSplit && (
        <div
          style={{
            ...((activeScene.custom_x != null || activeScene.custom_y != null || isFullTakeover) ? { top: 0, height: '100%' } : stageOverlayStyle),
            opacity: morphProgress,
          }}
          className="absolute inset-x-0 z-30 overflow-visible pointer-events-none"
        >
          <DynamicStageRenderer
            scene={activeScene}
            theme={theme}
            currentTime={currentTime}
            sceneFrame={sceneFrame}
            sceneTotalFrames={sceneTotalFrames}
            enterSpring={enterSpring}
            secondarySpring={secondarySpring}
          />
        </div>
      )}

      {/* 7. Kinetic Subtitle Captions */}
      <div
        style={{
          top: captionTopPct,
          height: '14%',
        }}
        className="absolute inset-x-0 flex items-center justify-center z-40 pointer-events-none"
      >
        <KineticCaptions
          words={words}
          preset={preset}
          subtitleConfig={subtitleConfig}
          themeAccent={theme.accentPrimary}
        />
      </div>

      {/* 8. Bottom Playhead Progress Line */}
      <div className="absolute bottom-0 inset-x-0 h-2 bg-black/30 z-50 pointer-events-none">
        <div
          style={{
            width: `${progressPercent}%`,
            backgroundColor: theme.accentPrimary,
          }}
          className="h-full"
        />
      </div>
    </AbsoluteFill>
  );
};
