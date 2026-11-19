import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Volume2, Check } from 'lucide-react';
import { SfxType } from '../types';
import { playSfxAudioPreview } from '../utils/audioPreview';
import { Button } from './ui';

const SFX_OPTIONS: { value: SfxType; label: string }[] = [
  { value: 'none', label: 'None (Silent)' },
  { value: 'whoosh', label: 'Soft Whoosh' },
  { value: 'pop', label: 'Warm Pop' },
  { value: 'chime', label: 'Bell Chime' },
  { value: 'blip', label: 'UI Blip' },
  { value: 'riser', label: 'Tension Riser' },
  { value: 'click', label: 'Soft Click' },
  { value: 'shutter', label: 'Camera Shutter' },
  { value: 'sub_hit', label: 'Sub Bass Hit' },
];

interface Props {
  value: SfxType;
  sfxVolume: number;
  disabled?: boolean;
  onChange: (sfx: SfxType) => void;
}

export const SfxSelectorDropdown: React.FC<Props> = ({
  value,
  sfxVolume,
  disabled = false,
  onChange,
}) => {
  const activeOption = SFX_OPTIONS.find((o) => o.value === value) || SFX_OPTIONS[1];

  const previewSound = (sfx: SfxType) => {
    playSfxAudioPreview(sfx, Math.min(1, Math.max(0.05, sfxVolume)));
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 flex flex-col gap-1">
        <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
          Entry Sound Effect
        </label>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild disabled={disabled}>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="justify-between bg-slate-950 font-normal text-slate-100 border-studio-border"
              rightIcon={<ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            >
              <span>{activeOption.label}</span>
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={6}
              collisionPadding={16}
              className="w-[240px] max-h-[280px] overflow-y-auto bg-[#0E1422] border border-slate-700 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5"
            >
              {SFX_OPTIONS.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <DropdownMenu.Item
                    key={opt.value}
                    onSelect={() => {
                      onChange(opt.value);
                      previewSound(opt.value);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer outline-none flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-200 font-bold'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <Button
        variant="secondary"
        size="sm"
        disabled={disabled || value === 'none'}
        onClick={() => previewSound(value)}
        title="Preview sound effect"
        leftIcon={<Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
        className="font-mono text-cyan-300 shrink-0"
      >
        Test
      </Button>
    </div>
  );
};