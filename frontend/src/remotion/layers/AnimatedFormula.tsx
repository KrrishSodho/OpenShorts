import React from 'react';
import katex from 'katex';
import { useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface Props {
  formula?: string;
  startFrame?: number;
}

export const AnimatedFormula: React.FC<Props> = ({
  formula = "\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V",
  startFrame = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);
  if (frame < startFrame) return null;

  const scale = spring({
    frame: relFrame,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const html = katex.renderToString(formula, {
    displayMode: true,
    throwOnError: false,
  });

  return (
    <div 
      className="absolute top-[35%] inset-x-8 bg-slate-900/90 border-2 border-cyan-400 p-6 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-none z-25 text-center"
      style={{ transform: `scale(${scale})` }}
    >
      <div className="text-xs font-mono text-cyan-400 font-bold mb-2 uppercase tracking-widest">
        MATHEMATICAL DERIVATION // ATTENTION
      </div>
      <div 
        className="text-2xl text-white overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </div>
  );
};
