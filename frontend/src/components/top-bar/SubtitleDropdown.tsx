import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Type, ChevronDown, Check, Pipette } from 'lucide-react';
import { SubtitleConfig, SubtitleStyleId, SubtitleHighlightColor } from '../../types';
import { SUBTITLE_STYLE_OPTIONS } from '../../remotion/captions/registry';
import { Button } from '../ui';

const COLOR_OPTIONS: Array<{ id: SubtitleHighlightColor; label: string; bg: string }> = [
  { id: 'yellow', label: 'Gold', bg: 'bg-[#FFE600]' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-[#00F0FF]' },
  { id: 'emerald', label: 'Green', bg: 'bg-[#10B981]' },
  { id: 'crimson', label: 'Red', bg: 'bg-[#E63946]' },
  { id: 'violet', label: 'Purple', bg: 'bg-[#A855F7]' },
  { id: 'white', label: 'White', bg: 'bg-white' },
];

const RGB_GRADIENT =
  'conic-gradient(from 180deg at 50% 50%, #EF4444 0deg, #F59E0B 72deg, #10B981 144deg, #00F5FF 216deg, #A855F7 288deg, #EF4444 360deg)';

interface SubtitleDropdownProps {
  subtitleConfig: SubtitleConfig;
  isRendering: boolean;
  setSubtitleConfig: (patch: Partial<SubtitleConfig>) => void;
}

export const SubtitleDropdown: React.FC<SubtitleDropdownProps> = ({
  subtitleConfig,
  isRendering,
  setSubtitleConfig,
}) => {
  const activeSubStyle =
    SUBTITLE_STYLE_OPTIONS.find((s) => s.id === subtitleConfig.style) ||
    SUBTITLE_STYLE_OPTIONS[0];

  const activeColor = subtitleConfig.highlightColor || 'yellow';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={isRendering}>
        <Button
          variant="secondary"
          size="sm"
          title={`Subtitle Style: ${activeSubStyle.name}`}
          className="shrink-0 bg-slate-900/90 border-studio-border text-slate-100"
          leftIcon={<Type className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
          rightIcon={<ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />}
        >
          <span>Subtitles</span>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          side="bottom"
          sideOffset={8}
          collisionPadding={16}
          className="w-[340px] bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-3"
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>Subtitle Style Presets (Live 0ms)</span>
            <span className="text-cyan-400 font-bold uppercase">{subtitleConfig.maxWordsPerPhrase}W PUNCH</span>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {SUBTITLE_STYLE_OPTIONS.map((st) => {
              const active = subtitleConfig.style === st.id;
              return (
                <DropdownMenu.Item
                  key={st.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    setSubtitleConfig({ style: st.id as SubtitleStyleId });
                  }}
                  className={`px-2.5 py-2 rounded-lg cursor-pointer outline-none flex items-center justify-between transition-colors ${
                    active
                      ? 'bg-cyan-500/15 border border-cyan-400/50 text-white'
                      : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded ${st.swatch} border border-white/20`} />
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs font-bold">{st.name}</span>
                      <span className="text-[10px] text-slate-400">{st.desc}</span>
                    </div>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </DropdownMenu.Item>
              );
            })}
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-2 border-t border-slate-800 flex flex-col gap-2.5"
          >
            {/* Highlight Color */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Highlight</span>
              <div className="flex items-center gap-1.5">
                {COLOR_OPTIONS.map((col) => {
                  const isSelected = (!subtitleConfig.customHighlightColor && activeColor === col.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSubtitleConfig({ highlightColor: col.id, customHighlightColor: undefined })}
                      title={col.label}
                      className={`w-4 h-4 rounded-full ${col.bg} transition-all ${
                        isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  );
                })}
                <label
                  title="Custom Highlight Color (RGB)"
                  className={`relative w-4 h-4 rounded-full cursor-pointer flex items-center justify-center overflow-hidden transition-all ${
                    subtitleConfig.customHighlightColor ? 'ring-2 ring-white scale-110' : 'border border-slate-600 hover:scale-105'
                  }`}
                  style={{ background: RGB_GRADIENT }}
                >
                  <Pipette className="w-2 h-2 text-slate-950 stroke-[3] relative z-10" />
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={subtitleConfig.customHighlightColor || '#FFE600'}
                    onChange={(e) => setSubtitleConfig({ customHighlightColor: e.target.value })}
                  />
                </label>
              </div>
            </div>

            {/* Base Text Color Override */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Text Color</span>
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant={!subtitleConfig.textColor ? 'primary' : 'ghost'}
                  onClick={() => setSubtitleConfig({ textColor: undefined })}
                  className="h-5 px-1.5 text-[9px] font-bold"
                >
                  Auto
                </Button>
                <button
                  type="button"
                  title="White Text"
                  onClick={() => setSubtitleConfig({ textColor: '#FFFFFF' })}
                  className={`w-4 h-4 rounded bg-white border border-slate-600 ${
                    subtitleConfig.textColor === '#FFFFFF' ? 'ring-2 ring-cyan-400 scale-110' : 'opacity-70'
                  }`}
                />
                <button
                  type="button"
                  title="Dark Ink Text"
                  onClick={() => setSubtitleConfig({ textColor: '#0F172A' })}
                  className={`w-4 h-4 rounded bg-[#0F172A] border border-slate-600 ${
                    subtitleConfig.textColor === '#0F172A' ? 'ring-2 ring-cyan-400 scale-110' : 'opacity-70'
                  }`}
                />
                <label
                  title="Custom Text Color (RGB)"
                  className={`relative w-4 h-4 rounded cursor-pointer flex items-center justify-center overflow-hidden transition-all ${
                    subtitleConfig.textColor && subtitleConfig.textColor !== '#FFFFFF' && subtitleConfig.textColor !== '#0F172A'
                      ? 'ring-2 ring-cyan-400 scale-110'
                      : 'border border-slate-600 hover:scale-105'
                  }`}
                  style={{ background: RGB_GRADIENT }}
                >
                  <Pipette className="w-2 h-2 text-slate-950 stroke-[3] relative z-10" />
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={subtitleConfig.textColor || '#FFFFFF'}
                    onChange={(e) => setSubtitleConfig({ textColor: e.target.value })}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Position</span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                {(['bottom', 'middle', 'top'] as const).map((pos) => {
                  const isPos = (subtitleConfig.position || 'bottom') === pos;
                  return (
                    <Button
                      key={pos}
                      size="xs"
                      variant={isPos ? 'primary' : 'ghost'}
                      onClick={() => setSubtitleConfig({ position: pos })}
                      className="h-6 px-2 text-[10px] capitalize font-medium rounded-md"
                    >
                      {pos}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Size / Words</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  {(['sm', 'md', 'lg'] as const).map((sz) => {
                    const isSz = (subtitleConfig.fontSize || 'md') === sz;
                    return (
                      <Button
                        key={sz}
                        size="xs"
                        variant={isSz ? 'primary' : 'ghost'}
                        onClick={() => setSubtitleConfig({ fontSize: sz })}
                        className="h-6 px-1.5 text-[10px] uppercase font-bold rounded-md"
                      >
                        {sz}
                      </Button>
                    );
                  })}
                </div>
                <span className="text-slate-600">|</span>
                <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  {([1, 2, 3, 5] as const).map((n) => {
                    const isW = (subtitleConfig.maxWordsPerPhrase || 3) === n;
                    return (
                      <Button
                        key={n}
                        size="xs"
                        variant={isW ? 'primary' : 'ghost'}
                        onClick={() => setSubtitleConfig({ maxWordsPerPhrase: n })}
                        className="h-6 px-1.5 text-[10px] font-bold rounded-md"
                      >
                        {n}w
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono pt-1">
              <span className="text-slate-400">Case</span>
              <Button
                size="xs"
                variant={subtitleConfig.uppercase !== false ? 'primary' : 'ghost'}
                onClick={() =>
                  setSubtitleConfig({
                    uppercase: subtitleConfig.uppercase === false ? true : false,
                  })
                }
                className="h-6 px-2 text-[10px] font-bold"
              >
                ALL CAPS
              </Button>
            </div>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
