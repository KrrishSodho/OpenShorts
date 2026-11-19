import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { TranscriptWord, PresetConfig, SubtitleConfig } from '../../types';
import { buildPhrases } from '../captions/phraseBuilder';
import { getSubtitleStyleDefinition } from '../captions/registry';

interface Props {
  words: TranscriptWord[];
  preset?: PresetConfig;
  subtitleConfig?: SubtitleConfig;
  themeAccent?: string;
}

const DEFAULT_CONFIG: SubtitleConfig = {
  style: 'tape_crimson',
  fontSize: 'md',
  position: 'bottom',
  maxWordsPerPhrase: 3,
  uppercase: true,
  highlightColor: 'yellow',
};

export const KineticCaptions: React.FC<Props> = ({
  words,
  subtitleConfig,
  themeAccent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const cfg: SubtitleConfig = subtitleConfig || DEFAULT_CONFIG;
  const phrases = useMemo(
    () => buildPhrases(words, cfg.maxWordsPerPhrase),
    [words, cfg.maxWordsPerPhrase]
  );

  if (phrases.length === 0) return null;

  let activePhrase = phrases.find(
    (p) => currentTime >= p.start - 0.08 && currentTime <= p.end + 0.28
  );

  // Anti-flicker latch: if within a natural speech gap, latch the preceding phrase
  if (!activePhrase) {
    const nextIdx = phrases.findIndex((p) => p.start > currentTime);
    if (nextIdx > 0) {
      const prev = phrases[nextIdx - 1];
      const nextPhrase = phrases[nextIdx];
      if (currentTime - prev.end <= 0.75 && currentTime < nextPhrase.start - 0.06) {
        activePhrase = prev;
      }
    } else if (nextIdx === -1 && phrases.length > 0) {
      const last = phrases[phrases.length - 1];
      if (currentTime - last.end <= 0.5) {
        activePhrase = last;
      }
    }
  }

  if (!activePhrase) return null;

  let activeWordIndex = activePhrase.words.findIndex(
    (w) => currentTime >= w.start - 0.05 && currentTime <= w.end + 0.05
  );
  if (activeWordIndex === -1) {
    if (currentTime >= activePhrase.end) {
      activeWordIndex = activePhrase.words.length - 1;
    } else {
      for (let i = activePhrase.words.length - 1; i >= 0; i--) {
        if (currentTime >= activePhrase.words[i].start) {
          activeWordIndex = i;
          break;
        }
      }
      if (activeWordIndex === -1) activeWordIndex = 0;
    }
  }

  const fontSizePx =
    cfg.fontSize === 'sm' ? 36 : cfg.fontSize === 'lg' ? 50 : 42;

  const formatWord = (w: string) => (cfg.uppercase ? w.toUpperCase() : w);

  const styleDef = getSubtitleStyleDefinition(cfg.style);
  const CaptionComponent = styleDef.Component;

  return (
    <CaptionComponent
      activePhrase={activePhrase}
      activeWordIndex={activeWordIndex}
      currentTime={currentTime}
      fps={fps}
      cfg={cfg}
      themeAccent={themeAccent}
      fontSizePx={fontSizePx}
      formatWord={formatWord}
    />
  );
};
