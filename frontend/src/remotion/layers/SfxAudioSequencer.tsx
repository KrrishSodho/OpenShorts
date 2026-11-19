import React from 'react';
import { Sequence, Audio } from 'remotion';
import { CompiledSceneBeat } from '../../types';

interface SfxAudioSequencerProps {
  sfxEnabled: boolean;
  sfxVolume: number;
  cleanSpeakerMode: boolean;
  sceneGraph: CompiledSceneBeat[];
  fps: number;
  durationInFrames: number;
  resolveUrl: (pathOrUrl: string | null | undefined) => string;
}

export const SfxAudioSequencer: React.FC<SfxAudioSequencerProps> = ({
  sfxEnabled,
  sfxVolume,
  cleanSpeakerMode,
  sceneGraph,
  fps,
  durationInFrames,
  resolveUrl,
}) => {
  if (!sfxEnabled || sfxVolume <= 0 || cleanSpeakerMode) {
    return null;
  }

  return (
    <>
      {sceneGraph.map((sc) => {
        if (!sc.sfxType || sc.sfxType === 'none') return null;
        const fromFrame = Math.max(0, Math.round(sc.start * fps));
        const durFrames = Math.max(15, Math.round(0.65 * fps));
        if (fromFrame >= durationInFrames) return null;
        const sfxSrc = resolveUrl(`/storage/sfx/${sc.sfxType}.wav`);

        return (
          <Sequence
            key={`sfx_${sc.id}`}
            from={fromFrame}
            durationInFrames={Math.min(durFrames, durationInFrames - fromFrame)}
          >
            <Audio src={sfxSrc} volume={sfxVolume} />
          </Sequence>
        );
      })}
    </>
  );
};
