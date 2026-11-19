import { MotionEventType, MotionZone } from '../../types';
import { ArchetypeDefinition } from './types';
import { KeywordCascade } from './KeywordCascade';
import { ExplainerTimeline } from './ExplainerTimeline';
import { KineticWordWall } from './KineticWordWall';
import { RadialGaugeStat } from './RadialGaugeStat';
import { QuoteEditorial } from './QuoteEditorial';
import { VectorDiagram } from './VectorDiagram';
import { OdometerCounter } from './OdometerCounter';
import { SpecVersus } from './SpecVersus';
import { PosterSlam } from './PosterSlam';
import { EditorialSplit } from './EditorialSplit';
import { PowerMeterGauge } from './PowerMeterGauge';
import { ShowcaseCarousel } from './ShowcaseCarousel';
import { CarouselCards } from './CarouselCards';
import { BarComparison } from './BarComparison';
import { DonutBreakdown } from './DonutBreakdown';
import { PyramidLevels } from './PyramidLevels';
import { CustomAiScene } from './CustomAiScene';

export const MOTION_ARCHETYPE_REGISTRY: Record<string, ArchetypeDefinition> = {
  word_hit: {
    id: 'word_hit',
    label: 'Word Hit (Kinetic Typography)',
    description: '1-3 huge bold spoken words synced to anchor word, speaker visible behind',
    defaultZone: 'center_spotlight',
    defaultDuration: 2.4,
    fields: ['headline', 'value', 'trigger_phrase'],
    Component: KineticWordWall,
  },
  contrast_split: {
    id: 'contrast_split',
    label: 'Contrast Split (Wipe Reveal)',
    description: 'Two opposing statements with directional wipe and VS badge',
    defaultZone: 'center_spotlight',
    defaultDuration: 2.6,
    fields: ['tag', 'headline', 'versus', 'trigger_phrase'],
    Component: SpecVersus,
  },
  process_steps: {
    id: 'process_steps',
    label: 'Process Steps (Sequential)',
    description: 'Numbered steps revealed in sequence timed to speech',
    defaultZone: 'center_spotlight',
    defaultDuration: 3.0,
    fields: ['tag', 'headline', 'steps', 'trigger_phrase'],
    Component: ExplainerTimeline,
  },
  metric_reveal: {
    id: 'metric_reveal',
    label: 'Real Metric Reveal',
    description: 'Circular percentage gauge or metric stat from transcript',
    defaultZone: 'top_stage',
    defaultDuration: 2.6,
    fields: ['tag', 'value', 'headline', 'trigger_phrase', 'zoom'],
    Component: RadialGaugeStat,
  },
  pull_quote: {
    id: 'pull_quote',
    label: 'Editorial Pull Quote',
    description: 'Actual spoken sentence in editorial typography with dimmed speaker',
    defaultZone: 'bottom_stage',
    defaultDuration: 2.8,
    fields: ['tag', 'headline', 'subtext', 'trigger_phrase'],
    Component: QuoteEditorial,
  },
  speaker_moment: {
    id: 'speaker_moment',
    label: 'Speaker Moment (Clean)',
    description: 'Unobstructed speaker with optional caption emphasis',
    defaultZone: 'center_spotlight',
    defaultDuration: 2.5,
    fields: ['trigger_phrase'],
    Component: () => null,
  },
  power_meter_gauge: {
    id: 'power_meter_gauge',
    label: 'Power Meter & Gauge',
    description: 'Animated glowing progress meter',
    defaultZone: 'top_stage',
    defaultDuration: 2.6,
    fields: ['tag', 'value', 'headline', 'trigger_phrase', 'zoom'],
    Component: PowerMeterGauge,
  },
  showcase_carousel: {
    id: 'showcase_carousel',
    label: 'Showcase Card & Checklist',
    description: 'Technical workflow showcase with category pill and checkmark pipeline',
    defaultZone: 'top_stage',
    defaultDuration: 3.0,
    fields: ['tag', 'headline', 'subtext', 'steps', 'trigger_phrase', 'zoom'],
    Component: ShowcaseCarousel,
  },
  keyword_cascade_takeover: {
    id: 'keyword_cascade_takeover',
    label: 'Keyword Cascade (Full)',
    description: '4-step animated stacked keywords with gold hero tag',
    defaultZone: 'full_takeover',
    defaultDuration: 3.0,
    fields: ['tag', 'steps', 'trigger_phrase'],
    Component: KeywordCascade,
  },
  explainer_timeline_takeover: {
    id: 'explainer_timeline_takeover',
    label: 'Explainer Timeline (3-Step)',
    description: 'Vertical 3-stage animated process line',
    defaultZone: 'full_takeover',
    defaultDuration: 3.0,
    fields: ['tag', 'headline', 'steps', 'trigger_phrase'],
    Component: ExplainerTimeline,
  },
  kinetic_word_wall: {
    id: 'kinetic_word_wall',
    label: 'Kinetic Word Wall',
    description: 'Full-screen impactful word stack with gold accents',
    defaultZone: 'full_takeover',
    defaultDuration: 2.5,
    fields: ['tag', 'steps', 'trigger_phrase'],
    Component: KineticWordWall,
  },
  radial_gauge_stat: {
    id: 'radial_gauge_stat',
    label: 'Radial Gauge Ring',
    description: 'Animated circular percentage ring with punchy statistic',
    defaultZone: 'top_stage',
    defaultDuration: 2.4,
    fields: ['tag', 'value', 'headline', 'trigger_phrase', 'zoom'],
    Component: RadialGaugeStat,
  },
  quote_editorial_card: {
    id: 'quote_editorial_card',
    label: 'Pull-Quote Card',
    description: 'Dark glass quote card with yellow indicator bar',
    defaultZone: 'center_spotlight',
    defaultDuration: 2.6,
    fields: ['tag', 'headline', 'subtext', 'trigger_phrase'],
    Component: QuoteEditorial,
  },
  vector_diagram: {
    id: 'vector_diagram',
    label: 'Vector Flowchart',
    description: 'Animated multi-node flowchart with curved vector connectors',
    defaultZone: 'top_stage',
    defaultDuration: 3.0,
    fields: ['tag', 'headline', 'subtext', 'steps', 'trigger_phrase'],
    Component: VectorDiagram,
  },
  odometer_counter: {
    id: 'odometer_counter',
    label: 'Odometer + Spline Graph',
    description: 'Rolling slot-machine digit counter with smooth spline area chart',
    defaultZone: 'top_stage',
    defaultDuration: 2.6,
    fields: ['tag', 'value', 'headline', 'chart', 'trigger_phrase', 'zoom'],
    Component: OdometerCounter,
  },
  stat_counter: {
    id: 'stat_counter',
    label: 'Odometer + Spline Graph',
    description: 'Rolling slot-machine digit counter with smooth spline area chart',
    defaultZone: 'top_stage',
    defaultDuration: 2.6,
    fields: ['tag', 'value', 'headline', 'chart', 'trigger_phrase', 'zoom'],
    Component: OdometerCounter,
  },
  spec_versus: {
    id: 'spec_versus',
    label: '2-Column Contrast',
    description: 'Blue vs Red contrast card with VS center badge',
    defaultZone: 'top_stage',
    defaultDuration: 2.4,
    fields: ['tag', 'headline', 'versus', 'trigger_phrase'],
    Component: SpecVersus,
  },
  versus_card: {
    id: 'versus_card',
    label: '2-Column Contrast',
    description: 'Blue vs Red contrast card with VS center badge',
    defaultZone: 'top_stage',
    defaultDuration: 2.4,
    fields: ['tag', 'headline', 'versus', 'trigger_phrase'],
    Component: SpecVersus,
  },
  poster_slam: {
    id: 'poster_slam',
    label: 'Yellow Circle Spotlight',
    description: 'Hand-drawn glowing circle highlight around key insight',
    defaultZone: 'center_spotlight',
    defaultDuration: 2.4,
    fields: ['value', 'subtext', 'bw_filter', 'trigger_phrase', 'zoom'],
    Component: PosterSlam,
  },
  myth_twist: {
    id: 'myth_twist',
    label: 'Yellow Circle Spotlight',
    description: 'Hand-drawn glowing circle highlight around key insight',
    defaultZone: 'center_spotlight',
    defaultDuration: 2.4,
    fields: ['value', 'subtext', 'bw_filter', 'trigger_phrase', 'zoom'],
    Component: PosterSlam,
  },
  editorial_split: {
    id: 'editorial_split',
    label: 'Editorial Brush Hook',
    description: 'Headline text with dynamic yellow brush underline on focus word',
    defaultZone: 'center_spotlight',
    defaultDuration: 2.4,
    fields: ['tag', 'value', 'headline', 'trigger_phrase'],
    Component: EditorialSplit,
  },
  broll_full: {
    id: 'broll_full',
    label: 'B-Roll Full Cutaway',
    description: 'Cinematic stock video cutaway filling full vertical canvas',
    defaultZone: 'full_takeover',
    defaultDuration: 3.0,
    fields: ['broll', 'headline', 'trigger_phrase'],
    Component: EditorialSplit,
  },
  broll_split: {
    id: 'broll_split',
    label: 'B-Roll Split Card',
    description: 'Stock video overlay in upper stage with speaker below',
    defaultZone: 'top_stage',
    defaultDuration: 3.0,
    fields: ['broll', 'headline', 'trigger_phrase'],
    Component: EditorialSplit,
  },
  carousel_cards: {
    id: 'carousel_cards',
    label: 'Carousel Cards Deck',
    description: 'Horizontal swipe card deck with side peek and step counter',
    defaultZone: 'center_spotlight',
    defaultDuration: 3.0,
    fields: ['tag', 'headline', 'subtext', 'steps', 'trigger_phrase'],
    Component: CarouselCards,
  },
  bar_comparison: {
    id: 'bar_comparison',
    label: 'Bar Comparison',
    description: 'Animated comparison bars with high-contrast labels and metrics',
    defaultZone: 'top_stage',
    defaultDuration: 2.8,
    fields: ['tag', 'headline', 'steps', 'chart', 'trigger_phrase'],
    Component: BarComparison,
  },
  donut_breakdown: {
    id: 'donut_breakdown',
    label: 'Donut Metric Breakdown',
    description: 'SVG multi-slice donut ring with large center statistic and legend',
    defaultZone: 'top_stage',
    defaultDuration: 2.8,
    fields: ['tag', 'value', 'headline', 'steps', 'chart', 'trigger_phrase'],
    Component: DonutBreakdown,
  },
  pyramid_levels: {
    id: 'pyramid_levels',
    label: 'Pyramid Hierarchy Levels',
    description: 'Stacked 3-4 tier hierarchy illuminating base-to-apex',
    defaultZone: 'top_stage',
    defaultDuration: 3.0,
    fields: ['tag', 'headline', 'steps', 'trigger_phrase'],
    Component: PyramidLevels,
  },
  custom_ai_scene: {
    id: 'custom_ai_scene',
    label: 'Custom AI Scene',
    description: 'Bespoke AI-generated Remotion scene sandbox',
    defaultZone: 'top_stage',
    defaultDuration: 3.0,
    fields: ['tag', 'headline', 'value', 'subtext', 'trigger_phrase'],
    Component: CustomAiScene,
  },
};

export const ARCHETYPE_OPTIONS: Array<{ value: MotionEventType; label: string }> = [
  { value: 'keyword_cascade_takeover', label: 'Keyword Cascade (Full)' },
  { value: 'explainer_timeline_takeover', label: 'Explainer Timeline (3-Step)' },
  { value: 'kinetic_word_wall', label: 'Kinetic Word Wall' },
  { value: 'poster_slam', label: 'Yellow Circle Spotlight' },
  { value: 'editorial_split', label: 'Editorial Brush Hook' },
  { value: 'radial_gauge_stat', label: 'Radial Gauge Ring' },
  { value: 'odometer_counter', label: 'Odometer + Spline Graph' },
  { value: 'vector_diagram', label: 'Vector Flowchart' },
  { value: 'spec_versus', label: '2-Column Contrast' },
  { value: 'quote_editorial_card', label: 'Pull-Quote Card' },
  { value: 'carousel_cards', label: 'Carousel Cards Deck' },
  { value: 'bar_comparison', label: 'Bar Comparison' },
  { value: 'donut_breakdown', label: 'Donut Metric Breakdown' },
  { value: 'pyramid_levels', label: 'Pyramid Hierarchy Levels' },
  { value: 'custom_ai_scene', label: 'Custom AI Scene (Sandbox)' },
];

export function getArchetypeDefinition(type: string): ArchetypeDefinition {
  return MOTION_ARCHETYPE_REGISTRY[type] || MOTION_ARCHETYPE_REGISTRY.editorial_split;
}

export function defaultZoneForType(type: MotionEventType): MotionZone {
  const def = MOTION_ARCHETYPE_REGISTRY[type];
  return def ? def.defaultZone : 'center_spotlight';
}

export function stageHeightForType(type: MotionEventType, zone: MotionZone): number {
  if (type === 'bento_grid' || zone === 'full_takeover') return 100;
  if (zone === 'top_stage') return 38;
  if (zone === 'bottom_stage') return 34;
  return 0;
}
