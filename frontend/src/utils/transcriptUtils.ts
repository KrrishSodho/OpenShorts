import { TranscriptWord } from '../types';

export function getWordsInTimeRange(
  words: TranscriptWord[],
  startTime: number,
  endTime: number,
  pad = 0.15
): TranscriptWord[] {
  if (!Array.isArray(words)) return [];
  return words.filter((w) => w.start >= startTime - pad && w.start <= endTime + pad);
}

export function searchTranscriptWords(
  words: TranscriptWord[],
  query: string
): TranscriptWord[] {
  if (!query || !query.trim() || !Array.isArray(words)) return [];
  const q = query.toLowerCase().trim();
  return words.filter((w) => w.word.toLowerCase().includes(q));
}
