import { useRef, type ReactNode } from 'react';
import { Cast, type CastName } from '../cast/Cast';

/**
 * Spec 571 §0.19 layout B: the Courtyard's one compact bottom card. Collapsed: the handle and ONE row. Swiped up (or
 * opened with its button, for anyone who can't swipe): the row, then the sheet's sections in order.
 * Shaped for spec 660 (later, b2 8 Nov): the row is generic (stage 2 fills it with the one next move; 660's Quest board
 * fills it with "Chiku has a quest · 5 min" when no move is due), and the sheet is an ordered list of sections where
 * "This week" and the crew bar stay at the bottom, so the board can sit above them. Height follows the content; at
 * 200% text the card simply grows and the row stays on screen.
 */
export const SWIPE_PX = 36;

/** A vertical drag on the handle: up past SWIPE_PX opens, down past it closes, anything shorter changes nothing. */
export function swipeTo(expanded: boolean, dy: number): boolean {
  if (dy <= -SWIPE_PX) return true;
  if (dy >= SWIPE_PX) return false;
  return expanded;
}

export interface CardRow { friend?: CastName; line: ReactNode; meta?: ReactNode; onOpen: () => void; kind?: string }
export interface CardSection { id: string; node: ReactNode }
/** Sections that always close the sheet, in this order (spec 660 puts its board above them). */
export const SHEET_TAIL = ['week', 'crew'] as const;

/** Orders the sheet: every other section first, in the order given, then This week and the crew bar. */
export function orderSections(sections: readonly CardSection[]): CardSection[] {
  const tail = (id: string) => (SHEET_TAIL as readonly string[]).indexOf(id);
  return [...sections.filter(section => tail(section.id) < 0), ...SHEET_TAIL.flatMap(id => sections.filter(section => section.id === id))];
}

/** The collapsed card's one row: a friend (optional), the line, a quiet meta line, one tap to open. */
export function HomeCardRow({ row }: { row: CardRow }) {
  return <button type="button" className="courtyard-card-row" data-kind={row.kind} onClick={row.onOpen}>
    {row.friend && <span className="courtyard-card-friend" aria-hidden="true"><Cast name={row.friend} pose="idle" size={40} /></span>}
    <span className="courtyard-card-text"><strong>{row.line}</strong>{row.meta && <span className="courtyard-card-meta">{row.meta}</span>}</span>
    <span className="courtyard-card-arrow" aria-hidden="true">↗</span>
  </button>;
}

/**
 * `ready` (data-ready) marks the row as settled at load: everything it depends on has loaded, so it does not swap while
 * the page is still loading. It can still change later on purpose (a move falls due with the clock, a quest is done).
 */
export function HomeCard({ expanded, onExpanded, row, sections, ready = true }: { expanded: boolean; onExpanded: (open: boolean) => void; row: ReactNode; sections: readonly CardSection[]; ready?: boolean }) {
  const start = useRef<number | null>(null);
  // A swipe ends in a click on the same button; that click must not toggle the card back.
  const swiped = useRef(false);
  return <section className={`courtyard-card${expanded ? ' is-open' : ''}`} aria-label="Today" data-ready={ready ? '' : undefined}>
    <button type="button" className="courtyard-card-handle" aria-expanded={expanded} aria-controls="courtyard-card-more"
      aria-label={expanded ? 'Show less' : 'Show this week and your crew'}
      onClick={() => { if (swiped.current) { swiped.current = false; return; } onExpanded(!expanded); }}
      onPointerDown={event => { start.current = event.clientY; event.currentTarget.setPointerCapture?.(event.pointerId); }}
      onPointerUp={event => { if (start.current === null) return; const dy = event.clientY - start.current; start.current = null; if (Math.abs(dy) >= SWIPE_PX) { swiped.current = true; onExpanded(swipeTo(expanded, dy)); } }}
      onPointerCancel={() => { start.current = null; }}>
      <span className="courtyard-card-grip" aria-hidden="true" />
    </button>
    <div className="courtyard-card-next">{row}</div>
    <div id="courtyard-card-more" className="courtyard-card-more" hidden={!expanded}>
      {orderSections(sections).map(section => <div key={section.id} className="courtyard-card-section" data-section={section.id}>{section.node}</div>)}
    </div>
  </section>;
}
