import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  text: string;
  color?: string;
  startFrame?: number;
}

export const BehindHeadTypography: React.FC<Props> = ({
  text,
  color = '#FFFFFF',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);

  // High-impact spring scale pop
  const scale = spring({
    frame: relFrame,
    fps,
    config: {
      damping: 12,
      mass: 0.5,
      stiffness: 180,
    },
  });

  const opacity = interpolate(relFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div className="absolute top-[18%] inset-x-0 flex flex-col items-center justify-center select-none pointer-events-none z-10">
      <h1
        className="text-[120px] font-black uppercase tracking-tighter leading-none text-center font-impact"
        style={{
          color: color,
          transform: `scale(${scale})`,
          opacity: opacity,
          textShadow: '0 10px 40px rgba(0,0,0,0.8), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
        }}
      >
        {text}
      </h1>
    </div>
  );
};
