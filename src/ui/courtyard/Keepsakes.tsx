import type { Keepsake, TagSpot } from '../../core/courtyard/keepsakes';
import { TAG_H, TAG_W } from '../../core/courtyard/keepsakes';
import { C } from './Scene';

/**
 * Spec 571 §0.14: a neem keepsake, in the courtyard's own flat style. A small painted wooden tag pinned to the bark by a
 * peg (no thread, ribbon, cloth or bell), no letters; each carries its landmark's small motif, and the wood tone varies
 * a little with the order it was reached. It sways a touch from its peg, never under reduced motion (layoutB.css).
 */
const WOOD = ['#d9a066', '#c99056', '#e2b077', '#cf9a5e'];

function Motif({ kind }: { kind: string }) {
  // Drawn in the tag's own 7.2 × 13.7 box, in its painted panel (y 4..12).
  switch (kind) {
    case 'river': return <path d="M1.6 8.2q1 -1 2 0t2 0M1.6 10.2q1 -1 2 0t2 0" stroke="#3f86b8" strokeWidth=".9" fill="none" strokeLinecap="round" />;
    case 'meadow': return <><path d="M3.6 11.6v-3" stroke={C.leafDark} strokeWidth=".8" /><circle cx="3.6" cy="7.6" r="1.3" fill="#ef6f8f" /><path d="M2 11.6q.8 -1.6 1.6 0q.8 -1.6 1.6 0" stroke={C.leaf} strokeWidth=".8" fill="none" /></>;
    case 'glacier': return <path d="M1.4 11.4l2.2 -4.6 2.2 4.6Z" fill="#e8f3f8" stroke="#7fa9c4" strokeWidth=".6" />;
    case 'pass': return <><ellipse cx="3.6" cy="11" rx="2" ry=".8" fill="#9c988a" /><ellipse cx="3.6" cy="9.6" rx="1.5" ry=".7" fill="#b5b2a4" /><ellipse cx="3.6" cy="8.4" rx="1" ry=".6" fill="#cfccc0" /></>;
    case 'camp': return <path d="M1.6 11.4l2 -4 2 4Z" fill="#e5a75b" stroke="#5e5a49" strokeWidth=".5" />;
    default: return <circle cx="3.6" cy="9.2" r="1.6" fill={C.marigold} />;
  }
}

export function KeepsakeTag({ tag, spot }: { tag: Keepsake; spot: TagSpot }) {
  const scale = spot.on === 'board' ? 0.7 : 1;
  return <g className="courtyard-keepsake" data-camp={tag.campId} data-on={spot.on} transform={`translate(${spot.x} ${spot.y}) scale(${scale})`}>
    {/* The peg into the bark (or the board), and the tag hanging straight from it: no string. */}
    <circle cx={TAG_W / 2} cy="1.3" r="1.1" fill={C.woodDark} />
    <g className="courtyard-keepsake-swing">
      <rect x=".3" y="2.4" width={TAG_W - .6} height={TAG_H - 2.6} rx="1.8" fill={WOOD[tag.index % WOOD.length]} stroke={C.woodDark} strokeWidth=".6" />
      <circle cx={TAG_W / 2} cy="3.8" r=".55" fill={C.woodDark} />
      <Motif kind={tag.motif} />
    </g>
  </g>;
}

/** §0.14: from the 12th tag (or while a young trunk has no room), a small wooden peg-board at the tree's foot. */
export function PegBoard() {
  return <g className="courtyard-pegboard">
    <ellipse cx="160" cy="421" rx="17" ry="1.8" fill="#000" opacity=".12" />
    <path d="M146 410v11M174 410v11" stroke={C.woodDark} strokeWidth="1.6" strokeLinecap="round" />
    <rect x="143" y="398" width="34" height="20" rx="1.5" fill={C.wood} stroke={C.woodDark} strokeWidth=".7" />
  </g>;
}
