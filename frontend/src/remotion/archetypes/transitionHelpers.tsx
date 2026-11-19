import React from 'react';
import { interpolate } from 'remotion';
import { DynamicThemeTokens, MotionTransition } from '../../types';

export function getTransitionWrapperStyle(
  transition: MotionTransition,
  enterSpring: number,
  sceneFrame: number
): React.CSSProperties {
  if (transition === 'slide_left') {
    const tx = interpolate(enterSpring, [0, 1], [140, 0]);
    return { transform: `translateX(${tx}px)`, opacity: Math.min(1, enterSpring * 1.2) };
  }
  if (transition === 'curtain_wipe') {
    const clipRight = interpolate(enterSpring, [0, 1], [100, 0]);
    return { clipPath: `inset(0 ${clipRight.toFixed(1)}% 0 0)` };
  }
  if (transition === 'glitch_flash') {
    const jitter = sceneFrame < 5 ? (sceneFrame % 2 === 0 ? -12 : 12) : 0;
    return {
      transform: `translateX(${jitter}px) scale(${interpolate(enterSpring, [0, 1], [1.06, 1])})`,
    };
  }
  if (transition === 'type_reveal') {
    const ty = interpolate(enterSpring, [0, 1], [35, 0]);
    return { transform: `translateY(${ty}px)`, opacity: Math.min(1, enterSpring) };
  }
  const scale = interpolate(enterSpring, [0, 1], [0.84, 1]);
  return { transform: `scale(${scale})`, opacity: Math.min(1, enterSpring * 1.2) };
}

export const DynamicMetricDisplay: React.FC<{
  metricValue: string;
  progress: number;
  theme: DynamicThemeTokens;
}> = ({ metricValue, progress, theme }) => {
  const parts = (metricValue || '').trim().split(/\s+/);
  const isLong = metricValue.length > 8;

  return (
    <div className="inline-flex items-baseline flex-wrap gap-4 leading-none tracking-tighter">
      {parts.map((part, pIdx) => {
        const isNumericPart = /\d/.test(part);
        if (!isNumericPart) {
          return (
            <span
              key={pIdx}
              style={{ color: theme.accentSecondary || '#FFE600' }}
              className={`font-headline font-black uppercase ${
                isLong ? 'text-[52px]' : 'text-[70px]'
              }`}
            >
              {part}
            </span>
          );
        }

        return (
          <span
            key={pIdx}
            style={{ color: theme.textPrimary }}
            className="inline-flex items-center font-headline font-black"
          >
            {part.split('').map((ch, idx) => {
              if (/\d/.test(ch)) {
                const targetDigit = parseInt(ch, 10);
                const colProg = Math.min(1, Math.max(0, progress * (1 + idx * 0.1)));
                const offset = interpolate(colProg, [0, 1], [0, targetDigit * 10], {
                  extrapolateRight: 'clamp',
                });
                return (
                  <div
                    key={idx}
                    className={`${
                      isLong ? 'h-[76px] w-[46px] text-[76px]' : 'h-[104px] w-[62px] text-[104px]'
                    } overflow-hidden relative inline-block text-center`}
                  >
                    <div
                      style={{ transform: `translateY(-${offset}%)` }}
                      className="flex flex-col"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span
                          key={n}
                          className={`${
                            isLong ? 'h-[76px]' : 'h-[104px]'
                          } flex items-center justify-center`}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <span
                  key={idx}
                  style={{ color: theme.accentSecondary || '#FFE600' }}
                  className={isLong ? 'text-[64px]' : 'text-[84px]'}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
};

export function buildDynamicSvgPath(
  values: number[],
  width: number,
  height: number
): { linePath: string; areaPath: string; lastX: number; lastY: number } {
  const pts = values.length >= 2 ? values : [25, 55, 45, 85];
  const stepX = (width - 24) / Math.max(1, pts.length - 1);

  const coords = pts.map((v, i) => ({
    x: 12 + i * stepX,
    y: height - 16 - (Math.min(100, Math.max(0, v)) / 100) * (height - 32),
  }));

  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const last = coords[coords.length - 1];
  const area = `${d} L ${last.x} ${height - 10} L ${coords[0].x} ${height - 10} Z`;

  return { linePath: d, areaPath: area, lastX: last.x, lastY: last.y };
}
