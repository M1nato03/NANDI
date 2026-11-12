import type { FriendId } from '../../core/courtyard/anchors';
import { PATH_LINE, STONE_RX, STONE_RY, TRACK_HALF, type StoneSpot } from '../../core/quests660/path';

/**
 * Spec 660 §2.1 / §7: how far the quest's friend steps toward the card (canvas px, the painted pass's units). Kapi
 * stands on the wall's coping, so he stays there and only holds up the scroll; Mor stops short of her birdbath.
 */
export const FORWARD_DY: Readonly<Record<FriendId, number>> = { mor: 15, moti: 30, kapi: 0, nandi: 24, kachhua: 30, chiku: 30 };

const trackPoints = PATH_LINE.map(([x, y]) => `${x},${y}`).join(' ');

/**
 * The worn track from the door's step, always there (a path the stones are laid on), and the stones themselves: a
 * shadow, the stone, a top light; a polished stone (past the path's 30) gets a warm sheen. Canvas CSS units.
 */
export function QuestStones({ stones }: { stones: readonly StoneSpot[] }) {
  return <g className="courtyard-quest-path" data-stones={stones.length} data-polished={stones.filter(stone => stone.polished).length}>
    {/* Swept ground, a shade lighter than the floor, with soft edges: the path the stones are laid on. */}
    <polyline points={trackPoints} fill="none" stroke="#f6e3bf" strokeOpacity=".5" strokeWidth={TRACK_HALF * 2} strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={trackPoints} fill="none" stroke="#f6e3bf" strokeOpacity=".45" strokeWidth={TRACK_HALF * 2 - 8} strokeLinecap="round" strokeLinejoin="round" />
    {stones.map(stone => <g key={stone.index} className="courtyard-quest-stone" data-slot={stone.index} data-polished={stone.polished || undefined}>
      <ellipse cx={stone.x + 0.4} cy={stone.y + 1.1} rx={STONE_RX} ry={STONE_RY} fill="#8f7a5c" opacity=".45" />
      <ellipse cx={stone.x} cy={stone.y} rx={STONE_RX} ry={STONE_RY} fill={stone.polished ? '#e9d6ad' : '#cdbfa6'} stroke="#7d6a50" strokeWidth=".7" />
      <path d={`M${stone.x - STONE_RX * 0.55} ${stone.y - STONE_RY * 0.25}q${STONE_RX * 0.5} ${-STONE_RY * 0.6} ${STONE_RX * 1.05} ${-STONE_RY * 0.1}`} stroke="#fff" strokeWidth=".8" strokeLinecap="round" fill="none" opacity={stone.polished ? 0.8 : 0.5} />
    </g>)}
  </g>;
}

/** The quest scroll the stepped-forward friend holds out at its side: rolled paper, a red cord. Drawn at 27 × 21 CSS. */
export function QuestScroll() {
  return <svg className="courtyard-quest-scroll" width="27" height="21" viewBox="0 0 18 14" aria-hidden="true" focusable="false">
    <rect x="3" y="2.5" width="12" height="9" rx="1" fill="#f6ead0" stroke="#b08a57" strokeWidth=".8" />
    <rect x="1" y="1.5" width="3.2" height="11" rx="1.6" fill="#e8d3a8" stroke="#b08a57" strokeWidth=".8" />
    <rect x="13.8" y="1.5" width="3.2" height="11" rx="1.6" fill="#e8d3a8" stroke="#b08a57" strokeWidth=".8" />
    <path d="M7 4.6h5M7 7h4M7 9.4h5" stroke="#b08a57" strokeWidth=".7" strokeLinecap="round" />
    <path d="M9 2.5v9" stroke="#c0392b" strokeWidth="1.2" />
  </svg>;
}
