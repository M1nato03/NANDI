import type { FocusRow } from '../../data/types';

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
