import { useId, type CSSProperties } from 'react';
import { containFit, FRIEND_AREA, FRIEND_IDS, pointOnScreen, rectOnScreen, type Rect, type StageAnchors, type StageFit } from '../../core/courtyard/anchors';
import type { AreaId, CourtyardState, Phase } from '../../core/courtyard/courtyard';
import { poseFor } from '../../core/courtyard/courtyard';
import { K_GROWTH } from '../../core/courtyard/layoutB';
import { Cast } from '../cast/Cast';
import { C, Door, Lanterns, PARTS, Sky, TINT, Toran, Tree, type Part, type PartId } from './Scene';
import { DEPTH, LINES, placeAt, type Support } from '../../core/courtyard/support';
import { PROP_PARTS } from './layoutBParts';
import { StageFriends } from './StageFriends';
import { keepsakeSpots, TAG_H, TAG_W, type Keepsake } from '../../core/courtyard/keepsakes';
import { KeepsakeTag, PegBoard } from './Keepsakes';

/**
 * Spec 571 §0.19 layout B, stage 2 (b2, 8 Nov): today's Scene.tsx parts at the painted pass's positions. The whole
 * screen is the pass's canvas (360 × 840 CSS at 360 wide): the sky, the wall band from the coping, the door under the
 * toran, the neem on its platform, each corner part contain-fitted into its prop rect (bottom-centred, aspect kept),
 * the friends at their foot points, and one tap per friend on top. The fit (homeFit) decides the crop.
 *
 * Not in the anchor file yet, so taken from the pass's own plate (check-360-s5-p9p.png) and named here: the door's
 * rect and the neem platform's centre. The painted contract's full-layer brief should carry them. The wall's lines are
 * support.ts LINES (9 Nov hotfix: the wall foot is the door's base line, so the pots stand where the door does).
 */
const COPING = LINES.coping;
export const WALL_FOOT = LINES.wallFoot;
export const DOOR_RECT: Rect = [85.5, 323, 50.5, 62];
export const TREE_AT: [number, number] = [180, 377];
const TREE_SCALE = 1.3;
const DOOR_BOX: Rect = [94, 81, 42, 49];
const TORAN_BOX: Rect = [94, 83, 42, 10];
const LANTERNS_BOX: Rect = [10, 137, 111, 13];
/** The floor's tile lines repeat past the frame's sides (frame mode shows more than 360 wide). */
const FLOOR_LINES = Array.from({ length: 27 }, (_, i) => -900 + i * 80);

/** The canvas-CSS rect of a prop (the file gives canvas px). */
const css = (rect: Rect): Rect => [rect[0] / 3, rect[1] / 3, rect[2] / 3, rect[3] / 3];
const placed = (box: Rect, rect: Rect) => { const fit = containFit(box, rect); return `translate(${fit.x} ${fit.y}) scale(${fit.k})`; };
const supportName = (support: Support) => typeof support === 'string' ? support : 'on' in support ? `on:${support.on}` : `hangs:${support.hangs}`;

/**
 * The flat wall in canvas CSS, across the whole visible width: the coping (its top is where wall-top things stand), the
 * wall face, and a shade at its foot. No highlights on the face (a9 9 Nov: the pale ovals read as shadows of nothing).
 */
const Wall = () => <g className="courtyard-b-wall">
  <rect x={-2000} y={LINES.wallTop} width={4360} height={WALL_FOOT - LINES.wallTop} fill={C.wall} />
  <rect x={-2000} y={WALL_FOOT - 14} width={4360} height={14} fill={C.wallShade} opacity=".55" />
  <rect x={-2000} y={COPING} width={4360} height={LINES.wallTop - COPING} rx="1.5" fill={C.coping} />
  <rect x={-2000} y={LINES.wallTop - 2.3} width={4360} height={2.3} fill={C.copingDark} opacity=".6" />
</g>;

export interface LayoutBProps {
  anchors: StageAnchors; fit: StageFit; width: number; height: number;
  state: CourtyardState; phase: Phase; onFriend: (id: AreaId) => void;
  /** §0.14: the neem keepsakes (one per reached camp) and what a tap on one does. */
  keepsakes?: readonly Keepsake[]; onKeepsake?: (tag: Keepsake) => void;
}

export function LayoutBScene({ anchors, fit, width, height, state, phase, onFriend, keepsakes = [], onKeepsake }: LayoutBProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const stageOf = (area: AreaId) => state.areas.find(row => row.id === area)?.stage ?? 0;
  // Each part where it stands at this stage (support.ts), drawn back to front: by foot, then DEPTH within a cluster.
  const propsCss = Object.fromEntries(Object.entries(anchors.props).map(([name, rect]) => [name, css(rect)]));
  const parts = PROP_PARTS.filter(row => stageOf(row.area) >= row.from && (row.until === undefined || stageOf(row.area) <= row.until))
    .flatMap(row => { const at = placeAt(row.prop, propsCss, stageOf); return at ? [{ ...row, ...at }] : []; })
    .sort((a, b) => a.rect[1] + a.rect[3] - (b.rect[1] + b.rect[3]) || (DEPTH[a.prop] ?? 1) - (DEPTH[b.prop] ?? 1));
  // Canvas CSS → screen: the fit's scale is per canvas px, so a canvas CSS unit is 3 of them.
  const unit = fit.scale * 3;
  const headerCss = anchors.headerBottom / 3;
  // The sun, moon and clouds sit in the sky that is actually seen, just under the header.
  const bodies = (headerCss / fit.scale + fit.cropTop) / 3;
  const tint = TINT[phase];
  const lit = phase === 'evening' || phase === 'night';
  const treeTransform = `translate(${TREE_AT[0] - 180 * TREE_SCALE} ${TREE_AT[1] - 132 * TREE_SCALE}) scale(${TREE_SCALE})`;
  const toranRect = anchors.props['spec-24-toran'];
  const lanternRect = anchors.props['spec-15-lanterns'];
  const tagRects = [1, 2, 3, 4].map(i => anchors.props[`neem-keepsake-tag-${i}`]).filter((rect): rect is Rect => !!rect).map(css);
  const spots = keepsakeSpots(keepsakes.length, state.treeStage, tagRects);
  return <div className={`courtyard-b courtyard-${phase}`} style={{ width, height } as CSSProperties}>
    <svg className="courtyard-b-scene" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false"
      data-coping={COPING} data-wall-top={LINES.wallTop} data-wall-foot={WALL_FOOT}>
      <g transform={`translate(${fit.offsetX} ${-fit.cropTop * fit.scale}) scale(${unit})`}>
        <rect x={-2000} y={-2000} width={4360} height={2000 + COPING} fill={`url(#${id}sky)`} />
        <g transform={`translate(0 ${bodies})`}><Sky phase={phase} id={id} height={0} /></g>
        <rect x={-2000} y={WALL_FOOT} width={4360} height={4000} fill={C.floor} />
        {/* The stone joints: rows across the whole width, and the tile lines fanning out from the middle, repeated past the
            frame's sides so a wide screen sees one floor (b2: no 360 strip over a wide sky). */}
        <path d={`${Array.from({ length: 30 }, (_, i) => `M-2000 ${WALL_FOOT + 26 + i * 26}h4360`).join('')}${FLOOR_LINES.map(x => `M${x} ${WALL_FOOT}l${(x - 180) * 0.6} 800`).join('')}`} stroke={C.floorLine} strokeWidth=".8" opacity=".35" />
        <Wall />
        <g transform={placed(DOOR_BOX, DOOR_RECT)}><Door /></g>
        {toranRect && <g transform={placed(TORAN_BOX, css(toranRect))}><Toran count={state.toran} /></g>}
        <g transform={treeTransform}><Tree stage={state.treeStage} k={K_GROWTH[state.treeStage]} /></g>
        {spots.some(spot => spot.on === 'board') && <PegBoard />}
        {keepsakes.map((tag, i) => <KeepsakeTag key={tag.campId} tag={tag} spot={spots[i]!} />)}
        {lanternRect && state.lanterns > 0 && <g transform={placed(LANTERNS_BOX, css(lanternRect))}><Lanterns count={state.lanterns} /></g>}
        {parts.map(row => <g key={row.prop} className="courtyard-part" data-prop={row.prop} data-part={row.part} data-support={supportName(row.support)} transform={placed(PARTS[row.part as PartId].box, row.rect)}>{PARTS[row.part as PartId].draw()}</g>)}
        {tint && <rect x={-2000} y={-2000} width={4360} height={6000} fill={tint} />}
        {/* Evening and night: the lights glow through the tint, each where its part stands (b2, 8 Nov). */}
        {lit && <g className="courtyard-b-glow">
          <g transform={treeTransform}><Tree stage={state.treeStage} k={K_GROWTH[state.treeStage]} glowLayer /></g>
          {lanternRect && state.lanterns > 0 && <g transform={placed(LANTERNS_BOX, css(lanternRect))}><Lanterns count={state.lanterns} glowLayer /></g>}
          {parts.filter(row => (PARTS[row.part as PartId] as Part).glow).map(row => { const part = PARTS[row.part as PartId] as Part; return <g key={row.prop} transform={placed(part.box, row.rect)}>{part.glow!()}</g>; })}
        </g>}
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
    {onKeepsake && <div className="courtyard-keepsake-taps">{keepsakes.map((tag, i) => {
      const spot = spots[i]!, k = spot.on === 'board' ? 0.7 : 1;
      // The hit area is the tag plus 5 CSS around it (side by side tags on the bark stay apart); the name and the way to
      // its postcard come in a caption outside the art.
      const [x, y, w, h] = rectOnScreen(fit, [(spot.x - 5) * 3, (spot.y - 5) * 3, (TAG_W * k + 10) * 3, (TAG_H * k + 10) * 3]);
      return <button key={tag.campId} type="button" className="courtyard-keepsake-tap" data-camp={tag.campId} aria-label={`Keepsake from ${tag.campName}`} style={{ left: x, top: y, width: w, height: h }} onClick={() => onKeepsake(tag)} />;
    })}</div>}
  </div>;
}
