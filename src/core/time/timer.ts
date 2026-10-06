export interface TimerPause {
  readonly at: number;
  readonly resumeAt?: number;
}

export interface TimerState {
  readonly startedAt: number;
  readonly durationMs: number;
  readonly pauses: readonly TimerPause[];
}

function finiteTimestamp(at: number): void {
  if (!Number.isFinite(at)) {
    throw new RangeError('Expected a finite timestamp');
  }
}

export function createTimer(startedAt: number, durationMs: number): TimerState {
  finiteTimestamp(startedAt);
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new RangeError('Expected a nonnegative duration');
  }
  return { startedAt, durationMs, pauses: [] };
}

export function pauseTimer(timer: TimerState, at: number): TimerState {
  finiteTimestamp(at);
  const lastPause = timer.pauses.at(-1);
  if (at < timer.startedAt || (lastPause && (lastPause.resumeAt === undefined || at < lastPause.resumeAt))) {
    throw new RangeError('Pause must follow the start or previous resume');
  }
  return { ...timer, pauses: [...timer.pauses, { at }] };
}

export function resumeTimer(timer: TimerState, at: number): TimerState {
  finiteTimestamp(at);
  const lastPause = timer.pauses.at(-1);
  if (!lastPause || lastPause.resumeAt !== undefined || at < lastPause.at) {
    throw new RangeError('Resume must follow an active pause');
  }
  return {
    ...timer,
    pauses: [...timer.pauses.slice(0, -1), { ...lastPause, resumeAt: at }],
  };
}

export function timerElapsedMs(timer: TimerState, now: number): number {
  finiteTimestamp(now);
  if (now <= timer.startedAt) {
    return 0;
  }

  const pausedMs = timer.pauses.reduce((total, pause) => {
    const end = Math.min(now, pause.resumeAt ?? now);
    return total + Math.max(0, end - pause.at);
  }, 0);
  return Math.max(0, now - timer.startedAt - pausedMs);
}

export function timerRemainingMs(timer: TimerState, now: number): number {
  return Math.max(0, timer.durationMs - timerElapsedMs(timer, now));
}
