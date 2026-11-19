import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { MasterShortComposition } from './MasterShortComposition';
import '../index.css';

export const RemotionRoot: React.FC = () => {
  return React.createElement(Composition, {
    id: 'MasterShortComposition',
    component: MasterShortComposition as any,
    durationInFrames: 3600,
    fps: 60,
    width: 1080,
    height: 1920,
    defaultProps: {
      videoUrl: '',
      words: [],
      preset: {
        id: 'fable_5_2_kinetic',
        name: 'Fable 5.2 Kinetic',
        captions: {
          activeWordColor: '#FFE600',
          inactiveWordColor: '#FFFFFF',
        },
      } as any,
      title: 'VIRAL SHORT',
      topicPill: '[ INSIGHT ]',
      panPercent: 50,
      motionEvents: [],
    },
  });
};

registerRoot(RemotionRoot);
