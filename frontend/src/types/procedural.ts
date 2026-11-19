// PATH: frontend/src/types/procedural.ts
/**
 * Procedural Motion Engine Type Definitions (v2.0)
 *
 * Declarative Scene Graph Primitives for procedural design calculation
 * and Remotion rendering without hardcoded glass template cards or generated TSX.
 */

export type VisualIntent =
  | 'focal_statement'
  | 'comparison'
  | 'sequence'
  | 'stat_callout'
  | 'verbatim_quote'
  | 'relationship_tree';

export type NarrativeRole =
  | 'hook'
  | 'setup'
  | 'turn'
  | 'payoff'
  | 'emphasis';

export type NodeRole =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'label'
  | 'counterpart';

export type ConnectorType =
  | 'arrow'
  | 'line'
  | 'vs_divider'
  | 'bracket';

export type BackdropStyle =
  | 'minimal_blur'
  | 'dark_scrim'
  | 'editorial_paper'
  | 'none';

export type SpatialZone =
  | 'safe_center'
  | 'top_third'
  | 'lower_third'
  | 'full_canvas';

export interface ProceduralMetric {
  value: number | string;
  unit?: string;
  display_text: string;
  scale_min?: number;
  scale_max?: number;
  is_percentage?: boolean;
}

export interface ProceduralNode {
  id: string;
  role: NodeRole;
  text: string;
  metric?: ProceduralMetric;
  anchor_word_idx?: number;
  anchor_time_sec?: number;
  reveal_delay_sec?: number;
}

export interface ProceduralConnector {
  from_id: string;
  to_id: string;
  type: ConnectorType;
  label?: string;
}

export interface ProceduralScene {
  version: '2.0';
  scene_id: string;
  time_sec: number;
  duration_sec: number;
  narrative_role: NarrativeRole;
  purpose: string;
  visual_intent: VisualIntent;
  word_range: [number, number];
  nodes: ProceduralNode[];
  connectors?: ProceduralConnector[];
  spatial_zone?: SpatialZone;
  backdrop_style?: BackdropStyle;
}

/**
 * Solved Spatial Layout (Output of LayoutSolver)
 */
export interface SolvedNodeBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  node: ProceduralNode;
  fontSize: number;
  lineHeight: number;
  revealFrame: number;
  opacity: number;
}

export interface SolvedConnectorPath {
  from_id: string;
  to_id: string;
  type: ConnectorType;
  pathD: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label?: string;
  labelX?: number;
  labelY?: number;
  revealFrame: number;
}

export interface SolvedSceneLayout {
  scene_id: string;
  visual_intent: VisualIntent;
  containerBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  nodes: SolvedNodeBox[];
  connectors: SolvedConnectorPath[];
  backdrop_style: BackdropStyle;
  score: number;
}
