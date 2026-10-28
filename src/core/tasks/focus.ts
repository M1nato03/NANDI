import type { FocusRow } from '../../data/types';
import { RULES } from '../rules.config';

export function focusPhase(
  focus: FocusRow,
  now: number,
): {
  phase: 'work' | 'break' | 'longBreak';
  remainingMs: number;
  cycle: number;
  paused: boolean;
} {
  const long = focus.cyclePreset === '50/10';
  const baseWorkMs =
    (long ? RULES.tasks.focus.presetLong[0] : RULES.tasks.focus.workMin) *
    60_000;
  const breakMs =
    (long ? RULES.tasks.focus.presetLong[1] : RULES.tasks.focus.breakMin) *
    60_000;
  const longBreakMs = RULES.tasks.focus.longBreakMin * 60_000;
  let elapsed = focusElapsedMs(focus, now);
  for (let cycle = 1; cycle < 100_000; cycle++) {
    const workMs = baseWorkMs + (focus.cycleExtensions?.[String(cycle)] ?? 0);
    if (elapsed < workMs)
      return {
        phase: 'work',
        remainingMs: workMs - elapsed,
        cycle,
        paused: !isFocusRunning(focus),
      };
    elapsed -= workMs;
    const last = cycle % RULES.tasks.focus.longBreakEvery === 0;
    const rest = last ? longBreakMs : breakMs;
    if (elapsed < rest)
      return {
        phase: last ? 'longBreak' : 'break',
        remainingMs: rest - elapsed,
        cycle,
        paused: !isFocusRunning(focus),
      };
    elapsed -= rest;
  }
  return {
    phase: 'work',
    remainingMs: baseWorkMs,
    cycle: 100_000,
    paused: !isFocusRunning(focus),
  };
}

export function isFocusRunning(focus: FocusRow): boolean {
  if (focus.endedAt != null) return false;
  const last = focus.pauses?.at(-1);
  return !last || last.resumeAt != null;
}

export function focusElapsedMs(focus: FocusRow, now: number): number {
  const end = focus.endedAt ?? now;
  const paused = (focus.pauses ?? []).reduce((sum, pause) => {
    const resume = pause.resumeAt ?? end;
    return sum + Math.max(0, Math.min(resume, end) - pause.at);
  }, 0);
  return Math.max(0, end - focus.startedAt - paused);
}

/** When the running stretch of a focus began: its start, or its last resume. */
export function runStart(focus: FocusRow): number {
  return focus.pauses?.at(-1)?.resumeAt ?? focus.startedAt;
}

/**
 * Spec 36 "Still working?": `checkMin` minutes after the last touch (a start, a resume or the "still working" tap) the
 * card asks; with no tap for `graceMin` more, the focus pauses itself at the moment it asked, so the untouched minutes
 * after it never count. A focus in pause asks nothing.
 */
export function stillWorking(focus: FocusRow, now: number, checkMin: number, graceMin: number): { ask: boolean; pauseAt?: number } {
  if (!isFocusRunning(focus)) return { ask: false };
  const askAt = Math.max(focus.touchedAt ?? 0, runStart(focus)) + checkMin * 60_000;
  if (now < askAt) return { ask: false };
  return now < askAt + graceMin * 60_000 ? { ask: true } : { ask: false, pauseAt: askAt };
}

/**
 * All the time worked on one task, across every focus it has had (item 214): Stop for now ends a focus, and Start
 * opens a new one, so the clock and the Done line read this total and carry on from where the task left off.
 */
export function taskFocusMs(rows: readonly FocusRow[], taskId: string, now: number): number {
  return rows.reduce((sum, row) => row.taskId === taskId && !row.deleted ? sum + focusElapsedMs(row, now) : sum, 0);
}

export function startFocus(
  taskId: string,
  now: number,
  activeFocus?: FocusRow,
): { newFocus: FocusRow; pausedFocus?: FocusRow } {
  const pausedFocus =
    activeFocus && isFocusRunning(activeFocus)
      ? {
          ...pauseFocus(activeFocus, now),
          switches: (activeFocus.switches ?? 0) + 1,
        }
      : undefined;
  return {
    newFocus: {
      id: `${taskId}-${now}`,
      taskId,
      startedAt: now,
      updatedAt: now,
      deleted: 0,
      deviceId: 'core',
    },
    pausedFocus,
  };
}

export function pauseFocus(focus: FocusRow, now: number): FocusRow {
  if (!isFocusRunning(focus)) return focus;
  return {
    ...focus,
    pauses: [...(focus.pauses ?? []), { at: now }],
    updatedAt: now,
  };
}

export function resumeFocus(focus: FocusRow, now: number): FocusRow {
  const pauses = [...(focus.pauses ?? [])];
  const last = pauses.at(-1);
  if (!last || last.resumeAt != null || focus.endedAt != null) return focus;
  pauses[pauses.length - 1] = { ...last, resumeAt: now };
  return { ...focus, pauses, updatedAt: now };
}

export function finishFocus(focus: FocusRow, now: number): FocusRow {
  if (focus.endedAt != null) return focus;
  return {
    ...focus,
    endedAt: now,
    updatedAt: now,
    overtimeMs: Math.max(
      0,
      focusElapsedMs(focus, now) - (focus.plannedMs ?? 0),
    ),
  };
}
