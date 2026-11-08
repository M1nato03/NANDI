import { useId, type CSSProperties } from 'react';
import { containFit, FRIEND_AREA, FRIEND_IDS, pointOnScreen, rectOnScreen, type Rect, type StageAnchors, type StageFit } from '../../core/courtyard/anchors';
import type { AreaId, CourtyardState, Phase } from '../../core/courtyard/courtyard';
import { poseFor } from '../../core/courtyard/courtyard';
import { K_GROWTH } from '../../core/courtyard/layoutB';
import { Cast } from '../cast/Cast';
import { C, Door, Lanterns, PARTS, Sky, TINT, Toran, Tree, WallBand, type PartId } from './Scene';
import { PROP_PARTS } from './layoutBParts';
import { StageFriends } from './StageFriends';

/**
 * Spec 571 §0.19 layout B, stage 2 (b2, 8 Nov): today's Scene.tsx parts at the painted pass's positions. The whole
 * screen is the pass's canvas (360 × 840 CSS at 360 wide): the sky, the wall band from the coping, the door under the
 * toran, the neem on its platform, each corner part contain-fitted into its prop rect (bottom-centred, aspect kept),
 * the friends at their foot points, and one tap per friend on top. The fit (homeFit) decides the crop.
 *
 * Not in the anchor file yet, so taken from the pass's own plate (check-360-s5-p9p.png) and named here: the wall foot,
 * the door's rect and the neem platform's centre. The painted contract's full-layer brief should carry them.
 */
const COPING = 305;
export const WALL_FOOT = 370;
export const DOOR_RECT: Rect = [85.5, 323, 50.5, 62];
export const TREE_AT: [number, number] = [180, 377];
const TREE_SCALE = 1.3;
const DOOR_BOX: Rect = [94, 81, 42, 49];
const TORAN_BOX: Rect = [94, 83, 42, 10];
const LANTERNS_BOX: Rect = [10, 137, 111, 13];

/** The canvas-CSS rect of a prop (the file gives canvas px). */
const css = (rect: Rect): Rect => [rect[0] / 3, rect[1] / 3, rect[2] / 3, rect[3] / 3];
const placed = (box: Rect, rect: Rect) => { const fit = containFit(box, rect); return `translate(${fit.x} ${fit.y}) scale(${fit.k})`; };

export interface LayoutBProps {
  anchors: StageAnchors; fit: StageFit; width: number; height: number;
  state: CourtyardState; phase: Phase; onFriend: (id: AreaId) => void;
}

export function LayoutBScene({ anchors, fit, width, height, state, phase, onFriend }: LayoutBProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const stageOf = (area: AreaId) => state.areas.find(row => row.id === area)?.stage ?? 0;
  const parts = PROP_PARTS.filter(row => stageOf(row.area) >= row.from && anchors.props[row.prop])
    .map(row => ({ ...row, rect: css(anchors.props[row.prop]!) }))
    .sort((a, b) => a.rect[1] + a.rect[3] - (b.rect[1] + b.rect[3]));
  // Canvas CSS → screen: the fit's scale is per canvas px, so a canvas CSS unit is 3 of them.
  const unit = fit.scale * 3;
  const headerCss = anchors.headerBottom / 3;
  // The sun, moon and clouds sit in the sky that is actually seen, just under the header.
  const bodies = (headerCss / fit.scale + fit.cropTop) / 3;
  const tint = TINT[phase];
  const toranRect = anchors.props['spec-24-toran'];
  const lanternRect = anchors.props['spec-15-lanterns'];
  return <div className={`courtyard-b courtyard-${phase}`} style={{ width, height } as CSSProperties}>
    <svg className="courtyard-b-scene" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <g transform={`translate(${fit.offsetX} ${-fit.cropTop * fit.scale}) scale(${unit})`}>
        <rect x={-2000} y={-2000} width={4360} height={2000 + COPING} fill={`url(#${id}sky)`} />
        <g transform={`translate(0 ${bodies})`}><Sky phase={phase} id={id} height={0} /></g>
        <rect x={-2000} y={WALL_FOOT} width={4360} height={4000} fill={C.floor} />
        <path d={`${Array.from({ length: 30 }, (_, i) => `M-2000 ${WALL_FOOT + 26 + i * 26}h4360`).join('')}M60 ${WALL_FOOT}l-60 800M140 ${WALL_FOOT}l-24 800M220 ${WALL_FOOT}l24 800M300 ${WALL_FOOT}l60 800`} stroke={C.floorLine} strokeWidth=".8" opacity=".35" />
        <g transform={`translate(0 ${COPING - 74 * ((WALL_FOOT - COPING) / 56)}) scale(1 ${(WALL_FOOT - COPING) / 56})`}><WallBand door={false} /></g>
        <g transform={placed(DOOR_BOX, DOOR_RECT)}><Door /></g>
        {toranRect && <g transform={placed(TORAN_BOX, css(toranRect))}><Toran count={state.toran} /></g>}
        <g transform={`translate(${TREE_AT[0] - 180 * TREE_SCALE} ${TREE_AT[1] - 132 * TREE_SCALE}) scale(${TREE_SCALE})`}><Tree stage={state.treeStage} k={K_GROWTH[state.treeStage]} /></g>
        {lanternRect && state.lanterns > 0 && <g transform={placed(LANTERNS_BOX, css(lanternRect))}><Lanterns count={state.lanterns} /></g>}
        {parts.map(row => <g key={row.prop} className="courtyard-part" data-prop={row.prop} data-part={row.part} transform={placed(PARTS[row.part as PartId].box, row.rect)}>{PARTS[row.part as PartId].draw()}</g>)}
        {tint && <rect x={-2000} y={-2000} width={4360} height={6000} fill={tint} />}
      </g>
    </svg>
    <div className="courtyard-b-friends" aria-hidden="true">
      {FRIEND_IDS.map(friendId => {
        const area = state.areas.find(row => row.id === FRIEND_AREA[friendId]);
        if (!area) return null;
        const [, , , tapH] = rectOnScreen(fit, anchors.friends[friendId].tap);
        const [fx, fy] = pointOnScreen(fit, anchors.friends[friendId].foot);
        const size = tapH;
        return <span key={friendId} className="courtyard-b-friend" data-friend={area.friend} style={{ left: fx - size / 2, top: fy - size * 0.95, width: size }}>
          <Cast name={area.friend} pose={poseFor(area.today, phase)} size={size} />
        </span>;
      })}
    </div>
    <StageFriends anchors={anchors} fit={fit} areas={state.areas} onFriend={onFriend} />
  </div>;
}
