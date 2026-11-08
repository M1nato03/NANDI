/**
 * A number and its unit never split across lines (rem-pass-2 debt 656f: at 200% text "Chapter 1 · 10 min" broke between
 * "10" and "min"). The space between them is a no-break space (U+00A0); everything else wraps as usual.
 */
export const NBSP = ' ';

/** "10 min" with a no-break space. */
export function minutesLabel(minutes: number): string {
  return `${minutes}${NBSP}min`;
}
