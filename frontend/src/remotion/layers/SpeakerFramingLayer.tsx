import React from 'react';
import { DynamicThemeTokens } from '../../types';

interface SpeakerFramingLayerProps {
  framingLayout: 'single' | 'split' | 'trio_rotate';
  safeVideoUrl: string;
  safeMediaVolume: number;
  computedVideoFilter: string;
  splitTopPan: number;
  splitBottomPan: number;
  splitZoom: number;
  trioLeftPan: number;
  trioRightPan: number;
  animatedTopPct: number;
  animatedHeightPct: number;
  subtleCameraZoom: number;
  resolvedPan: number;
  verticalHeadFocusPct: number;
  isTopStage: boolean;
  isBottomStage: boolean;
  morphProgress: number;
  theme: DynamicThemeTokens;
  VideoEngine: React.ComponentType<any>;
}

export const SpeakerFramingLayer: React.FC<SpeakerFramingLayerProps> = ({
  framingLayout,
  safeVideoUrl,
  safeMediaVolume,
  computedVideoFilter,
  splitTopPan,
  splitBottomPan,
  splitZoom,
  trioLeftPan,
  trioRightPan,
  animatedTopPct,
  animatedHeightPct,
  subtleCameraZoom,
  resolvedPan,
  verticalHeadFocusPct,
  isTopStage,
  isBottomStage,
  morphProgress,
  theme,
  VideoEngine,
}) => {
  if (framingLayout === 'trio_rotate') {
    return (
      <div
        style={{ top: 0, left: 0, width: '100%', height: '100%' }}
        className="absolute z-10 overflow-hidden"
      >
        {/* Top Primary Speaker (Top 56%) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '55.8%',
            overflow: 'hidden',
            borderBottom: `2px solid ${theme.accentPrimary || '#06b6d4'}`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${splitZoom})`,
              transformOrigin: `${splitTopPan}% 50%`,
            }}
          >
            <VideoEngine
              src={safeVideoUrl}
              volume={safeMediaVolume}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `${splitTopPan}% 50%`,
                filter: computedVideoFilter,
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              padding: '3px 8px',
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.65)',
              border: `1px solid ${theme.accentPrimary || '#06b6d4'}`,
              color: theme.accentPrimary || '#06b6d4',
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Active Speaker
          </div>
        </div>

        {/* Bottom Left Secondary Speaker (Bottom 44%, Left 49.8%) */}
        <div
          style={{
            position: 'absolute',
            top: '56.2%',
            left: 0,
            width: '49.8%',
            height: '43.8%',
            overflow: 'hidden',
            borderRight: `2px solid ${theme.accentPrimary || '#06b6d4'}`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${splitZoom})`,
              transformOrigin: `${trioLeftPan}% 50%`,
            }}
          >
            <VideoEngine
              src={safeVideoUrl}
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `${trioLeftPan}% 50%`,
                filter: computedVideoFilter,
              }}
            />
          </div>
        </div>

        {/* Bottom Right Secondary Speaker (Bottom 44%, Right 49.8%) */}
        <div
          style={{
            position: 'absolute',
            top: '56.2%',
            left: '50.2%',
            width: '49.8%',
            height: '43.8%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${splitZoom})`,
              transformOrigin: `${trioRightPan}% 50%`,
            }}
          >
            <VideoEngine
              src={safeVideoUrl}
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `${trioRightPan}% 50%`,
                filter: computedVideoFilter,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (framingLayout === 'split') {
    return (
      <div
        style={{ top: 0, left: 0, width: '100%', height: '100%' }}
        className="absolute z-10 overflow-hidden"
      >
        {/* Top Speaker Viewport (Top 50%) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '49.8%',
            overflow: 'hidden',
            borderBottom: `2px solid ${theme.accentPrimary || '#06b6d4'}`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${splitZoom})`,
              transformOrigin: `${splitTopPan}% 50%`,
            }}
          >
            <VideoEngine
              src={safeVideoUrl}
              volume={safeMediaVolume}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `${splitTopPan}% 50%`,
                filter: computedVideoFilter,
              }}
            />
          </div>
        </div>

        {/* Bottom Speaker Viewport (Bottom 50%) */}
        <div
          style={{
            position: 'absolute',
            top: '50.2%',
            left: 0,
            width: '100%',
            height: '49.8%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${splitZoom})`,
              transformOrigin: `${splitBottomPan}% 50%`,
            }}
          >
            <VideoEngine
              src={safeVideoUrl}
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `${splitBottomPan}% 50%`,
                filter: computedVideoFilter,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Single Frame Camera Auto-Pan & Zoom
  return (
    <div
      style={{
        top: `${animatedTopPct.toFixed(2)}%`,
        left: 0,
        width: '100%',
        height: `${animatedHeightPct.toFixed(2)}%`,
      }}
      className="absolute z-10 overflow-hidden"
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${subtleCameraZoom.toFixed(4)})`,
          transformOrigin: `${resolvedPan}% 40%`,
          borderTopWidth: isTopStage && morphProgress > 0.2 ? '4px' : '0px',
          borderBottomWidth: isBottomStage && morphProgress > 0.2 ? '4px' : '0px',
          borderColor: theme.accentPrimary,
        }}
      >
        <VideoEngine
          src={safeVideoUrl}
          volume={safeMediaVolume}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${resolvedPan}% ${verticalHeadFocusPct.toFixed(1)}%`,
            filter: computedVideoFilter,
          }}
        />
      </div>
    </div>
  );
};
