import React from 'react';
import { CompiledSceneBeat, DynamicThemeTokens, MotionEventType, MotionZone } from '../../types';

export interface ArchetypeComponentProps {
  scene: CompiledSceneBeat;
  theme: DynamicThemeTokens;
  currentTime: number;
  sceneFrame: number;
  sceneTotalFrames: number;
  enterSpring: number;
  secondarySpring: number;
}

export type ArchetypeField =
  | 'tag'
  | 'headline'
  | 'value'
  | 'subtext'
  | 'steps'
  | 'versus'
  | 'broll'
  | 'chart'
  | 'bw_filter'
  | 'trigger_phrase'
  | 'zoom';

export interface ArchetypeDefinition {
  id: MotionEventType;
  label: string;
  description: string;
  defaultZone: MotionZone;
  defaultDuration: number;
  fields: ArchetypeField[];
  Component: React.FC<ArchetypeComponentProps>;
}
