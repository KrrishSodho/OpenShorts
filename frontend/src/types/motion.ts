import { ProceduralScene } from './procedural';

export interface PanKeyframe {
  t: number;
  pan: number;
  transition?: 'cut' | 'smooth';
}

export type MotionEventType =
  | 'word_hit'
  | 'contrast_split'
  | 'process_steps'
  | 'metric_reveal'
  | 'pull_quote'
  | 'speaker_moment'
  | 'keyword_cascade_takeover'
  | 'explainer_timeline_takeover'
  | 'kinetic_word_wall'
  | 'radial_gauge_stat'
  | 'power_meter_gauge'
  | 'showcase_carousel'
  | 'quote_editorial_card'
  | 'vector_diagram'
  | 'editorial_split'
  | 'poster_slam'
  | 'bento_grid'
  | 'spec_versus'
  | 'odometer_counter'
  | 'carousel_cards'
  | 'bar_comparison'
  | 'donut_breakdown'
  | 'pyramid_levels'
  | 'custom_ai_scene'
  | 'broll_full'
  | 'broll_split'
  | 'clean_speaker'
  | 'stat_counter'
  | 'versus_card'
  | 'myth_twist';

export type MotionZone =
  | 'top_stage'
  | 'center_spotlight'
  | 'bottom_stage'
  | 'floating_overlay'
  | 'full_takeover';

export type MotionTransition =
  | 'spring_slam'
  | 'curtain_wipe'
  | 'slide_left'
  | 'glitch_flash'
  | 'type_reveal';

export type SfxType =
  | 'none'
  | 'whoosh'
  | 'pop'
  | 'click'
  | 'chime'
  | 'riser'
  | 'blip'
  | 'shutter'
  | 'sub_hit';

export interface VectorNode {
  label: string;
  sub?: string | null;
  x: number;
  y: number;
  accent?: boolean;
}

export interface VectorLink {
  from: number;
  to: number;
  label?: string | null;
}

export interface MotionEvent {
  time_sec: number;
  duration_sec?: number;
  type: MotionEventType;
  zone?: MotionZone | null;
  transition?: MotionTransition | null;
  trigger_phrase?: string | null;
  text?: string | null;
  headline?: string | null;
  subtext?: string | null;
  label?: string | null;
  tag?: string | null;
  value?: string | null;
  focus_word?: string | null;
  left_item?: string | null;
  right_item?: string | null;
  left_ratio?: number | null;
  right_ratio?: number | null;
  items?: string[] | null;
  keywords?: string[] | null;
  chart_values?: number[] | null;
  vector_nodes?: VectorNode[] | null;
  vector_links?: VectorLink[] | null;
  layout_ratio?: number | null;
  broll_query?: string | null;
  broll_url?: string | null;
  sfx_type?: SfxType | null;
  accent_color?: string | null;
  text_color?: string | null;
  bg_color?: string | null;
  surface_style?: 'auto' | 'paper' | 'glass' | 'transparent' | null;
  text_size?: '1.0x' | '1.3x' | '1.6x' | '2.0x' | '2.3x' | 'sm' | 'md' | 'lg' | 'xl' | null;
  custom_x?: number | null;
  custom_y?: number | null;
  custom_scale?: number | null;
  bw_filter?: boolean | null;
  zoom?: boolean | null;
  custom_scene_code?: string | null;
  custom_scene_compiled?: string | null;
  procedural_scene?: ProceduralScene | null;
}

export interface DynamicThemeTokens {
  mode: 'editorial' | 'kinetic' | 'technical';
  stageBg: string;
  stageBgInverted: string;
  cardBg: string;
  textPrimary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  borderStyle: string;
  gridPattern: string;
  gridSize: string;
}

export interface CompiledSceneBeat {
  id: string;
  index: number;
  start: number;
  end: number;
  type: MotionEventType;
  zone: MotionZone;
  transition: MotionTransition;
  headline: string;
  focusWord: string;
  tag: string;
  subtext: string;
  metricValue: string;
  leftLabel: string;
  rightLabel: string;
  leftRatio: number;
  rightRatio: number;
  checklistItems: string[];
  keywords: string[];
  chartValues: number[];
  vectorNodes: VectorNode[];
  vectorLinks: VectorLink[];
  stageHeightPct: number;
  brollUrl?: string | null;
  sfxType?: SfxType | null;
  bwFilter: boolean;
  zoom: boolean;
  accentColor?: string | null;
  textColor?: string | null;
  bgColor?: string | null;
  surfaceStyle?: 'auto' | 'paper' | 'glass' | 'transparent' | null;
  textSize?: '1.0x' | '1.3x' | '1.6x' | '2.0x' | '2.3x' | 'sm' | 'md' | 'lg' | 'xl';
  custom_x?: number | null;
  custom_y?: number | null;
  custom_scale?: number | null;
  customSceneCode?: string | null;
  customSceneCompiled?: string | null;
  proceduralScene?: ProceduralScene | null;
  wordsInBeat: Array<{
    word: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
}
