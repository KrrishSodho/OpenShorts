import { TranscriptWord } from '../../types';
import { CaptionPhrase } from './types';

export function buildPhrases(
  words: TranscriptWord[],
  maxWords: 1 | 2 | 3 | 5 | 7 = 3
): CaptionPhrase[] {
  if (!words || words.length === 0) return [];

  const targetMax = Math.max(1, Math.min(7, Number(maxWords) || 3));
  if (targetMax === 1) {
    return words.map((w) => ({
      words: [w],
      start: w.start,
      end: w.end,
    }));
  }

  const phrases: CaptionPhrase[] = [];
  let currentGroup: TranscriptWord[] = [];
  let charCount = 0;
  const charLimit =
    targetMax === 2 ? 15 : targetMax === 3 ? 24 : targetMax === 5 ? 38 : 52;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const clean = w.word.trim();

    if (currentGroup.length >= 1 && charCount + clean.length + 1 > charLimit) {
      phrases.push({
        words: currentGroup,
        start: currentGroup[0].start,
        end: currentGroup[currentGroup.length - 1].end,
      });
      currentGroup = [];
      charCount = 0;
    }

    currentGroup.push(w);
    charCount += clean.length + 1;

    const next = words[i + 1];
    const hasPunct = /[.!?,;:]$/.test(clean);
    const gap = next ? next.start - w.end : 999;

    const shouldClose =
      currentGroup.length >= targetMax ||
      hasPunct ||
      gap > 0.35 ||
      !next;

    if (shouldClose) {
      phrases.push({
        words: currentGroup,
        start: currentGroup[0].start,
        end: currentGroup[currentGroup.length - 1].end,
      });
      currentGroup = [];
      charCount = 0;
    }
  }

  return phrases;
}
