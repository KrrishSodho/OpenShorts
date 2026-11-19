import { SubtitleStyleId } from '../../types';
import { SubtitleStyleDefinition } from './types';
import { HormoziPop } from './HormoziPop';
import { MinimalShadow } from './MinimalShadow';
import { KaraokePill } from './KaraokePill';
import { PaperOrBoxCaptions } from './PaperOrBoxCaptions';

export const SUBTITLE_STYLE_REGISTRY: Record<SubtitleStyleId, SubtitleStyleDefinition> = {
  tape_crimson: {
    id: 'tape_crimson',
    name: 'Crimson Label Tape',
    desc: 'Editorial black tape + red punch highlight',
    swatch: 'bg-[#E63946]',
    Component: PaperOrBoxCaptions,
  },
  hormozi_pop: {
    id: 'hormozi_pop',
    name: 'Hormozi Bold Pop',
    desc: 'Outlined uppercase + yellow pop',
    swatch: 'bg-[#FFE600]',
    Component: HormoziPop,
  },
  opus_paper: {
    id: 'opus_paper',
    name: 'Opus Swiss Paper',
    desc: 'Warm paper strip + red pill',
    swatch: 'bg-[#F4F1EA]',
    Component: PaperOrBoxCaptions,
  },
  neon_cyan: {
    id: 'neon_cyan',
    name: 'Neon Cyber Blue',
    desc: 'Dark plate + high-glow cyan active word',
    swatch: 'bg-[#00F0FF]',
    Component: PaperOrBoxCaptions,
  },
  minimal_shadow: {
    id: 'minimal_shadow',
    name: 'Pure Typography Shadow',
    desc: 'Clean bold text with soft drop shadow',
    swatch: 'bg-white',
    Component: MinimalShadow,
  },
  karaoke_pill: {
    id: 'karaoke_pill',
    name: 'Karaoke Smooth Pill',
    desc: 'Rounded dark capsule with bottom fill line',
    swatch: 'bg-emerald-400',
    Component: KaraokePill,
  },
};

export const SUBTITLE_STYLE_OPTIONS = Object.values(SUBTITLE_STYLE_REGISTRY);

export function getSubtitleStyleDefinition(id: SubtitleStyleId): SubtitleStyleDefinition {
  return SUBTITLE_STYLE_REGISTRY[id] || SUBTITLE_STYLE_REGISTRY.tape_crimson;
}
