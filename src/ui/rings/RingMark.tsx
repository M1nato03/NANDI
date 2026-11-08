import { RING_MARK_STROKE, RING_MARKS, type RingMarkKind } from './marks';

/**
 * Spec 571 §0.20 §marks: what sits inside a lit ring. The app's own line-icon style (DeckGlyph: 24-unit viewBox, round
 * caps and joins), drawn at stroke 2.6 so it still reads at 10 CSS px (~1.1 px), at most 4 strokes each. The header
 * knocks them out of the filled ring in the top bar's background colour (≥3:1 in light and dark, tested when wired).
 * Decorative: the ring's tap line and aria-label say what lit it, so every mark is aria-hidden.
 */
export { BODY_MARK, MIND_MARK, RING_MARK_MAX_STROKES, RING_MARK_STROKE, RING_MARKS, type RingMarkKind } from './marks';

export function RingMark({ kind, size = 10 }: { kind: RingMarkKind; size?: number }) {
  return <svg className={`ring-mark ring-mark-${kind}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false"
    fill="none" stroke="currentColor" strokeWidth={RING_MARK_STROKE} strokeLinecap="round" strokeLinejoin="round">
    {RING_MARKS[kind].map((shape, index) => 'd' in shape ? <path key={index} d={shape.d} />
      : 'circle' in shape ? <circle key={index} cx={shape.circle[0]} cy={shape.circle[1]} r={shape.circle[2]} />
        : <rect key={index} x={shape.rect[0]} y={shape.rect[1]} width={shape.rect[2]} height={shape.rect[3]} rx={shape.rect[4]} transform={shape.rotate ? `rotate(${shape.rotate.join(' ')})` : undefined} />)}
  </svg>;
}
