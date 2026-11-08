import { useRef, type ReactNode } from 'react';

/**
 * Spec 571 §0.19 layout B: the Courtyard's one compact bottom card. Collapsed: the handle and the one next move only.
 * Swiped up (or opened with its button, for anyone who can't swipe): the next move, "This week" and the crew bar.
 * At 200% text the card simply grows (the next move stays on screen; the courtyard's front row lifts above it).
 */
export const SWIPE_PX = 36;

/** A vertical drag on the handle: up past SWIPE_PX opens, down past it closes, anything shorter changes nothing. */
export function swipeTo(expanded: boolean, dy: number): boolean {
  if (dy <= -SWIPE_PX) return true;
  if (dy >= SWIPE_PX) return false;
  return expanded;
}

export function HomeCard({ expanded, onExpanded, next, rest }: { expanded: boolean; onExpanded: (open: boolean) => void; next: ReactNode; rest: ReactNode }) {
  const start = useRef<number | null>(null);
  // A swipe ends in a click on the same button; that click must not toggle the card back.
  const swiped = useRef(false);
  return <section className={`courtyard-card${expanded ? ' is-open' : ''}`} aria-label="Today">
    <button type="button" className="courtyard-card-handle" aria-expanded={expanded} aria-controls="courtyard-card-more"
      aria-label={expanded ? 'Show less' : 'Show this week and your crew'}
      onClick={() => { if (swiped.current) { swiped.current = false; return; } onExpanded(!expanded); }}
      onPointerDown={event => { start.current = event.clientY; event.currentTarget.setPointerCapture?.(event.pointerId); }}
      onPointerUp={event => { if (start.current === null) return; const dy = event.clientY - start.current; start.current = null; if (Math.abs(dy) >= SWIPE_PX) { swiped.current = true; onExpanded(swipeTo(expanded, dy)); } }}
      onPointerCancel={() => { start.current = null; }}>
      <span className="courtyard-card-grip" aria-hidden="true" />
    </button>
    <div className="courtyard-card-next">{next}</div>
    <div id="courtyard-card-more" className="courtyard-card-more" hidden={!expanded}>{rest}</div>
  </section>;
}
