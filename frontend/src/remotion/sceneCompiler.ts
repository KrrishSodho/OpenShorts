import {
  TranscriptWord,
  MotionEvent,
  CompiledSceneBeat,
  MotionEventType,
  MotionZone,
  MotionTransition,
  SfxType,
} from '../types';
import { defaultZoneForType, stageHeightForType } from './archetypes/registry';

const VALID_SFX = new Set<SfxType>([
  'none',
  'whoosh',
  'pop',
  'click',
  'chime',
  'riser',
  'blip',
  'shutter',
  'sub_hit',
]);
const VALID_ZONES = new Set<MotionZone>([
  'top_stage',
  'center_spotlight',
  'bottom_stage',
  'floating_overlay',
  'full_takeover',
]);
const VALID_TRANSITIONS = new Set<MotionTransition>([
  'spring_slam',
  'curtain_wipe',
  'slide_left',
  'glitch_flash',
  'type_reveal',
]);

function sanitizeSfx(raw: unknown): SfxType {
  const s = String(raw || 'whoosh').toLowerCase().trim();
  if (s === 'none' || s === 'silent') return 'none';
  if (s === 'tick' || s === 'tap') return 'click';
  if (s === 'boom' || s === 'drop' || s === 'hit') return 'sub_hit';
  if (s === 'snap') return 'shutter';
  if (VALID_SFX.has(s as SfxType)) return s as SfxType;
  return 'whoosh';
}

function unwrapLabelAndSub(raw: unknown): { label: string; sub: string } {
  if (!raw) return { label: '', sub: '' };
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      label: String(obj.label ?? obj.text ?? obj.title ?? obj.name ?? '').trim(),
      sub: String(obj.sub ?? obj.subtext ?? obj.detail ?? '').trim(),
    };
  }
  const str = String(raw).trim();
  if (str.startsWith('{') && str.endsWith('}')) {
    const labelMatch = str.match(/['"]label['"]\s*:\s*['"]([^'"]+)['"]/i);
    const subMatch = str.match(/['"]sub(?:text)?['"]\s*:\s*['"]([^'"]+)['"]/i);
    if (labelMatch || subMatch) {
      return {
        label: (labelMatch?.[1] || '').trim(),
        sub: (subMatch?.[1] || '').trim(),
      };
    }
  }
  return { label: str, sub: '' };
}

function normalizeToken(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w]/g, '');
}

function findAnchorWordTime(
  triggerPhrase: string,
  focusWord: string,
  targetTime: number,
  words: TranscriptWord[]
): number | null {
  if (!words || words.length === 0) return null;

  const phraseTokens = triggerPhrase
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
  const singleFocus = normalizeToken(focusWord);

  if (phraseTokens.length > 0) {
    const phraseLen = phraseTokens.length;
    let bestDist = Infinity;
    let bestStart: number | null = null;

    for (let i = 0; i <= words.length - phraseLen; i++) {
      let matches = true;
      for (let j = 0; j < phraseLen; j++) {
        if (normalizeToken(words[i + j].word) !== phraseTokens[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        const dist = Math.abs(words[i].start - targetTime);
        if (dist < bestDist) {
          bestDist = dist;
          bestStart = words[i].start;
        }
      }
    }

    if (bestStart !== null && bestDist <= 4.0) {
      return Math.max(0, +(bestStart - 0.06).toFixed(2));
    }
  }

  if (singleFocus && singleFocus.length >= 4) {
    let bestDist = Infinity;
    let bestStart: number | null = null;

    for (const w of words) {
      if (normalizeToken(w.word) === singleFocus) {
        const dist = Math.abs(w.start - targetTime);
        if (dist < bestDist) {
          bestDist = dist;
          bestStart = w.start;
        }
      }
    }

    if (bestStart !== null && bestDist <= 3.0) {
      return Math.max(0, +(bestStart - 0.06).toFixed(2));
    }
  }

  return null;
}

export function compileDynamicSceneGraph(
  words: TranscriptWord[],
  motionEvents: MotionEvent[],
  clipTitle: string,
  totalDurationSec: number
): CompiledSceneBeat[] {
  const safeWords = Array.isArray(words) ? words : [];
  const safeTotalDuration = Math.max(1.0, Number(totalDurationSec) || 60);

  if (motionEvents && motionEvents.length > 0) {
    const sortedEvents = [...motionEvents]
      .filter((ev) => ev.type !== 'clean_speaker')
      .sort((a, b) => Number(a.time_sec || 0) - Number(b.time_sec || 0));

    const mapped: CompiledSceneBeat[] = sortedEvents.map((ev, idx) => {
      let type: MotionEventType = ev.type || 'editorial_split';
      if ((type as string) === 'ui_checklist') type = 'spec_versus';

      const rawZone = String(ev.zone || '').toLowerCase().trim() as MotionZone;
      const zone: MotionZone = VALID_ZONES.has(rawZone) ? rawZone : defaultZoneForType(type);

      const rawTrans = String(ev.transition || '').toLowerCase().trim() as MotionTransition;
      const transition: MotionTransition = VALID_TRANSITIONS.has(rawTrans)
        ? rawTrans
        : 'spring_slam';

      const stageHeightPct = stageHeightForType(type, zone);

      const leftParsed = unwrapLabelAndSub(ev.left_item);
      const rightParsed = unwrapLabelAndSub(ev.right_item);
      const valParsed = unwrapLabelAndSub(ev.value);
      const textParsed = unwrapLabelAndSub(ev.text || (ev as unknown as Record<string, unknown>).headline as string | undefined);
      const labelParsed = unwrapLabelAndSub(ev.label);
      const subParsed = unwrapLabelAndSub(ev.subtext);

      const focusWord = (valParsed.label || leftParsed.label || (ev as any).focus_word || textParsed.label || '').toUpperCase().trim();
      const leftLabel = (leftParsed.label || focusWord || '').toUpperCase().trim();
      const rightLabel = (rightParsed.label || '').toUpperCase().trim();

      const rawItems = Array.isArray(ev.items) ? ev.items : [];
      const cleanedItems = rawItems
        .map((it) => {
          const p = unwrapLabelAndSub(it);
          return (p.sub || p.label).toUpperCase().trim();
        })
        .filter(Boolean);

      const rawKws = Array.isArray(ev.keywords) ? ev.keywords : [];
      const cleanedKws = rawKws
        .map((k) => unwrapLabelAndSub(k).label.toUpperCase().trim())
        .filter(Boolean);

      // Unify explicit user steps across items and keywords
      const userSteps =
        cleanedItems.length > 0
          ? cleanedItems
          : cleanedKws.length > 0
          ? cleanedKws
          : [];

      const headlineStr =
        idx === 0 && Number(ev.time_sec || 0) < 0.8 && clipTitle && !textParsed.label
          ? clipTitle
          : textParsed.label || '';

      const finalItems =
        userSteps.length > 0
          ? userSteps
          : [
              (leftParsed.sub || leftLabel).toUpperCase(),
              (rightParsed.sub || rightLabel).toUpperCase(),
            ].filter(Boolean);

      const headlineTokens = headlineStr
        .split(/\s+/)
        .map((w) => w.trim().replace(/[^a-zA-Z0-9']/g, ''))
        .filter((w) => w.length >= 1)
        .map((w) => w.toUpperCase());

      const derivedKws =
        headlineTokens.length > 0
          ? headlineTokens.slice(0, 5)
          : userSteps.length > 0
          ? userSteps
          : ['KEY', 'POINT'];

      const rawStart = Math.max(0, Number(ev.time_sec || 0));
      const wordSnappedStart =
        idx > 0
          ? findAnchorWordTime(
              String(ev.trigger_phrase || ''),
              focusWord,
              rawStart,
              safeWords
            )
          : null;

      const start =
        wordSnappedStart !== null && Math.abs(wordSnappedStart - rawStart) <= 0.6
          ? wordSnappedStart
          : rawStart;
      const dur = Math.max(1.8, Math.min(5.0, Number(ev.duration_sec || 2.4)));
      const rawEnd = +(start + dur).toFixed(2);
      const end = Math.max(start + 0.3, Math.min(safeTotalDuration, rawEnd));

      const slice = safeWords.filter((w) => w.start >= start - 0.15 && w.start <= end + 0.15);

      return {
        id: `ai_scene_${idx}_${start}`,
        index: idx,
        start,
        end,
        type,
        zone,
        transition,
        headline: headlineStr,
        focusWord,
        tag: (labelParsed.label || '').toUpperCase().trim(),
        subtext: (subParsed.label || '').toUpperCase(),
        metricValue: (valParsed.label || focusWord).toUpperCase(),
        leftLabel,
        rightLabel,
        leftRatio: ev.left_ratio ?? null,
        rightRatio: ev.right_ratio ?? null,
        checklistItems: finalItems,
        keywords: derivedKws,
        chartValues:
          ev.chart_values && ev.chart_values.length > 0
            ? ev.chart_values
            : [],
        vectorNodes: Array.isArray(ev.vector_nodes) ? ev.vector_nodes : [],
        vectorLinks: Array.isArray(ev.vector_links) ? ev.vector_links : [],
        stageHeightPct,
        brollUrl: ev.broll_url || null,
        sfxType: sanitizeSfx(ev.sfx_type),
        bwFilter: Boolean(ev.bw_filter),
        zoom: Boolean(ev.zoom),
        accentColor: ev.accent_color || null,
        textColor: ev.text_color || null,
        bgColor: ev.bg_color || null,
        surfaceStyle: ev.surface_style || 'auto',
        textSize: ev.text_size || '1.0x',
        custom_x: ev.custom_x ?? null,
        custom_y: ev.custom_y ?? null,
        custom_scale: ev.custom_scale ?? null,
        customSceneCode: ev.custom_scene_code || null,
        customSceneCompiled: ev.custom_scene_compiled || null,
        proceduralScene: ev.procedural_scene || null,
        wordsInBeat: slice,
      };
    });

    mapped.sort((a, b) => a.start - b.start);
    for (let i = 0; i < mapped.length; i++) {
      const beat = mapped[i];
      const maxPossibleEnd =
        i < mapped.length - 1
          ? Math.max(beat.start + 1.2, mapped[i + 1].start - 0.05)
          : safeTotalDuration;
      const desiredEnd = +(beat.start + Math.max(1.5, Math.min(5.0, beat.end - beat.start))).toFixed(2);
      beat.end = Math.min(safeTotalDuration, Math.min(desiredEnd, maxPossibleEnd));
      beat.wordsInBeat = safeWords.filter((w) => w.start >= beat.start - 0.15 && w.start <= beat.end + 0.15);
    }

    // Single Source of Truth: Only add opening title beat when NO other beats exist
    if (mapped.length === 0 && clipTitle && clipTitle.trim()) {
      mapped.push({
        id: 'opening_hook_only',
        index: 0,
        start: 0.0,
        end: Math.min(safeTotalDuration, 2.5),
        type: 'word_hit',
        zone: 'center_spotlight',
        transition: 'spring_slam',
        headline: clipTitle.trim(),
        focusWord: '',
        tag: '',
        subtext: '',
        metricValue: '',
        leftLabel: '',
        rightLabel: '',
        leftRatio: null,
        rightRatio: null,
        checklistItems: [],
        keywords: [],
        chartValues: [],
        vectorNodes: [],
        vectorLinks: [],
        stageHeightPct: 0,
        brollUrl: null,
        sfxType: 'whoosh',
        bwFilter: false,
        zoom: false,
        wordsInBeat: safeWords.filter((w) => w.start <= 2.5),
      });
    }

    mapped.forEach((b, i) => {
      b.index = i;
    });

    return mapped;
  }

  if (clipTitle && clipTitle.trim()) {
    return [
      {
        id: 'opening_hook_only',
        index: 0,
        start: 0.0,
        end: Math.min(safeTotalDuration, 2.5),
        type: 'word_hit',
        zone: 'center_spotlight',
        transition: 'spring_slam',
        headline: clipTitle.trim(),
        focusWord: '',
        tag: '',
        subtext: '',
        metricValue: '',
        leftLabel: '',
        rightLabel: '',
        leftRatio: null,
        rightRatio: null,
        checklistItems: [],
        keywords: [],
        chartValues: [],
        vectorNodes: [],
        vectorLinks: [],
        stageHeightPct: 0,
        brollUrl: null,
        sfxType: 'whoosh',
        bwFilter: false,
        zoom: false,
        wordsInBeat: safeWords.filter((w) => w.start <= 2.5),
      },
    ];
  }

  return [];
}