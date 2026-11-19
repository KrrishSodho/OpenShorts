import React from 'react';
import { CompiledSceneBeat, DynamicThemeTokens } from '../../types';
import { getTransitionWrapperStyle } from '../archetypes/transitionHelpers';
import { getArchetypeDefinition } from '../archetypes/registry';
import { ProceduralStageRenderer } from './ProceduralStageRenderer';

interface StageProps {
  scene: CompiledSceneBeat;
  theme: DynamicThemeTokens;
  currentTime: number;
  sceneFrame: number;
  sceneTotalFrames: number;
  enterSpring: number;
  secondarySpring: number;
}

export const DynamicStageRenderer: React.FC<StageProps> = (props) => {
  const { scene, enterSpring, sceneFrame } = props;

  // Route explicitly designated procedural scenes to Procedural Engine; all archetypes render their full custom Remotion components
  if (scene.type === ('procedural' as any)) {
    return <ProceduralStageRenderer {...props} />;
  }

  const wrapperStyle = getTransitionWrapperStyle(scene.transition, enterSpring, sceneFrame);
  const archetype = getArchetypeDefinition(scene.type);
  const ArchetypeComponent = archetype.Component;

  const hasCustomPos =
    scene.custom_x != null || scene.custom_y != null || scene.custom_scale != null;
  const offsetX = scene.custom_x != null ? (scene.custom_x - 50) * 10.8 : 0;
  const offsetY = scene.custom_y != null ? (scene.custom_y - 50) * 19.2 : 0;
  const scale = scene.custom_scale ?? 1.0;

  const combinedTransform = hasCustomPos
    ? `${wrapperStyle.transform || ''} translate(${offsetX}px, ${offsetY}px) scale(${scale})`
    : wrapperStyle.transform;

  return (
    <div
      style={{
        ...wrapperStyle,
        transform: combinedTransform,
      }}
      className="w-full h-full pointer-events-none"
    >
      <ArchetypeComponent {...props} />
    </div>
  );
};
