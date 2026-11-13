import type { FocusRow } from '../../data/types';

/**
 * Spec 571 stage 2 §4: the trek's weather, read-only from the focus rows the trek already reads. It rains while the
 * open focus is paused by the focus guard (a distracting app stayed in front) and that pause has no resume; any other
 * time it is clear. A "Still working?" pause (reason 'still') or your own pause is not weather. Nothing is stored, no
 * usage log is read, and the rain shows no time-away figure.
 */
export type Weather = 'rain' | 'clear';
export const RAIN_LINE = 'Waiting out the rain. Go back to your focus to climb on.';

export function weatherFor(focus: readonly FocusRow[], now: number): Weather {
  const open = focus.find(row => !row.deleted && row.endedAt == null && row.startedAt <= now);
  const last = open?.pauses?.filter(pause => pause.at <= now).at(-1);
  return last && last.reason === 'guard' && last.resumeAt == null ? 'rain' : 'clear';
}
