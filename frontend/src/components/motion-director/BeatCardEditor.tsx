import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Clock,
  Maximize2,
  ArrowUp,
  ArrowDown,
  Crosshair,
  MessageSquare,
  Type,
  Palette,
  Film,
  Camera,
  RotateCcw,
  Pipette,
  Sparkles,
  Code,
} from 'lucide-react';
import {
  MotionEvent,
  MotionZone,
  MotionTransition,
  TranscriptWord,
} from '../../types';
import {
  ARCHETYPE_OPTIONS,
  getArchetypeDefinition,
} from '../../remotion/archetypes/registry';
import { ArchetypeField } from '../../remotion/archetypes/types';
import { resolveScaleFactor } from '../../remotion/motionKit';
import { SfxSelectorDropdown } from '../SfxSelectorDropdown';
import { Button, IconButton, Input, Select, ColorPickerField } from '../ui';
import { VersusFields } from './fields/VersusFields';
import { ChartFields } from './fields/ChartFields';
import { StepsFields } from './fields/StepsFields';

const ZONE_OPTIONS: { value: MotionZone; label: string; icon: React.ReactNode }[] = [
  { value: 'full_takeover', label: 'Full', icon: <Maximize2 className="w-3 h-3" /> },
  { value: 'top_stage', label: 'Top', icon: <ArrowUp className="w-3 h-3" /> },
  { value: 'center_spotlight', label: 'Center', icon: <Crosshair className="w-3 h-3" /> },
  { value: 'bottom_stage', label: 'Bottom', icon: <ArrowDown className="w-3 h-3" /> },
  { value: 'floating_overlay', label: 'Overlay', icon: <MessageSquare className="w-3 h-3" /> },
];

const TRANSITION_OPTIONS: { value: MotionTransition; label: string }[] = [
  { value: 'spring_slam', label: 'Spring Slam' },
  { value: 'curtain_wipe', label: 'Curtain Wipe' },
  { value: 'slide_left', label: 'Slide In' },
  { value: 'glitch_flash', label: 'Glitch Flash' },
  { value: 'type_reveal', label: 'Smooth Rise' },
];

const REAL_ACCENT_SWATCHES = [
  { name: 'Cyan', val: '#00F5FF' },
  { name: 'Gold', val: '#FFE600' },
  { name: 'Crimson', val: '#EF4444' },
  { name: 'Violet', val: '#A855F7' },
  { name: 'Emerald', val: '#10B981' },
  { name: 'White', val: '#FFFFFF' },
];

const TEXT_COLOR_SWATCHES = [
  { name: 'White', val: '#FFFFFF' },
  { name: 'Dark Ink', val: '#111827' },
  { name: 'Red', val: '#EF4444' },
  { name: 'Yellow', val: '#FFE600' },
  { name: 'Cyan', val: '#00F5FF' },
  { name: 'Slate', val: '#94A3B8' },
];

const BACKDROP_BG_SWATCHES = [
  { name: 'Graphite', val: '#0A0F1A' },
  { name: 'Obsidian', val: '#050811' },
  { name: 'Deep Indigo', val: '#1E1B4B' },
  { name: 'Pure White', val: '#FFFFFF' },
  { name: 'Warm Paper', val: '#F6F2E9' },
  { name: 'Crimson', val: '#280A14' },
  { name: 'Emerald', val: '#062018' },
  { name: 'Zinc', val: '#18181B' },
];

const SCALE_OPTIONS = [
  { id: '1.0x', label: '1.0x' },
  { id: '1.3x', label: '1.3x' },
  { id: '1.6x', label: '1.6x' },
  { id: '2.0x', label: '2.0x' },
  { id: '2.3x', label: '2.3x' },
];

interface BeatCardEditorProps {
  activeBeat: MotionEvent;
  safeIdx: number;
  clipDuration: number;
  clipWords?: TranscriptWord[];
  sfxVolume: number;
  isLocked: boolean;
  updateBeat: (idx: number, patch: Partial<MotionEvent>) => void;
  handleDeleteBeat: (idx: number) => void;
  onSeekRelative?: (seconds: number) => void;
}

export const BeatCardEditor: React.FC<BeatCardEditorProps> = ({
  activeBeat,
  safeIdx,
  clipDuration,
  clipWords = [],
  sfxVolume,
  isLocked,
  updateBeat,
  handleDeleteBeat,
  onSeekRelative,
}) => {
  const archetypeDef = getArchetypeDefinition(activeBeat.type);
  const hasField = (field: ArchetypeField) => archetypeDef.fields.includes(field);

  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [sceneGenMsg, setSceneGenMsg] = useState('');

  // Auto-seek playhead to beat start + 0.5s when active beat changes
  useEffect(() => {
    onSeekRelative?.(activeBeat.time_sec + 0.5);
  }, [safeIdx]);

  const handleGenerateCustomScene = async () => {
    setIsGeneratingScene(true);
    setSceneGenMsg('');
    try {
      const wordsSnippet = clipWords.slice(0, 80).map((w) => w.word).join(' ');
      const res = await fetch('/api/generate-custom-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_transcript: wordsSnippet,
          prompt: customPrompt,
          tag: activeBeat.label,
          headline: activeBeat.text,
          value: activeBeat.value,
          subtext: activeBeat.subtext,
          trigger_phrase: activeBeat.trigger_phrase,
          theme_accent: activeBeat.accent_color || '#00F5FF',
          theme_text: activeBeat.text_color || '#FFFFFF',
        }),
      });
      const data = await res.json();
      if (data.success) {
        updateBeat(safeIdx, {
          type: 'custom_ai_scene',
          custom_scene_code: data.scene_code,
          custom_scene_compiled: data.compiled_js,
        });
        setSceneGenMsg(`Generated & compiled via ${data.provider || 'AI'}!`);
        onSeekRelative?.(activeBeat.time_sec + 0.5);
      } else {
        setSceneGenMsg(data.error || 'Generation failed');
      }
    } catch (e: any) {
      setSceneGenMsg(e.message || 'Network error');
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const currentSteps =
    activeBeat.keywords && activeBeat.keywords.length > 0
      ? activeBeat.keywords
      : activeBeat.items && activeBeat.items.length > 0
      ? activeBeat.items
      : ['STEP 1', 'STEP 2', 'STEP 3'];

  const handleStepChange = (stepIdx: number, val: string) => {
    const next = [...currentSteps];
    next[stepIdx] = val;
    const patch: Partial<MotionEvent> = { keywords: next, items: next };
    if (activeBeat.type === 'vector_diagram') {
      patch.vector_nodes = next.slice(0, 3).map((lbl, idx) => ({
        label: lbl.toUpperCase(),
        sub: idx === 0 ? 'TRIGGER' : idx === 1 ? 'PROCESS' : 'OUTCOME',
        x: idx === 0 ? 200 : idx === 1 ? 470 : 740,
        y: idx === 1 ? 95 : 155,
        accent: idx > 0,
      }));
    }
    updateBeat(safeIdx, patch);
  };

  const handleAddStep = () => {
    const next = [...currentSteps, `STEP ${currentSteps.length + 1}`];
    const patch: Partial<MotionEvent> = { keywords: next, items: next };
    if (activeBeat.type === 'vector_diagram') {
      patch.vector_nodes = next.slice(0, 3).map((lbl, idx) => ({
        label: lbl.toUpperCase(),
        sub: idx === 0 ? 'TRIGGER' : idx === 1 ? 'PROCESS' : 'OUTCOME',
        x: idx === 0 ? 200 : idx === 1 ? 470 : 740,
        y: idx === 1 ? 95 : 155,
        accent: idx > 0,
      }));
    }
    updateBeat(safeIdx, patch);
  };

  const handleRemoveStep = (stepIdx: number) => {
    if (currentSteps.length <= 1) return;
    const next = currentSteps.filter((_, i) => i !== stepIdx);
    const patch: Partial<MotionEvent> = { keywords: next, items: next };
    if (activeBeat.type === 'vector_diagram') {
      patch.vector_nodes = next.slice(0, 3).map((lbl, idx) => ({
        label: lbl.toUpperCase(),
        sub: idx === 0 ? 'TRIGGER' : idx === 1 ? 'PROCESS' : 'OUTCOME',
        x: idx === 0 ? 200 : idx === 1 ? 470 : 740,
        y: idx === 1 ? 95 : 155,
        accent: idx > 0,
      }));
    }
    updateBeat(safeIdx, patch);
  };

  const handleAutoPickKeywords = () => {
    if (clipWords.length === 0) return;
    const t = activeBeat.time_sec;
    const windowWords = clipWords.filter(
      (w) => w.start >= Math.max(0, t - 2.0) && w.start <= t + 6.0
    );
    const valid = (windowWords.length > 3 ? windowWords : clipWords)
      .map((w) => w.word.replace(/[^a-zA-Z0-9']/g, '').trim())
      .filter((w) => w.length >= 4);

    const unique: string[] = [];
    for (const w of valid) {
      const up = w.toUpperCase();
      if (!unique.includes(up)) unique.push(up);
      if (unique.length >= 4) break;
    }

    if (unique.length > 0) {
      const patch: Partial<MotionEvent> = { keywords: unique, items: unique };
      if (activeBeat.type === 'vector_diagram') {
        patch.vector_nodes = unique.slice(0, 3).map((lbl, idx) => ({
          label: lbl.toUpperCase(),
          sub: idx === 0 ? 'TRIGGER' : idx === 1 ? 'PROCESS' : 'OUTCOME',
          x: idx === 0 ? 200 : idx === 1 ? 470 : 740,
          y: idx === 1 ? 95 : 155,
          accent: idx > 0,
        }));
      }
      updateBeat(safeIdx, patch);
    }
  };

  return (
    <div
      className={`bg-slate-950/70 border border-studio-border rounded-xl p-3.5 flex flex-col gap-3.5 select-none ${
        isLocked ? 'opacity-55 pointer-events-none' : ''
      }`}
    >
      {/* 1. Header: Archetype Selector & Delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Motion Graphic Type
          </label>
          <Select
            sizeVariant="sm"
            value={activeBeat.type}
            onChange={(e) => {
              const newType = e.target.value as any;
              updateBeat(safeIdx, { type: newType });
              onSeekRelative?.(activeBeat.time_sec + 0.5);
            }}
          >
            {ARCHETYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col justify-end pt-4">
          <IconButton
            variant="danger"
            size="sm"
            onClick={() => handleDeleteBeat(safeIdx)}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            aria-label="Delete beat card"
            title="Delete this motion graphic"
          />
        </div>
      </div>

      {/* 2. Timing & Animation */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1 font-bold">
            <Clock className="w-3 h-3" /> Start (s)
          </label>
          <Input
            sizeVariant="sm"
            type="number"
            step={0.2}
            min={0}
            max={Math.max(1, clipDuration - 1)}
            value={activeBeat.time_sec}
            onChange={(e) =>
              updateBeat(safeIdx, {
                time_sec: Math.max(0, Number(e.target.value)),
                trigger_phrase: '',
              })
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Duration (s)
          </label>
          <Input
            sizeVariant="sm"
            type="number"
            step={0.2}
            min={1.4}
            max={5.0}
            value={activeBeat.duration_sec ?? 2.4}
            onChange={(e) =>
              updateBeat(safeIdx, {
                duration_sec: Math.max(1.4, Math.min(5.0, Number(e.target.value))),
              })
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Animation
          </label>
          <Select
            sizeVariant="sm"
            value={activeBeat.transition || 'spring_slam'}
            onChange={(e) =>
              updateBeat(safeIdx, { transition: e.target.value as MotionTransition })
            }
          >
            {TRANSITION_OPTIONS.map((tr) => (
              <option key={tr.value} value={tr.value}>
                {tr.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* 3. Screen Placement */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Placement Zone on Screen
          </label>
          {(activeBeat.custom_x != null || activeBeat.custom_y != null) && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => updateBeat(safeIdx, { custom_x: null, custom_y: null, custom_scale: null })}
              leftIcon={<RotateCcw className="w-3 h-3 text-cyan-400" />}
              className="h-5 px-1.5 text-[9px] text-cyan-400 font-mono font-bold"
              title="Reset position back to default zone center"
            >
              Reset Pos ({activeBeat.custom_x}%, {activeBeat.custom_y}%)
            </Button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {ZONE_OPTIONS.map((z) => {
            const isSel = (activeBeat.zone || 'full_takeover') === z.value;
            return (
              <Button
                key={z.value}
                type="button"
                variant={isSel ? 'primary' : 'secondary'}
                size="xs"
                onClick={() => {
                  let defaultY = 50;
                  if (z.value === 'top_stage') defaultY = 28;
                  else if (z.value === 'bottom_stage') defaultY = 72;
                  else if (z.value === 'floating_overlay') defaultY = 20;
                  else defaultY = 50;

                  updateBeat(safeIdx, {
                    zone: z.value,
                    custom_x: 50,
                    custom_y: defaultY,
                  });
                }}
                leftIcon={z.icon}
                className="justify-center text-[10px] px-1"
              >
                {z.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 4. Text Scale, Colors & Surface Styling */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800/80">
        {/* 4a. Text Scale Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
            <Type className="w-3 h-3 text-cyan-400" />
            <span>Text Scale</span>
          </label>
          <div className="flex items-center gap-1">
            {SCALE_OPTIONS.map((s) => {
              const currentScale = activeBeat.text_size || '1.0x';
              const isSel = currentScale === s.id || (s.id === '1.0x' && (currentScale === 'md' || currentScale === 'sm'));
              return (
                <Button
                  key={s.id}
                  variant={isSel ? 'primary' : 'ghost'}
                  size="xs"
                  onClick={() => updateBeat(safeIdx, { text_size: s.id as any, custom_scale: resolveScaleFactor(s.id) })}
                  className="flex-1 text-[10px] font-mono px-0 justify-center"
                >
                  {s.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 4b. Headline Text Color */}
        <ColorPickerField
          label="Headline Text Color"
          value={activeBeat.text_color}
          swatches={TEXT_COLOR_SWATCHES}
          onChange={(color) => updateBeat(safeIdx, { text_color: color })}
          defaultPlaceholder="#FFFFFF"
          autoLabel="Theme Auto"
          icon={<Type className="w-3 h-3 text-emerald-400" />}
        />

        {/* 4c. Graphic Accent / Highlight Color */}
        <ColorPickerField
          label="Accent & Spotlight Color"
          value={activeBeat.accent_color}
          swatches={REAL_ACCENT_SWATCHES}
          onChange={(color) => updateBeat(safeIdx, { accent_color: color })}
          defaultPlaceholder="#00F5FF"
          autoLabel="Theme Auto"
          icon={<Palette className="w-3 h-3 text-cyan-400" />}
        />

        {/* 4d. Card Backdrop / Background Color (Brand Hex) */}
        <ColorPickerField
          label="Card Backdrop Color (Brand Hex)"
          value={activeBeat.bg_color}
          swatches={BACKDROP_BG_SWATCHES}
          onChange={(color) => updateBeat(safeIdx, { bg_color: color })}
          defaultPlaceholder="#0A0F1A"
          autoLabel="Theme Auto"
          icon={<Palette className="w-3 h-3 text-amber-400" />}
        />

        {/* 4e. Card Backdrop Surface */}
        <div className="flex flex-col gap-1 pt-1">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Card Backdrop Surface
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                { id: 'auto', label: 'Auto' },
                { id: 'paper', label: 'Paper' },
                { id: 'glass', label: 'Glass' },
                { id: 'transparent', label: 'Clear' },
              ] as const
            ).map((srf) => {
              const currentSrf = activeBeat.surface_style || 'auto';
              const isSel = currentSrf === srf.id;
              return (
                <Button
                  key={srf.id}
                  variant={isSel ? 'primary' : 'ghost'}
                  size="xs"
                  onClick={() => updateBeat(safeIdx, { surface_style: srf.id })}
                  className="text-[10px] font-medium h-6 px-1"
                >
                  {srf.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Entry Sound Effect */}
      <SfxSelectorDropdown
        value={activeBeat.sfx_type || 'whoosh'}
        sfxVolume={sfxVolume}
        disabled={isLocked}
        onChange={(sfx) => updateBeat(safeIdx, { sfx_type: sfx })}
      />

      {/* 6. Schema-Driven Archetype Controls */}

      {/* 6-Custom. Custom AI Scene Generator (Sandbox) */}
      {activeBeat.type === 'custom_ai_scene' && (
        <div className="flex flex-col gap-2 pt-2 pb-1 border-t border-cyan-500/30 bg-cyan-950/20 -mx-1 px-2.5 py-2 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Scene Generator (Sandbox)</span>
            </span>
            {activeBeat.custom_scene_compiled && (
              <span className="text-[9px] font-mono text-emerald-400 font-semibold uppercase">
                JIT Ready
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono text-slate-400">
              Prompt / Creative Direction
            </label>
            <Input
              sizeVariant="sm"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional: describe layout/metaphor, or leave blank to auto-design from speech..."
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="xs"
              onClick={handleGenerateCustomScene}
              disabled={isGeneratingScene}
              leftIcon={<Sparkles className="w-3 h-3 text-slate-950" />}
              className="flex-1 justify-center text-[10px] font-bold"
            >
              {isGeneratingScene ? 'Generating TSX...' : 'Generate Scene with AI'}
            </Button>

            {activeBeat.custom_scene_code && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowCodePreview(!showCodePreview)}
                leftIcon={<Code className="w-3 h-3" />}
                className="text-[10px] font-mono"
              >
                {showCodePreview ? 'Hide TSX' : 'View TSX'}
              </Button>
            )}
          </div>

          {sceneGenMsg && (
            <span className="text-[10px] font-mono text-cyan-400 pt-0.5">
              {sceneGenMsg}
            </span>
          )}

          {showCodePreview && activeBeat.custom_scene_code && (
            <div className="max-h-40 overflow-y-auto rounded bg-slate-950 p-2 border border-slate-800 text-[10px] font-mono text-slate-300">
              <pre className="whitespace-pre-wrap">{activeBeat.custom_scene_code}</pre>
            </div>
          )}
        </div>
      )}

      {/* 6a. Section Tag / Category Header */}
      {hasField('tag') && (
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              Section Tag / Category Header
            </label>
            <span className="text-[9px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              Visible on Canvas
            </span>
          </div>
          <Input
            sizeVariant="sm"
            value={activeBeat.label || ''}
            onChange={(e) => updateBeat(safeIdx, { label: e.target.value, tag: e.target.value })}
            placeholder="e.g. DAILY ROUTINE, KEY INSIGHT..."
          />
        </div>
      )}

      {/* 6b. Primary Focus Word / Metric Readout */}
      {hasField('value') && (
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Primary Word / Metric Value
          </label>
          <Input
            sizeVariant="sm"
            value={activeBeat.value || ''}
            onChange={(e) => {
              const newVal = e.target.value;
              updateBeat(safeIdx, {
                value: newVal,
                focus_word: newVal.toUpperCase(),
              });
            }}
            placeholder="e.g. 85%, SLEEP, 3 MONTHS..."
          />
        </div>
      )}

      {/* 6c. Impact Headline / Main Text */}
      {hasField('headline') && (
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Impact Headline / Spoken Text
          </label>
          <Input
            sizeVariant="sm"
            value={activeBeat.text || ''}
            onChange={(e) => {
              const newText = e.target.value;
              const words = newText.trim().split(/\s+/).filter(Boolean);
              updateBeat(safeIdx, {
                text: newText,
                headline: newText,
                keywords: words.map((w) => w.toUpperCase()),
                items: words.map((w) => w.toUpperCase()),
                focus_word: words.length > 0 ? words[words.length - 1].toUpperCase() : newText,
              });
            }}
            placeholder="e.g. DRINKING COFFEE BEFORE BED..."
          />
        </div>
      )}

      {/* 6d. Supporting Subtext */}
      {hasField('subtext') && (
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Supporting Subtext
          </label>
          <Input
            sizeVariant="sm"
            value={activeBeat.subtext || ''}
            onChange={(e) => updateBeat(safeIdx, { subtext: e.target.value })}
            placeholder="Optional secondary detail..."
          />
        </div>
      )}

      {/* 6e. 2-Column Versus Contrast */}
      {hasField('versus') && (
        <VersusFields
          activeBeat={activeBeat}
          safeIdx={safeIdx}
          updateBeat={updateBeat}
        />
      )}

      {/* 6f. B-Roll Stock Video Search Query */}
      {hasField('broll') && (
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
            <Film className="w-3 h-3 text-cyan-400" />
            <span>B-Roll Search Query</span>
          </label>
          <Input
            sizeVariant="sm"
            value={activeBeat.broll_query || ''}
            onChange={(e) => updateBeat(safeIdx, { broll_query: e.target.value })}
            placeholder="e.g. espresso coffee pour close up..."
          />
        </div>
      )}

      {/* 6g. Spline Chart Point Values */}
      {hasField('chart') && (
        <ChartFields
          activeBeat={activeBeat}
          safeIdx={safeIdx}
          updateBeat={updateBeat}
        />
      )}

      {/* 6h. Escalating Steps & Flowchart Nodes */}
      {hasField('steps') && (
        <StepsFields
          currentSteps={currentSteps}
          handleAutoPickKeywords={handleAutoPickKeywords}
          handleAddStep={handleAddStep}
          handleRemoveStep={handleRemoveStep}
          handleStepChange={handleStepChange}
        />
      )}

      {/* 6i. Trigger Phrase / Audio Anchor */}
      {hasField('trigger_phrase') && (
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              Trigger Phrase / Audio Anchor
            </label>
            <span className="text-[9px] font-mono text-slate-400">
              Word-snapped timing
            </span>
          </div>
          <Input
            sizeVariant="sm"
            value={activeBeat.trigger_phrase || ''}
            onChange={(e) => updateBeat(safeIdx, { trigger_phrase: e.target.value })}
            placeholder="e.g. coffee before bed..."
          />
        </div>
      )}

      {/* 6j. Visual Toggles: B&W Filter & Punch Zoom */}
      {(hasField('bw_filter') || hasField('zoom')) && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          {hasField('bw_filter') && (
            <Button
              variant={activeBeat.bw_filter ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateBeat(safeIdx, { bw_filter: !activeBeat.bw_filter })}
              className="flex-1 justify-center text-[10px]"
            >
              {activeBeat.bw_filter ? 'B&W Filter: Active' : 'B&W Filter: Off'}
            </Button>
          )}
          {hasField('zoom') && (
            <Button
              variant={activeBeat.zoom ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateBeat(safeIdx, { zoom: !activeBeat.zoom })}
              leftIcon={<Camera className="w-3 h-3" />}
              className="flex-1 justify-center text-[10px]"
            >
              {activeBeat.zoom ? 'Punch Zoom: On' : 'Punch Zoom: Off'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
