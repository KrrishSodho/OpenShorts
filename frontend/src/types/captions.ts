export type SubtitleStyleId =
  | 'tape_crimson'
  | 'hormozi_pop'
  | 'opus_paper'
  | 'neon_cyan'
  | 'minimal_shadow'
  | 'karaoke_pill';

export type SubtitleHighlightColor =
  | 'yellow'
  | 'cyan'
  | 'emerald'
  | 'crimson'
  | 'violet'
  | 'white';

export interface SubtitleConfig {
  style: SubtitleStyleId;
  fontSize: 'sm' | 'md' | 'lg';
  position: 'bottom' | 'middle' | 'top';
  maxWordsPerPhrase: 1 | 2 | 3 | 5 | 7;
  uppercase: boolean;
  highlightColor?: SubtitleHighlightColor;
  textColor?: string;
  customHighlightColor?: string;
  bgColor?: string;
}
