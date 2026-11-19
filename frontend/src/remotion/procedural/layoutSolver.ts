// PATH: frontend/src/remotion/procedural/layoutSolver.ts
/**
 * Procedural Layout Solver
 *
 * Pure TypeScript mathematical engine that computes measured text boxes,
 * node placements (1-8 nodes), SVG connector paths, collision avoidance,
 * and speech-aligned reveal timing for the Remotion canvas (1080x1920).
 *
 * ZERO hardcoded templates. ZERO eval / new Function().
 */

import {
  ProceduralScene,
  ProceduralNode,
  ProceduralConnector,
  SolvedNodeBox,
  SolvedConnectorPath,
  SolvedSceneLayout,
  VisualIntent,
  BackdropStyle,
} from '../../types/procedural';
import { CompiledSceneBeat } from '../../types/motion';

export interface LayoutSolverOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  hookActive?: boolean;
  captionPosition?: 'bottom' | 'middle' | 'top';
  fps?: number;
}

export interface CanvasSafeBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

/**
 * Compute the safe drawable area for procedural graphics on 9:16 phone video
 */
export function computeSafeBounds(options: LayoutSolverOptions = {}): CanvasSafeBounds {
  const W = options.canvasWidth ?? 1080;
  const H = options.canvasHeight ?? 1920;
  const hookActive = options.hookActive ?? true;
  const captionPos = options.captionPosition ?? 'bottom';

  const minX = 80;
  const maxX = W - 80; // 1000

  // Top clearance: avoid hook title banner (0-240px)
  const minY = hookActive ? 270 : 180;

  // Bottom clearance: avoid auto captions and platform overlay buttons
  let maxY = H - 520; // 1400 by default (captions sit at ~1440-1700)
  if (captionPos === 'top') {
    maxY = H - 240;
  } else if (captionPos === 'middle') {
    maxY = H - 420;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: Math.round(W / 2),
    centerY: Math.round((minY + maxY) / 2),
  };
}

/**
 * Approximate text box width and height based on character count and font tier
 */
function estimateTextDimensions(
  text: string | null | undefined,
  fontSize: number,
  maxWidth: number
): { width: number; height: number; lines: number } {
  const clean = String(text || '').trim();
  if (!clean) return { width: 0, height: 0, lines: 0 };

  // Average character width for bold sans-serif display font is ~0.55 of fontSize
  const charWidth = fontSize * 0.54;
  const charsPerLine = Math.max(1, Math.floor((maxWidth - 48) / charWidth));
  const lines = Math.max(1, Math.ceil(clean.length / charsPerLine));

  const longestLineLen = Math.min(clean.length, charsPerLine);
  const width = Math.min(maxWidth, Math.max(220, Math.round(longestLineLen * charWidth + 56)));
  const lineHeight = Math.round(fontSize * 1.25);
  const height = Math.round(lines * lineHeight + 44);

  return { width, height, lines };
}

/**
 * Solve a single focal statement (1 primary node + optional subtext/secondary node)
 */
function solveFocalStatement(
  scene: ProceduralScene,
  bounds: CanvasSafeBounds,
  fps: number
): { nodes: SolvedNodeBox[]; connectors: SolvedConnectorPath[] } {
  const safeNodes = Array.isArray(scene?.nodes) ? scene.nodes : [];
  const primary = safeNodes[0] || { id: 'node_0', role: 'primary', text: 'KEY TAKEAWAY' };
  const secondary = safeNodes[1];

  const pText = String(primary.text || '');
  let fontSize = 80;
  if (pText.length > 55) fontSize = 52;
  else if (pText.length > 30) fontSize = 64;
  else if (pText.length > 15) fontSize = 74;

  const maxWidth = bounds.maxX - bounds.minX; // 920px
  const pDim = estimateTextDimensions(pText, fontSize, maxWidth);

  let totalHeight = pDim.height;
  let sDim = { width: 0, height: 0, lines: 0 };
  const sFontSize = 38;

  if (secondary && secondary.text) {
    sDim = estimateTextDimensions(String(secondary.text), sFontSize, maxWidth - 80);
    totalHeight += sDim.height + 24;
  }

  const startY = Math.round(bounds.centerY - totalHeight / 2);
  const primaryBox: SolvedNodeBox = {
    id: primary.id || 'node_0',
    x: Math.round(bounds.centerX - pDim.width / 2),
    y: startY,
    width: pDim.width,
    height: pDim.height,
    node: primary,
    fontSize,
    lineHeight: Math.round(fontSize * 1.25),
    revealFrame: 0,
    opacity: 1,
  };

  const solvedNodes: SolvedNodeBox[] = [primaryBox];

  if (secondary && secondary.text) {
    solvedNodes.push({
      id: secondary.id || 'node_1',
      x: Math.round(bounds.centerX - sDim.width / 2),
      y: startY + pDim.height + 20,
      width: sDim.width,
      height: sDim.height,
      node: secondary,
      fontSize: sFontSize,
      lineHeight: Math.round(sFontSize * 1.3),
      revealFrame: Math.round(fps * 0.2), // 6 frames delay
      opacity: 1,
    });
  }

  return { nodes: solvedNodes, connectors: [] };
}

/**
 * Solve a 2-node comparison / contrast layout
 */
function solveComparison(
  scene: ProceduralScene,
  bounds: CanvasSafeBounds,
  fps: number
): { nodes: SolvedNodeBox[]; connectors: SolvedConnectorPath[] } {
  const safeNodes = Array.isArray(scene?.nodes) ? scene.nodes : [];
  const left = safeNodes[0] || { id: 'node_0', role: 'primary', text: 'OPTION A' };
  const right = safeNodes[1] || { id: 'node_1', role: 'counterpart', text: 'OPTION B' };

  const leftLen = String(left.text || '').length;
  const rightLen = String(right.text || '').length;
  const isCompact = leftLen <= 28 && rightLen <= 28;

  const solvedNodes: SolvedNodeBox[] = [];
  const solvedConnectors: SolvedConnectorPath[] = [];

  if (isCompact) {
    // Side-by-side dual columns
    const colWidth = 420;
    const colHeight = 260;
    const leftX = bounds.minX + 20; // 100
    const rightX = bounds.maxX - colWidth - 20; // 560
    const colY = Math.round(bounds.centerY - colHeight / 2);

    const leftBox: SolvedNodeBox = {
      id: left.id || 'node_0',
      x: leftX,
      y: colY,
      width: colWidth,
      height: colHeight,
      node: left,
      fontSize: 48,
      lineHeight: 60,
      revealFrame: 0,
      opacity: 1,
    };

    const rightBox: SolvedNodeBox = {
      id: right.id || 'node_1',
      x: rightX,
      y: colY,
      width: colWidth,
      height: colHeight,
      node: right,
      fontSize: 48,
      lineHeight: 60,
      revealFrame: Math.round(fps * 0.25), // 7-8 frames
      opacity: 1,
    };

    solvedNodes.push(leftBox, rightBox);

    // VS divider pill in center
    solvedConnectors.push({
      from_id: left.id || 'node_0',
      to_id: right.id || 'node_1',
      type: 'vs_divider',
      pathD: `M ${bounds.centerX} ${colY + 20} L ${bounds.centerX} ${colY + colHeight - 20}`,
      startX: leftX + colWidth,
      startY: colY + colHeight / 2,
      endX: rightX,
      endY: colY + colHeight / 2,
      label: 'VS',
      labelX: bounds.centerX,
      labelY: colY + colHeight / 2,
      revealFrame: Math.round(fps * 0.12),
    });
  } else {
    // Stacked vertical cards for longer comparisons
    const cardWidth = 860;
    const cardHeight = 220;
    const topY = bounds.centerY - cardHeight - 35;
    const bottomY = bounds.centerY + 35;
    const cardX = Math.round(bounds.centerX - cardWidth / 2);

    const topBox: SolvedNodeBox = {
      id: left.id || 'node_0',
      x: cardX,
      y: topY,
      width: cardWidth,
      height: cardHeight,
      node: left,
      fontSize: 46,
      lineHeight: 58,
      revealFrame: 0,
      opacity: 1,
    };

    const bottomBox: SolvedNodeBox = {
      id: right.id || 'node_1',
      x: cardX,
      y: bottomY,
      width: cardWidth,
      height: cardHeight,
      node: right,
      fontSize: 46,
      lineHeight: 58,
      revealFrame: Math.round(fps * 0.25),
      opacity: 1,
    };

    solvedNodes.push(topBox, bottomBox);

    solvedConnectors.push({
      from_id: left.id || 'node_0',
      to_id: right.id || 'node_1',
      type: 'vs_divider',
      pathD: `M ${cardX + 40} ${bounds.centerY} L ${cardX + cardWidth - 40} ${bounds.centerY}`,
      startX: bounds.centerX,
      startY: topY + cardHeight,
      endX: bounds.centerX,
      endY: bottomY,
      label: 'VS',
      labelX: bounds.centerX,
      labelY: bounds.centerY,
      revealFrame: Math.round(fps * 0.12),
    });
  }

  return { nodes: solvedNodes, connectors: solvedConnectors };
}

/**
 * Solve a sequence / process flow (2 to 5 nodes with connecting arrows)
 */
function solveSequence(
  scene: ProceduralScene,
  bounds: CanvasSafeBounds,
  fps: number
): { nodes: SolvedNodeBox[]; connectors: SolvedConnectorPath[] } {
  const rawNodes = Array.isArray(scene?.nodes) ? scene.nodes : [];
  const nodes =
    rawNodes.length > 0
      ? rawNodes.slice(0, 5)
      : [{ id: 'node_0', role: 'primary' as const, text: 'STEP 1' }];
  const count = Math.max(1, nodes.length);

  const availableHeight = bounds.maxY - bounds.minY; // ~1130px
  const gap = count <= 3 ? 40 : 24;
  const itemHeight = Math.min(180, Math.max(110, Math.floor((availableHeight - (count - 1) * gap) / count)));
  const totalSpan = count * itemHeight + (count - 1) * gap;
  const startY = Math.round(bounds.centerY - totalSpan / 2);
  const cardWidth = 860;
  const cardX = Math.round(bounds.centerX - cardWidth / 2);

  const solvedNodes: SolvedNodeBox[] = [];
  const solvedConnectors: SolvedConnectorPath[] = [];

  for (let i = 0; i < count; i++) {
    const node = nodes[i] || { id: `node_${i}`, role: 'secondary' as const, text: `STEP ${i + 1}` };
    const y = startY + i * (itemHeight + gap);
    const fontSize = count <= 3 ? 46 : 38;

    const box: SolvedNodeBox = {
      id: node.id || `node_${i}`,
      x: cardX,
      y,
      width: cardWidth,
      height: itemHeight,
      node,
      fontSize,
      lineHeight: Math.round(fontSize * 1.25),
      revealFrame: Math.round(i * (fps * 0.22)), // Stagger ~6-7 frames per step
      opacity: 1,
    };
    solvedNodes.push(box);

    if (i > 0) {
      const prevBox = solvedNodes[i - 1];
      const prevBottom = prevBox.y + prevBox.height;
      const currTop = box.y;
      const arrowX = bounds.centerX;

      solvedConnectors.push({
        from_id: prevBox.id,
        to_id: box.id,
        type: 'arrow',
        pathD: `M ${arrowX} ${prevBottom} L ${arrowX} ${currTop}`,
        startX: arrowX,
        startY: prevBottom,
        endX: arrowX,
        endY: currTop,
        revealFrame: Math.round((i - 0.5) * (fps * 0.22)),
      });
    }
  }

  return { nodes: solvedNodes, connectors: solvedConnectors };
}

/**
 * Solve a stat callout with verified quantitative typography
 */
function solveStatCallout(
  scene: ProceduralScene,
  bounds: CanvasSafeBounds,
  fps: number
): { nodes: SolvedNodeBox[]; connectors: SolvedConnectorPath[] } {
  const safeNodes = Array.isArray(scene?.nodes) ? scene.nodes : [];
  const primary = safeNodes[0] || {
    id: 'node_0',
    role: 'primary',
    text: 'VERIFIED METRIC',
    metric: { value: 100, display_text: '100%' },
  };

  const cardWidth = 860;
  const cardHeight = 320;
  const cardX = Math.round(bounds.centerX - cardWidth / 2);
  const cardY = Math.round(bounds.centerY - cardHeight / 2);

  const box: SolvedNodeBox = {
    id: primary.id || 'node_0',
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    node: primary,
    fontSize: 96,
    lineHeight: 110,
    revealFrame: 0,
    opacity: 1,
  };

  return { nodes: [box], connectors: [] };
}

/**
 * Solve an editorial verbatim quote layout
 */
function solveVerbatimQuote(
  scene: ProceduralScene,
  bounds: CanvasSafeBounds,
  fps: number
): { nodes: SolvedNodeBox[]; connectors: SolvedConnectorPath[] } {
  const safeNodes = Array.isArray(scene?.nodes) ? scene.nodes : [];
  const primary = safeNodes[0] || { id: 'node_0', role: 'primary', text: 'QUOTE' };
  const cardWidth = 860;
  const qDim = estimateTextDimensions(String(primary.text || ''), 52, cardWidth);
  const cardHeight = Math.max(220, qDim.height + 60);

  const cardX = Math.round(bounds.centerX - cardWidth / 2);
  const cardY = Math.round(bounds.centerY - cardHeight / 2);

  const box: SolvedNodeBox = {
    id: primary.id || 'node_0',
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    node: primary,
    fontSize: 50,
    lineHeight: 64,
    revealFrame: 0,
    opacity: 1,
  };

  return { nodes: [box], connectors: [] };
}

/**
 * Collision resolution: push overlapping boxes apart vertically
 */
function resolveCollisions(boxes: SolvedNodeBox[], bounds: CanvasSafeBounds): void {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];

      const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
      const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

      if (xOverlap > 0 && yOverlap > 0) {
        // Nudge apart along Y
        const nudge = Math.ceil(yOverlap / 2) + 12;
        if (a.y <= b.y) {
          a.y = Math.max(bounds.minY, a.y - nudge);
          b.y = Math.min(bounds.maxY - b.height, b.y + nudge);
        } else {
          b.y = Math.max(bounds.minY, b.y - nudge);
          a.y = Math.min(bounds.maxY - a.height, a.y + nudge);
        }
      }
    }
  }

  // Final clamping into safe margins
  for (const box of boxes) {
    box.x = Math.max(bounds.minX, Math.min(bounds.maxX - box.width, box.x));
    box.y = Math.max(bounds.minY, Math.min(bounds.maxY - box.height, box.y));
  }
}

/**
 * Evaluate layout score based on margin clearances, aspect ratio, and overlaps
 */
function scoreLayout(boxes: SolvedNodeBox[], bounds: CanvasSafeBounds): number {
  let score = 100;

  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    // Penalty if touching edge bounds
    if (a.x <= bounds.minX + 5 || a.x + a.width >= bounds.maxX - 5) score -= 10;
    if (a.y <= bounds.minY + 5 || a.y + a.height >= bounds.maxY - 5) score -= 15;

    // Penalty for overlap
    for (let j = i + 1; j < boxes.length; j++) {
      const b = boxes[j];
      const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
      const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
      if (xOverlap > 0 && yOverlap > 0) score -= 30;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Main Layout Solver Entry Point
 */
export function solveProceduralLayout(
  scene: ProceduralScene,
  options: LayoutSolverOptions = {}
): SolvedSceneLayout {
  const bounds = computeSafeBounds(options);
  const fps = options.fps ?? 30;
  const intent = (scene && scene.visual_intent) || 'focal_statement';

  let solvedResult: { nodes: SolvedNodeBox[]; connectors: SolvedConnectorPath[] };

  switch (intent) {
    case 'comparison':
      solvedResult = solveComparison(scene, bounds, fps);
      break;
    case 'sequence':
      solvedResult = solveSequence(scene, bounds, fps);
      break;
    case 'stat_callout':
      solvedResult = solveStatCallout(scene, bounds, fps);
      break;
    case 'verbatim_quote':
      solvedResult = solveVerbatimQuote(scene, bounds, fps);
      break;
    case 'focal_statement':
    default:
      solvedResult = solveFocalStatement(scene, bounds, fps);
      break;
  }

  const nodes = Array.isArray(solvedResult?.nodes) ? solvedResult.nodes : [];
  const connectors = Array.isArray(solvedResult?.connectors) ? solvedResult.connectors : [];

  resolveCollisions(nodes, bounds);
  const score = scoreLayout(nodes, bounds);

  return {
    scene_id: (scene && scene.scene_id) || 'scene_fallback',
    visual_intent: intent,
    containerBox: {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
    },
    nodes,
    connectors,
    backdrop_style: (scene && scene.backdrop_style) || 'minimal_blur',
    score,
  };
}

/**
 * Helper to synthesize a ProceduralScene from a legacy CompiledSceneBeat
 * for 100% backward compatibility.
 */
export function synthesizeProceduralScene(beat: CompiledSceneBeat): ProceduralScene {
  if (!beat) {
    return {
      version: '2.0',
      scene_id: 'empty_beat',
      time_sec: 0,
      duration_sec: 2.0,
      narrative_role: 'emphasis',
      purpose: 'Fallback',
      visual_intent: 'focal_statement',
      word_range: [0, 0],
      nodes: [{ id: 'node_0', role: 'primary', text: '' }],
      connectors: [],
      spatial_zone: 'safe_center',
      backdrop_style: 'minimal_blur',
    };
  }

  if (beat.proceduralScene) {
    return beat.proceduralScene;
  }

  const primaryText = beat.headline || beat.focusWord || '';
  let intent: VisualIntent = 'focal_statement';
  const nodes: ProceduralNode[] = [];
  const connectors: ProceduralConnector[] = [];

  if (beat.type === 'contrast_split' || beat.type === 'spec_versus' || beat.type === 'versus_card') {
    intent = 'comparison';
    nodes.push({
      id: `${beat.id}_left`,
      role: 'primary',
      text: beat.leftLabel || primaryText || 'BEFORE',
    });
    nodes.push({
      id: `${beat.id}_right`,
      role: 'counterpart',
      text: beat.rightLabel || beat.subtext || 'AFTER',
    });
    connectors.push({
      from_id: `${beat.id}_left`,
      to_id: `${beat.id}_right`,
      type: 'vs_divider',
      label: 'VS',
    });
  } else if (
    beat.type === 'process_steps' ||
    (beat.checklistItems && beat.checklistItems.length >= 2)
  ) {
    intent = 'sequence';
    const items = beat.checklistItems.length >= 2 ? beat.checklistItems : [primaryText, beat.subtext].filter(Boolean);
    items.slice(0, 5).forEach((item, idx) => {
      nodes.push({
        id: `${beat.id}_step_${idx}`,
        role: idx === 0 ? 'primary' : 'secondary',
        text: item,
      });
      if (idx > 0) {
        connectors.push({
          from_id: `${beat.id}_step_${idx - 1}`,
          to_id: `${beat.id}_step_${idx}`,
          type: 'arrow',
        });
      }
    });
  } else if (beat.type === 'metric_reveal' || beat.metricValue) {
    intent = 'stat_callout';
    nodes.push({
      id: `${beat.id}_metric`,
      role: 'primary',
      text: primaryText || 'MEASURED STAT',
      metric: {
        value: beat.metricValue || '100',
        display_text: beat.metricValue || '100',
      },
    });
  } else if (beat.type === 'pull_quote' || beat.type === 'quote_editorial_card') {
    intent = 'verbatim_quote';
    nodes.push({
      id: `${beat.id}_quote`,
      role: 'primary',
      text: primaryText.replace(/^["']|["']$/g, ''),
    });
  } else {
    intent = 'focal_statement';
    nodes.push({
      id: `${beat.id}_focal`,
      role: 'primary',
      text: primaryText || 'KEY POINT',
    });
    if (beat.subtext) {
      nodes.push({
        id: `${beat.id}_sub`,
        role: 'secondary',
        text: beat.subtext,
      });
    }
  }

  return {
    version: '2.0',
    scene_id: beat.id,
    time_sec: beat.start,
    duration_sec: Math.max(1.8, beat.end - beat.start),
    narrative_role: 'emphasis',
    purpose: 'Spoken highlight',
    visual_intent: intent,
    word_range: [0, 0],
    nodes,
    connectors,
    spatial_zone: 'safe_center',
    backdrop_style: 'minimal_blur',
  };
}
