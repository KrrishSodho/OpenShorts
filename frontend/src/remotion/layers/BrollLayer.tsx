import React from 'react';
import { Sequence, Loop, interpolate } from 'remotion';
import { CompiledSceneBeat } from '../../types';

interface BrollLayerProps {
  brollScenes: CompiledSceneBeat[];
  fps: number;
  durationInFrames: number;
  brollLoopFrames: number;
  enterSpring: number;
  resolveUrl: (pathOrUrl: string | null | undefined) => string;
  VideoEngine: React.ComponentType<any>;
}

export const BrollLayer: React.FC<BrollLayerProps> = ({
  brollScenes,
  fps,
  durationInFrames,
  brollLoopFrames,
  enterSpring,
  resolveUrl,
  VideoEngine,
}) => {
  if (brollScenes.length === 0) return null;

  return (
    <>
      {brollScenes.map((sc) => {
        const fromFrame = Math.max(0, Math.round(sc.start * fps));
        const durFrames = Math.max(20, Math.round((sc.end - sc.start) * fps));
        if (fromFrame >= durationInFrames || !sc.brollUrl) return null;
        const safeDur = Math.min(durFrames, durationInFrames - fromFrame);
        const isSplit = sc.type === 'broll_split';

        return (
          <Sequence
            key={`broll_${sc.id}`}
            from={fromFrame}
            durationInFrames={safeDur}
          >
            <div
              style={
                isSplit
                  ? {
                      top: 0,
                      height: '38%',
                      padding: '24px 20px 10px 20px',
                    }
                  : undefined
              }
              className={
                isSplit
                  ? 'absolute inset-x-0 z-20 overflow-hidden pointer-events-none'
                  : 'absolute inset-0 z-20 overflow-hidden bg-black pointer-events-none'
              }
            >
              <div
                className={
                  isSplit
                    ? 'w-full h-full rounded-2xl overflow-hidden relative bg-black shadow-2xl border border-white/20'
                    : 'w-full h-full overflow-hidden relative'
                }
              >
                <Loop durationInFrames={brollLoopFrames}>
                  <VideoEngine
                    src={resolveUrl(sc.brollUrl)}
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: `scale(${interpolate(enterSpring, [0, 1], [1.0, 1.08]).toFixed(4)})`,
                    }}
                  />
                </Loop>
              </div>
            </div>
          </Sequence>
        );
      })}
    </>
  );
};
