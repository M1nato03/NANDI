import type { BodyMark, MindAct } from '../../core/economy/daySlots';

/**
 * Spec 571 §0.20 §marks: what sits inside a lit ring. The app's own line-icon style (DeckGlyph: 24-unit viewBox, round
 * caps and joins), drawn at stroke 2.6 so it still reads at 10 CSS px (~1.1 px), at most 4 strokes each. The header
 * knocks them out of the filled ring in the top bar's background colour (≥3:1 in light and dark, tested when wired).
 * Decorative: the ring's tap line and aria-label say what lit it, so every mark is aria-hidden.
 */
export type RingMarkKind = 'feather' | 'dumbbell' | 'shoe' | 'droplet' | 'book' | 'leaf' | 'magnifier' | 'grid' | 'cards' | 'moon';

type Shape = { d: string } | { circle: [cx: number, cy: number, r: number] } | { rect: [x: number, y: number, w: number, h: number, rx: number]; rotate?: [deg: number, cx: number, cy: number] };

export const RING_MARK_STROKE = 2.6;
export const RING_MARK_MAX_STROKES = 4;

export const RING_MARKS: Record<RingMarkKind, readonly Shape[]> = {
  // Yatra: Mor's feather, a quill line with one eye-spot near the tip.
  feather: [{ d: 'M4.5 19.5C9 15 13.5 9.5 19 4.5' }, { d: 'M19 4.5c-.5 6-5 11-11.5 12.5' }, { circle: [15.2, 8.8, 1.7] }],
  // Body: a workout is a short bar with two upright plates; a rest walk is a side-view shoe, toe rising.
  dumbbell: [{ d: 'M7.5 12h9' }, { d: 'M5.5 7.5v9' }, { d: 'M18.5 7.5v9' }],
  shoe: [{ d: 'M3.5 17.5V8h5l2.5 4 5.5 1.5c2.5.7 4 1.8 4 4Z' }, { d: 'M3.5 20.5h17' }],
  // Mind: one mark per act; the main shapes differ (upright drop, V book, 45° leaf, round lens, square lattice, fan).
  droplet: [{ d: 'M12 3.5c3.6 4.6 6 8 6 11a6 6 0 0 1-12 0c0-3 2.4-6.4 6-11Z' }],
  book: [{ d: 'M3 7l9 3 9-3v10.5l-9 3-9-3Z' }, { d: 'M12 10v10.5' }],
  leaf: [{ d: 'M4.5 19.5C4.5 11 11 4.5 19.5 4.5c0 8.5-6.5 15-15 15Z' }, { d: 'M4.5 19.5 14 10' }],
  magnifier: [{ circle: [10.5, 10.5, 6] }, { d: 'm15 15 5.5 5.5' }],
  // The think glyph thickened, with 2 inner lines instead of 4 so it holds at 10 CSS px.
  grid: [{ rect: [4, 4, 16, 16, 2] }, { d: 'M12 4v16' }, { d: 'M4 12h16' }],
  cards: [{ rect: [4, 6.5, 10, 14, 2], rotate: [-8, 9, 13.5] }, { rect: [10, 3.5, 10, 14, 2], rotate: [8, 15, 10.5] }],
  // The night window: every ring shows the moon and hides its marks until morning.
  moon: [{ d: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z' }],
};

export const MIND_MARK: Record<MindAct, RingMarkKind> = { drop: 'droplet', chapter: 'book', calm: 'leaf', case: 'magnifier', board: 'grid', cards: 'cards' };
export const BODY_MARK: Record<BodyMark, RingMarkKind> = { workout: 'dumbbell', walk: 'shoe' };

export function RingMark({ kind, size = 10 }: { kind: RingMarkKind; size?: number }) {
  return <svg className={`ring-mark ring-mark-${kind}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false"
    fill="none" stroke="currentColor" strokeWidth={RING_MARK_STROKE} strokeLinecap="round" strokeLinejoin="round">
    {RING_MARKS[kind].map((shape, index) => 'd' in shape ? <path key={index} d={shape.d} />
      : 'circle' in shape ? <circle key={index} cx={shape.circle[0]} cy={shape.circle[1]} r={shape.circle[2]} />
        : <rect key={index} x={shape.rect[0]} y={shape.rect[1]} width={shape.rect[2]} height={shape.rect[3]} rx={shape.rect[4]} transform={shape.rotate ? `rotate(${shape.rotate.join(' ')})` : undefined} />)}
  </svg>;
}
